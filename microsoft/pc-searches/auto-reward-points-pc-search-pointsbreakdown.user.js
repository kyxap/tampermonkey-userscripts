// ==UserScript==
// @name         Auto Microsoft Reword Points PC Searches 1 of 3 | PC Searches Points Breakdown
// @namespace    https://github.com/kyxap/tampermonkey-userscripts/
// @version      0.1.8
// @description  PC Searches Points Breakdown (Sequential Tab-based searching with persisted stuck detection)
// @match        https://rewards.bing.com/pointsbreakdown*
// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

const searchesCounterCSS = `[ng-bind-html="$ctrl.pointProgressText"]`;
const linkToPCSearchCSS = `#pointsCounters_pcSearchLevel2_0, #pointsCounters_pcSearch_0, [id^="pointsCounters_pcSearch"], a[href*="PC Search"]`;

// COOLDOWN SETTINGS
const BASE_WAIT = 30000; // Increased to 30s to be even safer
const RELOAD_INTERVAL = 3600 * 5 * 1000; // 5 hours
const STUCK_RELOAD_DELAY = 15 * 60 * 1000; // 15 minutes

(function () {
    'use strict';
    
    const now = new Date();
    const reloadTime = new Date(now.getTime() + RELOAD_INTERVAL);
    
    console.log(`%c[PC Breakdown] Status Update:`, 'font-weight: bold; color: #00a1f1;');
    console.log(`> Last updated: ${now.toLocaleTimeString()}`);
    console.log(`> Next scheduled reload: ${reloadTime.toLocaleTimeString()}`);
    console.log(`-----------------------------------------`);

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

    // Scheduled reload
    setInterval(() => {
        console.log("[PC] Scheduled reload triggered.");
        location.reload();
    }, RELOAD_INTERVAL);

})();

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
        
        // PERSISTED STUCK DETECTION
        let stuckCount = GM_getValue('pc_stuck_count', 0);
        const lastStuckTimestamp = GM_getValue('pc_stuck_timestamp', 0);
        
        // If we are currently in a 15-minute cooldown, don't do anything
        if (Date.now() - lastStuckTimestamp < STUCK_RELOAD_DELAY) {
            const remaining = Math.round((STUCK_RELOAD_DELAY - (Date.now() - lastStuckTimestamp)) / 60000);
            console.warn(`[PC] In cooldown. Waiting ${remaining} more minutes.`);
            setTimeout(() => location.reload(), STUCK_RELOAD_DELAY - (Date.now() - lastStuckTimestamp));
            return;
        }

        console.log(`[PC] Starting searches. Current: ${lastCount}/${maxPC} (Stuck count: ${stuckCount})`);

        if (lastCount < maxPC) {
            const pcLink = document.querySelector(linkToPCSearchCSS);
            if (!pcLink) {
                console.error("[PC] Search link not found. Refreshing...");
                location.reload();
                return;
            }

            console.log(`[PC] Attempting search. Target: ${lastCount + 3}/${maxPC}`);
            pcLink.click();

            console.log(`[PC] Waiting ${BASE_WAIT/1000}s for point update...`);
            await new Promise(r => setTimeout(r, BASE_WAIT));

            let currentCount = getCount(pcCounter, 0);
            
            if (currentCount > lastCount) {
                console.log(`[PC] SUCCESS! Points increased: ${lastCount} -> ${currentCount} (Updated at: ${new Date().toLocaleTimeString()})`);
                GM_setValue('pc_stuck_count', 0); // Reset stuck count
                lastCount = currentCount;
                // Continue to next search in loop or reload to refresh DOM
                location.reload(); 
            } else {
                stuckCount++;
                GM_setValue('pc_stuck_count', stuckCount);
                console.warn(`[PC] Points didn't update (Attempt ${stuckCount}/3).`);
                
                if (stuckCount >= 3) {
                    const nextAttempt = new Date(Date.now() + STUCK_RELOAD_DELAY);
                    console.error(`[PC] STUCK! 15-min cooldown initiated.`);
                    console.log(`[PC] Next attempt scheduled for: ${nextAttempt.toLocaleTimeString()}`);
                    GM_setValue('pc_stuck_timestamp', Date.now());
                    setTimeout(() => location.reload(), STUCK_RELOAD_DELAY);
                    return;
                }
                
                console.log("[PC] Refreshing breakdown page to try again...");
                location.reload();
            }
        } else {
            console.log("[PC] All PC searches complete!");
            GM_setValue('pc_stuck_count', 0); // Clear for next day
        }
    }

    if (mobileCounter) {
        let doneMobile = getCount(mobileCounter, 0);
        let maxMobile = getCount(mobileCounter, 1);
        if (doneMobile < maxMobile) {
            console.log(`[Mobile] Triggering background searcher for remaining points...`);
            GM_setValue('triggerSearches', {
                pcCount: 0,
                mobileCount: Math.ceil((maxMobile - doneMobile) / 3),
                timestamp: Date.now()
            });
        }
    }
}
