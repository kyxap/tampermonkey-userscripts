// ==UserScript==
// @name         Auto Microsoft Reword Points Cards 3 of 3 | Closes search results
// @namespace    https://www.bing.com/
// @version      0.0.8
// @description  Closes search results
// @match        https://www.bing.com/search?form=&q=*
// @match        https://www.bing.com/search?q=*
// @match        https://www.bing.com/search?form=*
// @match        https://www.bing.com/?form=*
// @match        https://www.bing.com/spotlight/imagepuzzle*
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/cards/auto-reward-points-search-results.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/cards/auto-reward-points-search-results.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

(function () {
    'use strict';

    const timeout = 15 * 1000; // Set your desired timeout in milliseconds
    setTimeout(function () {
        // Close the tab after the timeout
        window.close();
    }, timeout);
})();
