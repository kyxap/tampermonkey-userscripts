// ==UserScript==
// @name         Auto Microsoft Reword Points PC Searches 1 of 3 | PC Searches Points Breakdown
// @namespace    https://github.com/kyxap/tampermonkey-userscripts/
// @version      0.1.5
// @description  PC Searches Points Breakdown (Parallel Triggering)
// @match        https://rewards.bing.com/pointsbreakdown*
// @grant        window.close
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

const searchesCounterCSS = `[ng-bind-html="$ctrl.pointProgressText"]`;

(function () {
    'use strict';
    console.log("[Breakdown] Script loaded, waiting for elements...");

    function init() {
        let attempts = 0;
        const checkExist = setInterval(function() {
            attempts++;
            const counters = document.querySelectorAll(searchesCounterCSS);
            if (counters.length > 0) {
                console.log("[Breakdown] Elements found, analyzing points...");
                clearInterval(checkExist);
                analyzeAndTrigger();
            } else if (attempts > 30) {
                console.error("[Breakdown] Could not find search counters.");
                clearInterval(checkExist);
            }
        }, 1000);
    }

    if (document.readyState === 'complete') init();
    else window.addEventListener('load', init);

    setInterval(() => location.reload(), 3600 * 5 * 1000);
})();

function analyzeAndTrigger() {
    function getCount(el, idx) {
        if (!el || !el.textContent) return 0;
        const p = el.textContent.split('/');
        return p.length > 1 ? parseInt(p[idx].trim(), 10) : 0;
    }

    let allCounters = document.querySelectorAll(searchesCounterCSS);
    let pcNeeded = 0;
    let mobileNeeded = 0;

    allCounters.forEach(counter => {
        const container = counter.closest('.pointsBreakdownItem') || counter.parentElement;
        const text = container.textContent.toLowerCase();
        const done = getCount(counter, 0);
        const max = getCount(counter, 1);
        const needed = Math.ceil((max - done) / 3);

        if (text.includes('pc search') && needed > 0) {
            pcNeeded = needed;
            console.log(`[Breakdown] PC Searches needed: ${needed}`);
        }
        if (text.includes('mobile search') && needed > 0) {
            mobileNeeded = needed;
            console.log(`[Breakdown] Mobile Searches needed: ${needed}`);
        }
    });

    if (pcNeeded > 0 || mobileNeeded > 0) {
        console.log("[Breakdown] Sending trigger to background searcher...");
        GM_setValue('triggerSearches', {
            pcCount: pcNeeded,
            mobileCount: mobileNeeded,
            timestamp: Date.now()
        });
    } else {
        console.log("[Breakdown] All searches appear complete!");
    }
}
