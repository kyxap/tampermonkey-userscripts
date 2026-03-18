// ==UserScript==
// @name         Auto Microsoft Reword Points PC Searches 1 of 3 | PC Searches Points Breakdown
// @namespace    https://github.com/kyxap/tampermonkey-userscripts/
// @version      0.1.6
// @description  PC Searches Points Breakdown (Sequential Tab-based searching with stuck detection)
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
const BASE_WAIT = 25000; // 25s - Give Microsoft enough time to count the search and close the tab
const RELOAD_IF_STUCK = 15 * 60 * 1000; // 15 minutes cooldown

(function () {
    'use strict';
    console.log("[PC] Breakdown script loaded. Starting in 5s...");

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

    // Give the page 5 seconds to stabilize (Angular is slow)
    setTimeout(init, 5000);

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
        let stuckCount = 0;

        console.log(`[PC] Starting searches. Current: ${lastCount}/${maxPC}`);

        while (lastCount < maxPC) {
            const pcLink = document.querySelector(linkToPCSearchCSS);
            if (!pcLink) {
                console.error("[PC] Search link not found. Refreshing...");
                location.reload();
                return;
            }

            console.log(`[PC] Attempting search. Target: ${lastCount + 3}/${maxPC}`);
            pcLink.click();

            // Wait for search tab to open, do the search, and close itself (15s script + network)
            console.log(`[PC] Waiting ${BASE_WAIT/1000}s for point update...`);
            await new Promise(r => setTimeout(r, BASE_WAIT));

            // Refresh counts (we might need a real reload if the points don't update dynamically)
            // But let's try to trust Angular for a few attempts.
            let currentCount = getCount(pcCounter, 0);
            
            if (currentCount > lastCount) {
                console.log(`[PC] SUCCESS! Points increased: ${lastCount} -> ${currentCount}`);
                lastCount = currentCount;
                stuckCount = 0;
            } else {
                stuckCount++;
                console.warn(`[PC] Points didn't update (Attempt ${stuckCount}/3).`);
                
                if (stuckCount >= 3) {
                    console.error(`[PC] STUCK DETECTED! You likely hit the 15-minute cooldown (3 searches per 15 mins).`);
                    console.log(`[PC] Waiting 15 minutes before next attempt...`);
                    // We'll just refresh the page in 15 minutes to try again.
                    setTimeout(() => location.reload(), RELOAD_IF_STUCK);
                    return;
                }
                
                // If not totally stuck, try a real page refresh to force update counts
                console.log("[PC] Refreshing breakdown page to force point update...");
                location.reload();
                return;
            }
        }
        console.log("[PC] All PC searches complete!");
    }

    // Handle Mobile separately in background (it still works for some!)
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
