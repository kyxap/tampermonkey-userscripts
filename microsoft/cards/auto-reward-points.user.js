// ==UserScript==
// @name         Auto Microsoft Reword Points Cards 1 of 3 | Clicks on cards
// @namespace    https://github.com/kyxap/tampermonkey-userscripts/
// @version      0.2.4
// @description  Get Microsoft points automatically (with status logging, click limits, and debug UI)
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
// control whether searches open in a new tab (keeps main rewards page visible)
const openSearchInNewTab = true;
// Always use this for "More Activities" search tabs so we never open rewards.bing.com and loop
const BING_REWARDS_SEARCH_BASE = 'https://www.bing.com/?form=ML2PCR&OCID=ML2PCR&PUBL=RewardsDO&CREA=ML2PCR&PC=ML2PCR&rwAutoFlyout=exb';

const MAX_CLICKS_PER_CARD = 3;
const DEFAULT_AI_BASE_URL = 'http://localhost:5433';

// Base selectors for clickable icon/image inside a card.
const cardsBaseCSS = '.mee-icon-AddMedium[aria-label="plus"], .image-icon, .c-image';
// First 3 cards on top (Daily set)
const cardsDailySetCSS = '[points="$ctrl.item.points"] ' + cardsBaseCSS;
// More activities section below.
const cardsMoreActivitiesCSS = '[points="item.points"] ' + cardsBaseCSS;

(function () {
    'use strict';

    const now = new Date();
    const reloadTime = new Date(now.getTime() + reloadInterval);
    
    console.log(`%c[Cards Automation] Status Update:`, 'font-weight: bold; color: #ffb900;');
    console.log(`> Last updated: ${now.toLocaleTimeString()}`);
    console.log(`> Next scheduled reload: ${reloadTime.toLocaleTimeString()}`);
    console.log(`-----------------------------------------`);

    // Reset click counts if it's a new day
    const lastResetDate = GM_getValue('lastResetDate', '');
    const todayStr = now.toDateString();
    if (lastResetDate !== todayStr) {
        console.log('[Cards Automation] New day detected, resetting click counts.');
        GM_setValue('clickCounts', {});
        GM_setValue('lastResetDate', todayStr);
    }

    // Avoid recursive loops: if this rewards page was opened with a "data"
    // query parameter (from our own script), do nothing here.
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.has('data')) {
            console.log('[Auto Rewards Cards] Detected rewards page with data param, skipping automation to avoid loops.');
            return;
        }
    } catch (e) {
        console.warn('[Auto Rewards Cards] Failed to inspect URL parameters, continuing anyway.', e);
    }

    createDebugUI();
    findAndClick();

    // Set interval to reload the page every n hours and start over
    setInterval(function () {
        console.log("[Cards] Scheduled reload triggered.");
        location.reload();
    }, reloadInterval);

})();

function createDebugUI() {
    GM_addStyle(`
        #rewards-debug-ui {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #fff;
            border: 2px solid #00a1f1;
            padding: 10px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            font-family: sans-serif;
            font-size: 12px;
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        #rewards-debug-ui h3 { margin: 0 0 5px 0; font-size: 14px; color: #00a1f1; }
        #rewards-debug-ui button {
            background: #00a1f1;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: background 0.2s;
        }
        #rewards-debug-ui button:hover { background: #0078d4; }
        #rewards-debug-ui input {
            border: 1px solid #ccc;
            padding: 3px;
            border-radius: 4px;
        }
    `);

    const container = document.createElement('div');
    container.id = 'rewards-debug-ui';
    container.innerHTML = `
        <h3>Rewards Debug</h3>
        <button id="btn-reset-clicks">Reset Click Counts</button>
        <div style="display:flex; flex-direction:column; gap:2px;">
            <label>AI URL:</label>
            <input type="text" id="ai-url-input" placeholder="http://localhost:5433">
            <button id="btn-save-ai-url">Save URL</button>
        </div>
    `;
    document.body.appendChild(container);

    const aiUrlInput = document.getElementById('ai-url-input');
    aiUrlInput.value = GM_getValue('aiBaseUrl', DEFAULT_AI_BASE_URL);

    document.getElementById('btn-reset-clicks').onclick = () => {
        GM_setValue('clickCounts', {});
        console.log('[Debug UI] Click counts reset.');
        alert('Click counts reset for all cards!');
    };

    document.getElementById('btn-save-ai-url').onclick = () => {
        const newUrl = aiUrlInput.value.trim();
        if (newUrl) {
            GM_setValue('aiBaseUrl', newUrl);
            console.log(`[Debug UI] AI Base URL saved: ${newUrl}`);
            alert(`AI Base URL saved: ${newUrl}`);
        }
    };
}

