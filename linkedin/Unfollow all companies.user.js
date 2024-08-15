// ==UserScript==
// @name         Unfollow all companies
// @namespace    http://tampermonkey.net/
// @version      0.0.13
// @description  Simple way to unfollow all those pages/companies to make your feed cleaner
// @author       kyxap | https://github.com/kyxap
// @match        https://www.linkedin.com/mynetwork/network-manager/company/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/linkedin/Unfollow%20all%20companies.user.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/linkedin/Unfollow%20all%20companies.user.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';
    const followButtonXPath = '//*[@class="artdeco-button__text" and text()="Following"]';
    const unFollowButtonXPath = '//*[@class="artdeco-button__text" and text()="Unfollow"]';
    const timeoutMs = 200; // Adjust the delay time as needed

    var node = document.createElement('div');
    node.innerHTML = '<button id="customButton" type="button">Unfollow ALL!</button>';
    node.setAttribute('id', 'customContainer');
    document.body.appendChild(node);

    document.getElementById("customButton").addEventListener(
        "click", ButtonClickAction, false
    );

    function ButtonClickAction(event) {
        var node = document.createElement('p');
        node.innerHTML = 'Starting...';
        document.getElementById("customContainer").appendChild(node);

        var totalToDelete = 0;

        waitForElmXpathCount(followButtonXPath)
            .then((elToCount) => {
                totalToDelete = elToCount.snapshotLength;
                console.log('Total companies to unfollow:', totalToDelete);

                // Initiate the unfollow loop
                unfollowCompanies(0, totalToDelete);
            })
            .catch((error) => {
                console.error('Error while waiting for Follow button to count:', error);
            });
    }

    function unfollowCompanies(currentIndex, totalToDelete) {
        if (currentIndex < totalToDelete) {
            console.log('Attempting to unfollow company:', currentIndex + 1);

            waitForElmXpath(followButtonXPath)
                .then(function (elm) {
                    if (elm && typeof elm.click === 'function') {
                        console.log('Follow button is found!');
                        elm.click();
                        delay(timeoutMs)
                            .then(function () {
                                waitForElmXpath(unFollowButtonXPath)
                                    .then(function (secElm) {
                                        if (secElm && typeof secElm.click === 'function') {
                                            secElm.click();
                                            delay(timeoutMs)
                                                .then(function () {
                                                    console.log('Unfollow button is clicked for company:', currentIndex + 1);
                                                    // Proceed to the next company
                                                    unfollowCompanies(currentIndex + 1, totalToDelete);
                                                });
                                        } else {
                                            console.error('Error: Unfollow button is not clickable.');
                                        }
                                    })
                                    .catch(function (error) {
                                        console.error('Error while waiting for Unfollow button:', error);
                                    });
                            });
                    } else {
                        console.error('Error: Follow button is not clickable.');
                    }
                })
                .catch(function (error) {
                    console.error('Error while waiting for Follow button:', error);
                });
            // Scroll down
            window.scrollBy(0, window.innerHeight);
        } else {
            console.log('Unfollow process completed.');
        }
    }
})();

function waitForElmXpathCount(xpath) {
    return new Promise((resolve) => {
        const observer = new MutationObserver(() => {
            const elToCount = document.evaluate(xpath, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);

            if (elToCount) {
                observer.disconnect();
                resolve(elToCount);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function waitForElmXpath(xpath) {
    return new Promise((resolve, reject) => {
        const queryXpath = (xpath) => document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        const obj = queryXpath(xpath);
        if (obj) {
            resolve(obj);
        }

        const observer = new MutationObserver(mutations => {
            const updatedObj = queryXpath(xpath);
            if (updatedObj) {
                observer.disconnect();
                resolve(updatedObj);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Set a timeout for 10 seconds (adjust as needed)
        setTimeout(() => {
            observer.disconnect();
            reject(new Error('Timeout waiting for element with XPath: ' + xpath));
        }, 10000);
    });
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

GM_addStyle(`
    #customContainer {
        position: fixed;
        top: 10px;
        opacity: 0.8;
        z-index: 1100;
        left: 100px; /* Adjust the left position as needed */

        display: inline-block;
        outline: none;
        cursor: pointer;
        padding: 0 16px;
        background-color: #0070d2;
        border-radius: 0.25rem;
        border: 1px solid #0070d2;
        color: #fff;
        font-size: 13px;
        line-height: 30px;
        font-weight: 400;
        text-align: center;
        transition-duration: 0.1s; /* Add transition duration for smooth hover effect */
    }

    #customContainer:hover {
        background-color: #005fb2;
        border-color: #005fb2;
    }
`);
