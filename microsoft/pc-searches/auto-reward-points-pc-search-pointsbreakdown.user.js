// ==UserScript==
// @name         Auto Microsoft Reword Points PC Searches 1 of 3 | PC Searches Points Breakdown
// @namespace    https://github.com/kyxap/tampermonkey-userscripts/
// @version      0.1.10
// @description  PC Searches Points Breakdown (Ensures everything opens in new tabs)
// @match        https://rewards.bing.com/pointsbreakdown*
// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_openInTab
// @run-at       document-end
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

const searchesCounterCSS = `[ng-bind-html="$ctrl.pointProgressText"]`;
const linkToPCSearchCSS = `#pointsCounters_pcSearchLevel2_0, #pointsCounters_pcSearch_0, [id^="pointsCounters_pcSearch"], a[href*="PC Search"]`;

const BASE_WAIT = 30000; // 30s
const RELOAD_INTERVAL = 3600 * 5 * 1000; // 5 hours
const STUCK_RELOAD_DELAY = 15 * 60 * 1000; // 15 minutes
const DEFAULT_AI_BASE_URL = 'http://localhost:5433';

(function () {
    'use strict';
    
    const now = new Date();
    const reloadTime = new Date(now.getTime() + reloadInterval);
    
    console.log(`%c[PC Breakdown] Status Update:`, 'font-weight: bold; color: #00a1f1;');
    console.log(`> Last updated: ${now.toLocaleTimeString()}`);
    console.log(`> Next scheduled reload: ${reloadTime.toLocaleTimeString()}`);
    console.log(`-----------------------------------------`);

    createDebugUI();

    function init() {
        let attempts = 0;
        const checkExist = setInterval(function() {
            attempts++;
            const counters = document.querySelectorAll(searchesCounterCSS);
            if (counters.length > 0) {
                console.log("[PC] Search counters found. Starting automation...");
                clearInterval(checkExist);
                processSearches();
            } else if (attempts > 30) {
                console.error("[PC] Could not find search counters. Refreshing page...");
                location.reload();
            }
        }, 1000);
    }

    setTimeout(init, 5000);

    setInterval(() => {
        console.log("[PC] Scheduled reload triggered.");
        location.reload();
    }, RELOAD_INTERVAL);

})();

function createDebugUI() {
    GM_addStyle(`
        #rewards-debug-ui { position: fixed; bottom: 20px; right: 20px; background: #fff; border: 2px solid #00a1f1; padding: 10px; border-radius: 8px; z-index: 9999; box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-family: sans-serif; font-size: 12px; display: flex; flex-direction: column; gap: 5px; }
        #rewards-debug-ui h3 { margin: 0 0 5px 0; font-size: 14px; color: #00a1f1; }
        #rewards-debug-ui button { background: #00a1f1; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; }
        #rewards-debug-ui input { border: 1px solid #ccc; padding: 3px; border-radius: 4px; }
    `);
    const container = document.createElement('div');
    container.id = 'rewards-debug-ui';
    container.innerHTML = `<h3>Search Debug</h3><button id="btn-reset-stuck">Reset Stuck Count</button><div style="display:flex; flex-direction:column; gap:2px;"><label>AI URL:</label><input type="text" id="ai-url-input"><button id="btn-save-ai-url">Save URL</button></div>`;
    document.body.appendChild(container);
    const aiUrlInput = document.getElementById('ai-url-input');
    aiUrlInput.value = GM_getValue('aiBaseUrl', DEFAULT_AI_BASE_URL);
    document.getElementById('btn-reset-stuck').onclick = () => { GM_setValue('pc_stuck_count', 0); GM_setValue('pc_stuck_timestamp', 0); location.reload(); };
    document.getElementById('btn-save-ai-url').onclick = () => { GM_setValue('aiBaseUrl', aiUrlInput.value.trim()); alert('AI URL saved!'); };
}

async function processSearches() {
    function getCount(el, idx) {
        if (!el || !el.textContent) return 0;
        const p = el.textContent.split('/');
        return p.length > 1 ? parseInt(p[idx].trim(), 10) : 0;
    }

    let allCounters = document.querySelectorAll(searchesCounterCSS);
    let pcCounter, mobileCounter;

    allCounters.forEach(counter => {
        const container = counter.closest('.pointsBreakdownItem') || counter.parentElement;
        const text = container.textContent.toLowerCase();
        if (text.includes('pc search')) pcCounter = counter;
        if (text.includes('mobile search')) mobileCounter = counter;
    });

    if (pcCounter) {
        let lastCount = getCount(pcCounter, 0);
        let maxPC = getCount(pcCounter, 1);
        let stuckCount = GM_getValue('pc_stuck_count', 0);
        const lastStuckTimestamp = GM_getValue('pc_stuck_timestamp', 0);
        
        if (Date.now() - lastStuckTimestamp < STUCK_RELOAD_DELAY) {
            console.warn(`[PC] In cooldown.`);
            setTimeout(() => location.reload(), STUCK_RELOAD_DELAY - (Date.now() - lastStuckTimestamp));
            return;
        }

        if (lastCount < maxPC) {
            const pcLink = document.querySelector(linkToPCSearchCSS);
            if (pcLink && pcLink.href) {
                console.log(`[PC] Opening search tab in background: ${pcLink.href}`);
                GM_openInTab(pcLink.href, { active: false, insert: true });
                await new Promise(r => setTimeout(r, BASE_WAIT));
                location.reload(); 
            } else {
                console.error("[PC] Search link not found.");
                location.reload();
            }
        } else {
            console.log("[PC] All PC searches complete!");
            GM_setValue('pc_stuck_count', 0); 
        }
    }

    if (mobileCounter) {
        let doneMobile = getCount(mobileCounter, 0);
        let maxMobile = getCount(mobileCounter, 1);
        if (doneMobile < maxMobile) {
            GM_setValue('triggerSearches', { pcCount: 0, mobileCount: Math.ceil((maxMobile - doneMobile) / 3), timestamp: Date.now() });
        }
    }
}
