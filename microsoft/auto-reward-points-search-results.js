// ==UserScript==
// @name         Auto Microsoft Reword Points 3 of 3
// @namespace    https://www.bing.com/
// @version      0.0.1
// @description  Closes search results
// @match        https://www.bing.com/search?form=&q=*
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/auto-reward-points-search-results.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/auto-reward-points-search-results.js
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