function getClickCount(cardId) {
    const counts = GM_getValue('clickCounts', {});
    return counts[cardId] || 0;
}

function incrementClickCount(cardId) {
    const counts = GM_getValue('clickCounts', {});
    counts[cardId] = (counts[cardId] || 0) + 1;
    GM_setValue('clickCounts', counts);
}

function getCardText(card, container) {
    // 1. Try aria-label on container
    let text = container ? container.getAttribute('aria-label') : null;
    if (text) return text.trim();

    // 2. Try alt on card (img)
    text = card.getAttribute('alt');
    if (text) return text.trim();

    // 3. Try title on card
    text = card.getAttribute('title');
    if (text) return text.trim();

    // 4. Try title on parent anchor
    const link = card.closest('a');
    if (link) {
        text = link.getAttribute('title');
        if (text) return text.trim();
    }

    // 5. Try innerText of container (last resort)
    if (container) {
        text = container.innerText;
        if (text) return text.trim().split('\n')[0]; // Just the first line
    }

    return null;
}

function findAndClick() {
    // Wait for the page to load and then execute the script
    window.addEventListener('load', function () {
            let cardMoreActivitiesElements = document.querySelectorAll(cardsMoreActivitiesCSS);
            const cardDailySetElements = document.querySelectorAll(cardsDailySetCSS);

            // top 3 cards that need only click without custom search query
            if (cardDailySetElements.length > 0) {
                console.log('===> Daily sets elements found, checking before click');

                cardDailySetElements.forEach(function (card) {
                        const container = card.closest('.rewards-card-container') || card.closest('.ds-card-sec');
                        const cardText = getCardText(card, container);
                        
                        if (!cardText) {
                            console.warn('Daily set card: could not find any text for card, skipping.', card);
                            return;
                        }
                        
                        // Check click limit
                        const clickCount = getClickCount(cardText);
                        if (clickCount >= MAX_CLICKS_PER_CARD) {
                            console.log(`Skipping card "${cardText}" because it was clicked ${clickCount} times already today.`);
                            return;
                        }

                        console.log(`Working on card with a text: "${cardText}" (Click ${clickCount + 1}/${MAX_CLICKS_PER_CARD})`);
                        card.click();
                        incrementClickCount(cardText);
                    }
                )
            } else {
                console.info('Got all card points from cardDailySetElements');
            }

            // cards that for most cases requires custom search request on bing
            if (cardMoreActivitiesElements.length > 0) {
                console.log('===> More Activities Elements found, checking before click');

                cardMoreActivitiesElements.forEach(function (card) {
                        const link = card.closest('a');
                        if (link && link.href.includes('rewards.bing.com')) {
                            console.log('Skipping more-activities card that points back to rewards.bing.com to avoid loops:', link.href);
                            return;
                        }
                        
                        const container = card.closest('.rewards-card-container') || card.closest('.ds-card-sec');
                        const cardText = getCardText(card, container);

                        if (!cardText) {
                            console.warn('More activities card: could not find any text for card, skipping.', card);
                            return;
                        }
                        
                        // Check click limit
                        const clickCount = getClickCount(cardText);
                        if (clickCount >= MAX_CLICKS_PER_CARD) {
                            console.log(`Skipping more-activities card "${cardText}" because it was clicked ${clickCount} times already today.`);
                            return;
                        }

                        console.log(`Working on card with a text: "${cardText}" (Click ${clickCount + 1}/${MAX_CLICKS_PER_CARD})`);
                        card.click();
                        incrementClickCount(cardText);

                        askAI(cardText, function (result) {
                            if (result) {
                                const encodedQuery = encodeURIComponent(result);
                                const link = card.closest('a');
                                const isBingSearch = link && link.href && link.href.includes('bing.com') && !link.href.includes('rewards.bing.com');
                                const baseHref = isBingSearch ? link.href : BING_REWARDS_SEARCH_BASE;
                                const cardUrlWithData = baseHref + (baseHref.includes('?') ? '&' : '?') + 'data=' + encodedQuery;

                                console.log("Final query for card:", result);
                                if (openSearchInNewTab) {
                                    console.log("Opening new tab with encoded query: " + cardUrlWithData);
                                    if (typeof GM_openInTab === 'function') {
                                        GM_openInTab(cardUrlWithData, { active: false, insert: true });
                                    } else {
                                        const opened = window.open(cardUrlWithData, '_blank');
                                        if (!opened) {
                                            console.warn('window.open was blocked by the browser or failed to open.');
                                        }
                                    }
                                } else {
                                    console.log("Navigating current tab with encoded query: " + cardUrlWithData);
                                    window.location.href = cardUrlWithData;
                                }

                            } else {
                                console.error("No result received so going to open but next script will close it right a way");
                            }
                        });
                    }
                )
            } else {
                console.info('Got all card points from cardMoreActivitiesElements with primary selector, trying fallback selector.');

                // Fallback: grab any remaining visible, unlocked cards by generic structure.
                cardMoreActivitiesElements = document.querySelectorAll('.ds-card-sec[aria-label] ' + cardsBaseCSS);

                if (cardMoreActivitiesElements.length > 0) {
                    console.log('===> Fallback More Activities Elements found, checking before click');

                    cardMoreActivitiesElements.forEach(function (card) {
                            const container = card.closest('.ds-card-sec');
                            const cardText = getCardText(card, container);
                            
                            if (!cardText) {
                                return;
                            }
                            
                            // Check click limit
                            const clickCount = getClickCount(cardText);
                            if (clickCount >= MAX_CLICKS_PER_CARD) {
                                console.log(`Skipping fallback card "${cardText}" because it was clicked ${clickCount} times already today.`);
                                return;
                            }

                            console.log(`(Fallback) Working on card with a text: "${cardText}" (Click ${clickCount + 1}/${MAX_CLICKS_PER_CARD})`);
                            card.click();
                            incrementClickCount(cardText);

                            askAI(cardText, function (result) {
                                if (result) {
                                    const encodedQuery = encodeURIComponent(result);
                                    const link = card.closest('a');
                                    const isBingSearch = link && link.href && link.href.includes('bing.com') && !link.href.includes('rewards.bing.com');
                                    const baseHref = isBingSearch ? link.href : BING_REWARDS_SEARCH_BASE;
                                    const cardUrlWithData = baseHref + (baseHref.includes('?') ? '&' : '?') + 'data=' + encodedQuery;

                                    console.log("(Fallback) Final query for card:", result);
                                    if (openSearchInNewTab) {
                                        console.log("(Fallback) Opening new tab with encoded query: " + cardUrlWithData);
                                        if (typeof GM_openInTab === 'function') {
                                            GM_openInTab(cardUrlWithData, { active: false, insert: true });
                                        } else {
                                            const opened = window.open(cardUrlWithData, '_blank');
                                            if (!opened) {
                                                console.warn('(Fallback) window.open was blocked by the browser or failed to open.');
                                            }
                                        }
                                    } else {
                                        console.log("(Fallback) Navigating current tab with encoded query: " + cardUrlWithData);
                                        window.location.href = cardUrlWithData;
                                    }

                                } else {
                                    console.error("(Fallback) No result received so going to open but next script will close it right a way");
                                }
                            });
                        }
                    );
                } else {
                    console.info('Got all card points from cardMoreActivitiesElements including fallback.');
                }
            }
        }
    )
}

