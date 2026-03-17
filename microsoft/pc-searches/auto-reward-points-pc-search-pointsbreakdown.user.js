// ==UserScript==
// @name         Auto Microsoft Reword Points PC Searches 1 of 3 | PC Searches Points Breakdown
// @namespace    https://github.com/kyxap/tampermonkey-userscripts/
// @version      0.1.4
// @description  PC Searches Points Breakdown with Robust Initialization
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
const BASE_WAIT = 12000;

(function () {
    'use strict';
    console.log("[PC] Script loaded, waiting for elements...");

    function init() {
        let attempts = 0;
        const checkExist = setInterval(function() {
            attempts++;
            const counter = document.querySelector(searchesCounterCSS);
            if (counter) {
                console.log("[PC] Elements found, starting automation...");
                clearInterval(checkExist);
                checkSearchCounts();
            } else if (attempts > 30) { // Stop checking after 30s
                console.error("[PC] Could not find search counters after 30 seconds.");
                clearInterval(checkExist);
            }
        }, 1000);
    }

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);

    // Auto-reload after 5 hours
    setInterval(() => location.reload(), 3600 * 5 * 1000);
})();

async function checkSearchCounts() {
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

        console.log(`[PC] Current Progress: ${lastCount}/${maxPC}`);

        for (let i = lastCount; i < maxPC; i++) {
            const pcLink = document.querySelector(linkToPCSearchCSS);
            if (!pcLink) {
                console.error("[PC] Search link vanished!");
                break;
            }

            console.log(`[PC] Attempting search #${i + 1}...`);
            pcLink.click();

            await new Promise(r => setTimeout(r, BASE_WAIT + (stuckCount * 5000)));

            let currentCount = getCount(pcCounter, 0);
            if (currentCount > lastCount) {
                console.log(`[PC] Success! Count is now ${currentCount}`);
                lastCount = currentCount;
                stuckCount = 0;
            } else {
                stuckCount++;
                console.warn(`[PC] Count didn't change. Stuck ${stuckCount}/3. Increasing delay.`);
                if (stuckCount >= 3) {
                    console.error("[PC] Search limit/cooldown hit. Stopping.");
                    break;
                }
            }
        }
    }

    if (mobileCounter) {
        let doneMobile = getCount(mobileCounter, 0);
        let maxMobile = getCount(mobileCounter, 1);
        if (doneMobile < maxMobile) {
            console.log(`[Mobile] Triggering ${Math.ceil((maxMobile - doneMobile)/3)} background searches...`);
            GM_setValue('triggerMobileSearch', {
                count: Math.ceil((maxMobile - doneMobile) / 3),
                timestamp: Date.now()
            });
        }
    }
}
