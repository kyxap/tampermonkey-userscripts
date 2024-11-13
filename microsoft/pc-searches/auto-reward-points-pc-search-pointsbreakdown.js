// ==UserScript==
// @name         Auto Microsoft Reword Points PC Searches 1 of 3 | PC Searches Points Breakdown
// @namespace    https://rewards.bing.com/
// @version      0.0.6
// @description  PC Searches Points Breakdown
// @match        https://rewards.bing.com/pointsbreakdown
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-pointsbreakdown.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-pointsbreakdown.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

const searchesCounterCSS = `[ng-bind-html="$ctrl.pointProgressText"]`;
let maxSearchesCount = 90; // used to be 90 now they increased to 150, this var updates dynamically
const linkToSearchCSS = `#pointsCounters_pcSearchLevel2_0`;
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
        // Split the string by '/' and trim any whitespace
        const parts = inputString.split('/');
        // Parse the first part as an integer and return it
        return parseInt(parts[numToReturn].trim(), 10);
    }

    // Wait for the page to load and then execute the script
    let searchCounterElement = document.querySelector(searchesCounterCSS);
    let doneSearchesCount = extractSearchesCount(searchCounterElement.textContent, 0);
    maxSearchesCount = extractSearchesCount(searchCounterElement.textContent, 1);
    console.log(`Searches performed so far: ${doneSearchesCount} out of ${maxSearchesCount}`);

    for (let i = doneSearchesCount; i <= maxSearchesCount || doneSearchesCount !== maxSearchesCount; i++) {
        // Click the search link
        document.querySelector(linkToSearchCSS).click();
        console.log(`Clicked search link.`);

        // Wait for the specified timeout
        await new Promise(resolve => setTimeout(resolve, timeoutToCheckIfCounterUpdated));

        // Update the search count
        searchCounterElement = document.querySelector(searchesCounterCSS);
        doneSearchesCount = extractSearchesCount(searchCounterElement.textContent, 0);
        console.log(`Updated done searches count: ${doneSearchesCount}`);
    }

    console.log('Max searches count reached. Stopping the process.');
}