// requires AI chat model to work on your local, let me know if you interested and I can share this project
function askAI(prompt, callback) {
    const task = `Generate a one-line search query based on the following task: ${prompt}. The query should be concise and directly relevant to the user's needs. Please avoid using quotes in your example`;
    const aiBaseUrl = GM_getValue('aiBaseUrl', DEFAULT_AI_BASE_URL);

    function buildFallbackQuery() {
        try {
            const cleaned = prompt
                .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width chars
                .replace(/[,|]/g, ' ')
                .replace(/[^\w\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            const words = cleaned.split(' ');
            const fallback = words.slice(0, 10).join(' ');
            return fallback || 'bing daily set';
        } catch (e) {
            console.error('Failed to build fallback query, using default.', e);
            return 'bing daily set';
        }
    }

    // Call your AI API
    GM_xmlhttpRequest({
        method: "GET",
        url: `${aiBaseUrl}/api/generate?prompt=${encodeURIComponent(task)}`,
        timeout: 30000,
        onload: function (response) {
            if (response.status === 200) {
                const result = response.responseText;
                console.log("Generated Query:", result);
                callback(result || buildFallbackQuery()); // Call the callback with the result
            } else {
                console.error("Error from AI service, using fallback query instead:", response.status, response.statusText);
                const fallback = buildFallbackQuery();
                console.log('Fallback Query (service error):', fallback);
                callback(fallback);
            }
        },
        onerror: function (error) {
            console.error("Request to local AI service failed, using fallback query instead:", error);
            const fallback = buildFallbackQuery();
            console.log('Fallback Query (request failure):', fallback);
            callback(fallback);
        },
        ontimeout: function () {
            console.error("Request to local AI service timed out, using fallback query instead.");
            const fallback = buildFallbackQuery();
            console.log('Fallback Query (timeout):', fallback);
            callback(fallback);
        }
    });
}
