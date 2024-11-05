// ==UserScript==
// @name         Auto Microsoft Reword Points Cards 1 of 3 | Clicks on cards
// @namespace    https://rewards.bing.com
// @version      0.0.10
// @description  Get Microsoft points automatically
// @author       kyxap | https://github.com/kyxap
// @match        https://rewards.bing.com/?form=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/cards/auto-reward-points.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/cards/auto-reward-points.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @grant        GM_xmlhttpRequest
// ==/UserScript==

const reloadInterval = 3600 * 5 * 1000; // 5 hours in milliseconds

(function () {
    'use strict';

    findAndClick();

    // Set interval to reload the page every n hours and start over
    setInterval(function () {
        location.reload();
    }, reloadInterval);

})();

function findAndClick() {
    // The selector for the link you want to click
    const cardsBaseCSS = '.ng-scope[ng-if="!$ctrl.locked && !$ctrl.isExclusiveLockedItem"] > .mee-icon-AddMedium[aria-label="plus"]'
    // first 3 card on top, only click needed
    const cardsDailySetCSS = '[points="$ctrl.item.points"] > * > ' + cardsBaseCSS
    const cardsMoreActivitiesCSS = '[points="item.points"] > * > ' + cardsBaseCSS;

    // Wait for the page to load and then execute the script
    window.addEventListener('load', function () {
            const cardMoreActivitiesElements = document.querySelectorAll(cardsMoreActivitiesCSS);
            const cardDailySetElements = document.querySelectorAll(cardsDailySetCSS);

            // cards needs only click without custom search query
            if (cardDailySetElements.length > 0) {
                console.log('===> Daily sets elements found, checking before click');

                cardDailySetElements.forEach(function (card) {
                        const data = card.closest('.ds-card-sec');
                        const cardText = data.getAttribute('aria-label');

                        console.log(`Working on card with a text: "${cardText}"`);
                        card.click();
                        // another script will close opened tab
                    }
                )
            } else {
                console.info('No cards (cardDailySetElements) found on the page');
            }

            // cards that for most cases requires custom search request on bing
            if (cardMoreActivitiesElements.length > 0) {
                console.log('===> More Activities Elements found, checking before click');

                cardMoreActivitiesElements.forEach(function (card) {
                        const data = card.closest('.ds-card-sec');
                        const cardText = data.getAttribute('aria-label');

                        console.log(`Working on card with a text: "${cardText}"`);
                        askAI(cardText, function (result) {
                            if (result) {
                                const cardUrlWithData = card.closest('a').href + `&data=${result}`

                                console.log("Url with query: " + cardUrlWithData)
                                window.open(cardUrlWithData, '_blank');

                            } else {
                                console.error("No result received so going to open but next script will close it right a way");
                            }
                        });

                    }
                )
            } else {
                console.info('No cards (cardsMoreActivitiesCSS) found on the page');
            }
        }
    )
}

// requires AI chat model to work on your local, let me know if you interested and I can share this project
function askAI(prompt, callback) {
    const task = `Generate a one-line search query based on the following task: ${prompt}. The query should be concise and directly relevant to the user's needs. Please avoid using quotes in your example`;

    // Call your Spring Boot API
    GM_xmlhttpRequest({
        method: "GET",
        url: `http://localhost:5433/generate?prompt=${encodeURIComponent(task)}`,
        onload: function (response) {
            if (response.status === 200) {
                const result = response.responseText;
                console.log("Generated Query:", result);
                callback(result); // Call the callback with the result
            } else {
                console.error("Error:", response.statusText);
                callback(null); // Call the callback with null or handle error as needed
            }
        },
        onerror: function (error) {
            console.error("Request failed:", error);
            callback(null); // Call the callback with null
        }
    });
}
