// ==UserScript==
// @name         Easy Apply -> make it even easier
// @version      0.1.4
// @description  Makes "Easy Apply" actually easy: 1) auto uncheck company to follow 2) closes pop after submit
// @author       kyxap | https://github.com/kyxap
// @match        https://www.linkedin.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/linkedin/Easy%20Apply%20--%20make%20it%20even%20easier.user.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/linkedin/Easy%20Apply%20--%20make%20it%20even%20easier.user.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const followCompanySelector = 'input#follow-company-checkbox:checked';
    const doneButtonOnPopUpSelector = 'div[data-test-modal][role="dialog"] > .artdeco-modal__actionbar .artdeco-button .artdeco-button__text'
    const xButtonOnPopUpSelector = 'div[data-test-modal][role="dialog"] > .artdeco-button';
    const allowedUrls = [
        "https://www.linkedin.com/jobs/search/",
        "https://www.linkedin.com/jobs/collections/",
        "https://www.linkedin.com/jobs/search-results/",
        "https://www.linkedin.com/preload/"
    ];

    // Create a debounced version of the start function
    const debouncedStart = debounce(start, 500); // Adjust the delay as needed

    // Create a MutationObserver
    var observer = new MutationObserver(debouncedStart);

    // Observe changes in the document
    observer.observe(document.body, { subtree: true, childList: true });

    function start() {
        var url = location.href;
        if (allowedUrls.some(allowedUrl => url.startsWith(allowedUrl))) {
            logHighlighter("Easy Apply script is active, ready for your apply!");
            waitForElm(followCompanySelector).then((elm) => {
                logHighlighter('Follow company checkbox is found!');
                elm.click();
                
                waitForElm(doneButtonOnPopUpSelector).then((doneBtn) => {
                    logHighlighter('Submitted, going to close pop-up');
                    doneBtn.click();
                });
                // forcing me to buy their subscription, done buton is not avaiable, need user input for testing.
                // waitForElm(xButtonOnPopUpSelector).then((xButtonOnPopUpSelector) => {
                //     logHighlighter('Submitted, going to close pop-up');
                //     xButtonOnPopUpSelector.click();
                // });
            });
        } else {
            logHighlighter("Current url does not match expected urls list: " + url);
        }
    }
})();

function waitForElm(selector) {
    return new Promise((resolve, reject) => {
        // Check if the element is already present
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        let timeoutId;

        const observer = new MutationObserver(mutations => {
            // Check if the element is now present
            if (document.querySelector(selector)) {
                observer.disconnect();
                clearTimeout(timeoutId);
                resolve(document.querySelector(selector));
            }
        });

        // Observe changes in the document
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

// Debounce function to limit the frequency of calls
function debounce(func, delay) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(func, delay);
    };
}

function logHighlighter(logToHighlight) {
    const debug = true;
    if (debug) {
        console.log('[userscript-easy-apply] ' + logToHighlight);
    }
}
