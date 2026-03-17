// ==UserScript==
// @name         Auto Microsoft Reword Points PC Searches 1 of 3 | PC Searches Points Breakdown
// @namespace    https://rewards.bing.com/
// @version      0.1.2
// @description  PC Searches Points Breakdown with Stuck Detection
// @match        https://rewards.bing.com/pointsbreakdown
// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-pointsbreakdown.user.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-pointsbreakdown.user.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

const searchesCounterCSS = `[ng-bind-html="$ctrl.pointProgressText"]`;
const linkToPCSearchCSS = `#pointsCounters_pcSearchLevel2_0, #pointsCounters_pcSearch_0, [id^="pointsCounters_pcSearch"], a[href*="PC Search"]`;

const reloadInterval = 3600 * 5 * 1000; 
const BASE_WAIT = 12000; // Increase to 12s to respect new MS cooldowns

(function () {
    'use strict';
    window.onload = function () {
        setTimeout(checkSearchCounts, 3000); // Give Angular time to load
        setInterval(() => location.reload(), reloadInterval);
    };
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

        console.log(`[PC] Current: ${lastCount}/${maxPC}`);

        for (let i = lastCount; i < maxPC; i++) {
            const pcLink = document.querySelector(linkToPCSearchCSS);
            if (!pcLink) {
                console.error("PC Link not found!");
                break;
            }

            console.log(`[PC] Attempting search #${i + 1}...`);
            pcLink.click();

            // Wait for cooldown
            await new Promise(r => setTimeout(r, BASE_WAIT + (stuckCount * 5000)));

            let currentCount = getCount(pcCounter, 0);
            if (currentCount > lastCount) {
                console.log(`[PC] Success! Count is now ${currentCount}`);
                lastCount = currentCount;
                stuckCount = 0;
            } else {
                stuckCount++;
                console.warn(`[PC] Count didn't change (${currentCount}). Stuck ${stuckCount} times. Increasing delay.`);
                if (stuckCount > 3) {
                    console.error("[PC] Stuck too long. You might have hit the 15-minute search limit. Stopping for now.");
                    break;
                }
            }
        }
    }

    // Trigger Mobile (as before)
    if (mobileCounter) {
        let doneMobile = getCount(mobileCounter, 0);
        let maxMobile = getCount(mobileCounter, 1);
        if (doneMobile < maxMobile) {
            console.log("[Mobile] Triggering background searches...");
            GM_setValue('triggerMobileSearch', {
                count: Math.ceil((maxMobile - doneMobile) / 3),
                timestamp: Date.now()
            });
        }
    }
}
