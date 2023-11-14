// ==UserScript==
// @name         Easy Apply -> make it even easier 
// @namespace    http://tampermonkey.net/
// @version      0.0.5
// @description  Makes "Easy Apply" actually easy: 1) auto uncheck company to follow 2) closes pop after submit
// @author       kyxap | https://github.com/kyxap
// @match        https://www.linkedin.com/jobs/search/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
    var followCompanySelector = 'input#follow-company-checkbox:checked';
    var doneButtonOnPopUpSelector = 'div[data-test-modal][role="dialog"] > .artdeco-modal__actionbar .artdeco-button'

    start();

    function start() {
        waitForElm(followCompanySelector).then((elm) => {
            console.log('Follow company checkbox is found!');
            elm.click();
            waitForElm(doneButtonOnPopUpSelector).then((doneBtn) => {
                console.log('Done button on popup is found!');
                doneBtn.click();
                start();
            });
        });

    }
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
