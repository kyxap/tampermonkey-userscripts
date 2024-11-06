// ==UserScript==
// @name         Auto Microsoft Reword Points PC Searches 1 of 3 | PC Searches Points Breakdown
// @namespace    https://rewards.bing.com/
// @version      0.0.2
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
const maxSearchesCount = 90;
const linkToSearchCSS = `#pointsCounters_pcSearchLevel2_0`;
const reloadInterval = 3600 * 5 * 1000; // 5 hours in milliseconds
const timeoutToCheckIfCounterUpdated = 10000; // Set your desired timeout in milliseconds

(function () {
    'use strict';

    checkSearchCounts();

    // Set interval to reload the page every n hours and start over
    setInterval(function () {
        location.reload();
    }, reloadInterval);
})();

async function checkSearchCounts() {
    function extractDoneSearches(inputString) {
        // Split the string by '/' and trim any whitespace
        const parts = inputString.split('/');
        // Parse the first part as an integer and return it
        return parseInt(parts[0].trim(), 10);
    }

    // Wait for the page to load and then execute the script
    let searchCounterElement = document.querySelector(searchesCounterCSS);
    let doneSearchesCount = extractDoneSearches(searchCounterElement.textContent);
    console.log(`Searches performed so far: ${doneSearchesCount} out of ${maxSearchesCount}`);

    for (let i = doneSearchesCount; i < maxSearchesCount; i++) {
        // Click the search link
        document.querySelector(linkToSearchCSS).click();
        console.log(`Clicked search link.`);

        // Wait for the specified timeout
        await new Promise(resolve => setTimeout(resolve, timeoutToCheckIfCounterUpdated));

        // Update the search count
        searchCounterElement = document.querySelector(searchesCounterCSS);
        doneSearchesCount = extractDoneSearches(searchCounterElement.textContent);
        console.log(`Updated done searches count: ${doneSearchesCount}`);
    }

    console.log('Max searches count reached. Stopping the process.');
}
