// ==UserScript==
// @name         Auto Microsoft Reword Points PC Searches 1 of 3 | PC Searches Points Breakdown
// @namespace    https://rewards.bing.com/
// @version      0.1.0
// @description  PC Searches Points Breakdown
// @match        https://rewards.bing.com/pointsbreakdown
// @grant        window.close
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-pointsbreakdown.user.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-pointsbreakdown.user.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

const searchesCounterCSS = `[ng-bind-html="$ctrl.pointProgressText"]`;
let maxSearchesCount = 90; // used to be 90 now they increased to 150, this var updates dynamically
const linkToSearchCSS = `#pointsCounters_pcSearchLevel2_0, #pointsCounters_pcSearch_0, [id^="pointsCounters_pcSearch"]`;
const reloadInterval = 3600 * 5 * 1000; // 5 hours in milliseconds
const timeoutToCheckIfCounterUpdated = 10000; // Set your desired timeout in milliseconds

(function () {
    'use strict';

    // Wait for the page to fully load
    window.onload = function () {
        checkSearchCounts();

        // Set interval to reload the page every n hours
        setInterval(function () {
            location.reload();
        }, reloadInterval);
    };
})();

async function checkSearchCounts() {

    // Parses text counts {points received} / {max point allowed to get per day} which looks like: 40 / 150
    // numToReturn 0 for first (dynamic count), 1 for second (max points per day)
    function extractSearchesCount(inputString, numToReturn) {
        if (!inputString) return 0;
        // Split the string by '/' and trim any whitespace
        const parts = inputString.split('/');
        if (parts.length < 2) return 0;
        // Parse the part as an integer and return it
        return parseInt(parts[numToReturn].trim(), 10);
    }

    // Wait for the page to load and then execute the script
    let searchCounterElement = document.querySelector(searchesCounterCSS);
    if (!searchCounterElement) {
        console.error("Could not find search counter element.");
        return;
    }

    let doneSearchesCount = extractSearchesCount(searchCounterElement.textContent, 0);
    maxSearchesCount = extractSearchesCount(searchCounterElement.textContent, 1);
    console.log(`Searches performed so far: ${doneSearchesCount} out of ${maxSearchesCount}`);

    for (let i = doneSearchesCount + 1; i <= maxSearchesCount ; i++) {
        // Click the search link
        const searchLink = document.querySelector(linkToSearchCSS);
        if (searchLink) {
            searchLink.click();
            console.log(`Search link clicked to do search #` + i);
        } else {
            console.error("Could not find search link element. Trying to find by text...");
            // Fallback: try to find by text content if ID fails
            const allLinks = Array.from(document.querySelectorAll('a, div[role="button"]'));
            const pcSearchLink = allLinks.find(el => el.textContent.toLowerCase().includes('pc search') || el.id.includes('pcSearch'));
            if (pcSearchLink) {
                pcSearchLink.click();
                console.log(`Fallback search link clicked to do search #` + i);
            } else {
                 console.error("All search link selectors failed.");
                 break;
            }
        }

        // Wait for the specified timeout
        await new Promise(resolve => setTimeout(resolve, timeoutToCheckIfCounterUpdated));

        console.log(`Updated done searches count: ${extractSearchesCount(searchCounterElement.textContent, 0)}`);
    }

    console.log('Max searches count reached or search link not found. Stopping the process.');
}
