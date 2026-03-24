// ==UserScript==
// @name         Auto Microsoft Reword Points Cards 1 of 3 | Clicks on cards
// @namespace    https://github.com/kyxap/tampermonkey-userscripts/
// @version      0.2.5
// @description  Get Microsoft points automatically (Ensures everything opens in new tabs)
// @author       kyxap | https://github.com/kyxap
// @match        https://rewards.bing.com/?form=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/cards/auto-reward-points.user.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/cards/auto-reward-points.user.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

const reloadInterval = 3600 * 5 * 1000; // 5 hours in milliseconds
const BING_REWARDS_SEARCH_BASE = 'https://www.bing.com/?form=ML2PCR&OCID=ML2PCR&PUBL=RewardsDO&CREA=ML2PCR&PC=ML2PCR&rwAutoFlyout=exb';
const MAX_CLICKS_PER_CARD = 3;
const DEFAULT_AI_BASE_URL = 'http://localhost:5433';

// Base selectors for clickable icon/image inside a card.
const cardsBaseCSS = '.mee-icon-AddMedium[aria-label="plus"], .image-icon, .c-image';
const cardsDailySetCSS = '[points="$ctrl.item.points"] ' + cardsBaseCSS;
const cardsMoreActivitiesCSS = '[points="item.points"] ' + cardsBaseCSS;

(function () {
    'use strict';

    const now = new Date();
    const reloadTime = new Date(now.getTime() + reloadInterval);
    
    console.log(`%c[Cards Automation] Status Update:`, 'font-weight: bold; color: #ffb900;');
    console.log(`> Last updated: ${now.toLocaleTimeString()}`);
    console.log(`> Next scheduled reload: ${reloadTime.toLocaleTimeString()}`);
    console.log(`-----------------------------------------`);

    const lastResetDate = GM_getValue('lastResetDate', '');
    const todayStr = now.toDateString();
    if (lastResetDate !== todayStr) {
        GM_setValue('clickCounts', {});
        GM_setValue('lastResetDate', todayStr);
    }

    try {
        const params = new URLSearchParams(window.location.search);
        if (params.has('data')) return;
    } catch (e) {}

    createDebugUI();
    findAndClick();

    setInterval(() => {
        console.log("[Cards] Scheduled reload triggered.");
        location.reload();
    }, reloadInterval);

})();

function getCardText(card, container) {
    let text = container ? container.getAttribute('aria-label') : null;
    if (text) return text.trim();
    text = card.getAttribute('alt') || card.getAttribute('title');
    if (text) return text.trim();
    const link = card.closest('a');
    if (link) text = link.getAttribute('title');
    if (text) return text.trim();
    if (container) text = container.innerText;
    return text ? text.trim().split('\n')[0] : null;
}

function handleCardAction(card, cardText) {
    const counts = GM_getValue('clickCounts', {});
    const clickCount = counts[cardText] || 0;

    if (clickCount >= MAX_CLICKS_PER_CARD) {
        console.log(`Skipping card "${cardText}" (Limit ${MAX_CLICKS_PER_CARD} reached)`);
        return false;
    }

    console.log(`Working on card: "${cardText}" (Click ${clickCount + 1}/${MAX_CLICKS_PER_CARD})`);
    
    const link = card.closest('a');
    if (link && link.href && !link.href.includes('javascript:void(0)')) {
        console.log(`[Cards] Opening in background tab: ${link.href}`);
        GM_openInTab(link.href, { active: false, insert: true });
    } else {
        card.click();
    }
    
    counts[cardText] = clickCount + 1;
    GM_setValue('clickCounts', counts);
    return true;
}

function findAndClick() {
    window.addEventListener('load', function () {
        const dailyCards = document.querySelectorAll(cardsDailySetCSS);
        const moreCards = document.querySelectorAll(cardsMoreActivitiesCSS);

        dailyCards.forEach(card => {
            const container = card.closest('.rewards-card-container') || card.closest('.ds-card-sec');
            const text = getCardText(card, container);
            if (text) handleCardAction(card, text);
        });

        moreCards.forEach(card => {
            const link = card.closest('a');
            if (link && link.href.includes('rewards.bing.com')) return;

            const container = card.closest('.rewards-card-container') || card.closest('.ds-card-sec');
            const text = getCardText(card, container);
            
            if (text && handleCardAction(card, text)) {
                askAI(text, function (result) {
                    if (result) {
                        const encodedQuery = encodeURIComponent(result);
                        const baseHref = (link && link.href && link.href.includes('bing.com')) ? link.href : BING_REWARDS_SEARCH_BASE;
                        const finalUrl = baseHref + (baseHref.includes('?') ? '&' : '?') + 'data=' + encodedQuery;
                        console.log("[Cards] Opening AI search tab: " + finalUrl);
                        GM_openInTab(finalUrl, { active: false, insert: true });
                    }
                });
            }
        });
    });
}

function createDebugUI() {
    GM_addStyle(`
        #rewards-debug-ui { position: fixed; bottom: 20px; right: 20px; background: #fff; border: 2px solid #00a1f1; padding: 10px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: sans-serif; font-size: 12px; display: flex; flex-direction: column; gap: 5px; }
        #rewards-debug-ui h3 { margin: 0 0 5px 0; font-size: 14px; color: #00a1f1; }
        #rewards-debug-ui button { background: #00a1f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
        #rewards-debug-ui input { border: 1px solid #ccc; padding: 3px; border-radius: 4px; }
    `);
    const container = document.createElement('div');
    container.id = 'rewards-debug-ui';
    container.innerHTML = `<h3>Rewards Debug</h3><button id="btn-reset-clicks">Reset Click Counts</button><div style="display:flex; flex-direction:column; gap:2px;"><label>AI URL:</label><input type="text" id="ai-url-input"><button id="btn-save-ai-url">Save URL</button></div>`;
    document.body.appendChild(container);
    const aiUrlInput = document.getElementById('ai-url-input');
    aiUrlInput.value = GM_getValue('aiBaseUrl', DEFAULT_AI_BASE_URL);
    document.getElementById('btn-reset-clicks').onclick = () => { GM_setValue('clickCounts', {}); alert('Click counts reset!'); };
    document.getElementById('btn-save-ai-url').onclick = () => { GM_setValue('aiBaseUrl', aiUrlInput.value.trim()); alert('AI URL saved!'); };
}

function askAI(prompt, callback) {
    const task = `Generate a one-line search query based on the following task: ${prompt}. The query should be concise and directly relevant to the user's needs. Please avoid using quotes in your example`;
    const aiBaseUrl = GM_getValue('aiBaseUrl', DEFAULT_AI_BASE_URL);
    GM_xmlhttpRequest({
        method: "GET", url: `${aiBaseUrl}/api/generate?prompt=${encodeURIComponent(task)}`, timeout: 30000,
        onload: function (r) { callback(r.status === 200 ? r.responseText : null); },
        onerror: () => callback(null), ontimeout: () => callback(null)
    });
}
