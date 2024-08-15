// ==UserScript==
// @name         Auto Microsoft Reword Points
// @namespace    https://rewards.bing.com
// @version      0.0.4
// @description  Get Microsoft points automatically
// @author       kyxap | https://github.com/kyxap
// @match        https://rewards.bing.com/?form=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/auto-reward-points.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/auto-reward-points.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// ==/UserScript==

const gmCardsKey = 'ms_clicked_cards_title';
const reloadInterval = 3600 * 12 * 1000; // 12 hours in milliseconds
const timeout = 3000;

(function() {
    'use strict';

    // Initial cleanup and script execution
    cleanup();
    findAndClick();

    // Set interval to reload the page every 12 hours and start over
    setInterval(function() {
        location.reload();
    }, reloadInterval);

})();

function cleanup() {
    // Remove saved list
    console.log('Removing saved list of clicked cards');
    GM_deleteValue(gmCardsKey);
}

function findAndClick() {
    // The selector for the link you want to click
    const linkSelector = '.ng-scope[ng-if="!$ctrl.locked && !$ctrl.isExclusiveLockedItem"] > .mee-icon-AddMedium[aria-label="plus"]'; // Change this to your link's selector

    // Wait for the page to load and then execute the script
    window.addEventListener('load', function() {
        const cardElements = document.querySelectorAll(linkSelector);

        if (cardElements.length > 0) {
            console.log('Elements found, checking before click');

            const storedListJSON = GM_getValue(gmCardsKey, '[]');
            const msCards = JSON.parse(storedListJSON);

            cardElements.forEach(function(card) {
                const data = card.closest('.ds-card-sec');
                const cardText = data.getAttribute('aria-label');

                if (msCards.includes(cardText)) {
                    console.log("Skipping, already clicked: " + cardText);
                } else {
                    // Update the list (e.g., add a new item)
                    msCards.push(cardText);

                    console.log('Going to click: ' + cardText);
                    // Simulate a click on the link
                    card.click();

                    // Wait for n seconds
                    setTimeout(function() {
                        // Close the newly opened tab
                        // Note: This might not work due to cross-origin restrictions
                        // The new tab should be opened by the same script
                        // It is better to use this script in the new tab directly
                        if (window.location !== window.parent.location) {
                            window.close();
                        } else {
                            console.log('The script should be used in the new tab.');
                        }

                        // Save the updated list
                        GM_setValue(gmCardsKey, JSON.stringify(msCards));
                    }, timeout);
                }
            });
        } else {
            console.log('No elements found.');
        }
    });
}
