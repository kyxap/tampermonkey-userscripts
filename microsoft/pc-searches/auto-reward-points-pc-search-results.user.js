// ==UserScript==
// @name         Auto Microsoft Reword Points PC Searches 3 of 3 | Search cleanup
// @namespace    https://www.bing.com/news/
// @version      0.0.3
// @description  Search cleanup
// @match        https://www.bing.com/news/search?q=*
// @grant        GM_xmlhttpRequest
// @grant        window.close
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-results.user.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-results.user.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

(function () {
    'use strict';

    const timeout = 12000; // Increase to 12s to ensure search is registered
    setTimeout(function () {
        // Close the tab after the timeout
        window.close();
    }, timeout);
})();
