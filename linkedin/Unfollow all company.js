// ==UserScript==
// @name         Unfollow all.user
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  Simple way to unfollow all those pages/companies to make your feed cleaner
// @author       kyxap | https://github.com/kyxap
// @match        https://www.linkedin.com/mynetwork/network-manager/company/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var followButtonSelector = "[class='artdeco-button__text']";
    var popup = '[role="alertdialog"]';

    waitForElm(followButtonSelector).then((elm) => {
        console.log('Follow button is found!');
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