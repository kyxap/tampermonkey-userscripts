// ==UserScript==
// @name         Easy Apply -> Do not follow
// @namespace    http://tampermonkey.net/
// @version      0.0.2
// @description  Helps you avoid auto following all those companies you have applied for via Easy Apply
// @author       kyxap | https://github.com/kyxap
// @match        https://www.linkedin.com/jobs/search/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var followCompanySelector = "[for='follow-company-checkbox']";

    waitForElm(followCompanySelector).then((elm) => {
        console.log('Follow company checkbox is found!');
        console.log(elm.textContent);
        elm.click();
});

})();


function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}