// ==UserScript==
// @name         Auto Microsoft Reword Points Cards 3 of 3 | Closes search results
// @namespace    https://www.bing.com/
// @version      0.0.14
// @description  Closes search results and miscellaneous promo pages
// @match        https://www.bing.com/search?form=&q=*
// @match        https://www.bing.com/search?q=*
// @match        https://www.bing.com/search?form=*
// @match        https://www.bing.com/?form=*
// @match        https://www.bing.com/spotlight/imagepuzzle*
// @match        https://rewards.bing.com/sweepstakes/*
// @match        https://rewards.bing.com/redeem/*
// @match        https://rewards.bing.com/referandearn/*
// @match        https://rewards.bing.com/dashboard*
// @match        https://www.xbox.com/*/xbox-mastercard*
// @grant        window.close
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/cards/auto-reward-points-search-results.user.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/cards/auto-reward-points-search-results.user.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

(function () {
    'use strict';

    const timeout = 10 * 1000; // 10 seconds is plenty for these pages
    console.log(`[Auto Close] Script active. This tab will close in ${timeout/1000} seconds.`);

    setTimeout(function () {
        console.log("[Auto Close] Closing tab now.");
        window.close();
    }, timeout);
})();
