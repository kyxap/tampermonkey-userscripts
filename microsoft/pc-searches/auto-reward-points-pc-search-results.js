// ==UserScript==
// @name         Auto Microsoft Reword Points PC Searches 3 of 3 | Search cleanup
// @namespace    https://www.bing.com/news/
// @version      0.0.1
// @description  Search cleanup
// @match        https://www.bing.com/news/search?q=*
// @grant        GM_xmlhttpRequest
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-results.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-results.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

(function () {
    'use strict';

    const timeout = 5000; // Set your desired timeout in milliseconds
    setTimeout(function () {
        // Close the tab after the timeout
        window.close();
    }, timeout);
})();
