// ==UserScript==
// @name         Auto Microsoft Reword Points Cards 1 of 3 | Clicks on cards
// @namespace    https://rewards.bing.com
// @version      0.1.6
// @description  Get Microsoft points automatically
// @author       kyxap | https://github.com/kyxap
// @match        https://rewards.bing.com/?form=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/cards/auto-reward-points.user.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/cards/auto-reward-points.user.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// ==/UserScript==

const reloadInterval = 3600 * 5 * 1000; // 5 hours in milliseconds
// control whether searches open in a new tab (keeps main rewards page visible)
const openSearchInNewTab = true;
// Always use this for "More Activities" search tabs so we never open rewards.bing.com and loop
const BING_REWARDS_SEARCH_BASE = 'https://www.bing.com/?form=ML2PCR&OCID=ML2PCR&PUBL=RewardsDO&CREA=ML2PCR&PC=ML2PCR&rwAutoFlyout=exb';

(function () {
    'use strict';

    // Avoid recursive loops: if this rewards page was opened with a "data"
    // query parameter (from our own script), do nothing here.
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.has('data')) {
            console.log('[Auto Rewards Cards] Detected rewards page with data param, skipping automation to avoid loops.');
            return;
        }
    } catch (e) {
        console.warn('[Auto Rewards Cards] Failed to inspect URL parameters, continuing anyway.', e);
    }

    findAndClick();

    // Set interval to reload the page every n hours and start over
    setInterval(function () {
        location.reload();
    }, reloadInterval);

})();

function findAndClick() {
    // Base selector for clickable icon/image inside a card.
    // Microsoft keeps changing classes/attributes, so we keep this flexible.
    const cardsBaseCSS = '.mee-icon-AddMedium[aria-label="plus"], .image-icon, .c-image';

    // First 3 cards on top (Daily set), only need a simple click.
    const cardsDailySetCSS = '[points="$ctrl.item.points"] ' + cardsBaseCSS;

    // More activities section below.
    const cardsMoreActivitiesCSS = '[points="item.points"] ' + cardsBaseCSS;

    // Wait for the page to load and then execute the script
    window.addEventListener('load', function () {
            let cardMoreActivitiesElements = document.querySelectorAll(cardsMoreActivitiesCSS);
            const cardDailySetElements = document.querySelectorAll(cardsDailySetCSS);

            // top 3 cards that need only click without custom search query
            if (cardDailySetElements.length > 0) {
                console.log('===> Daily sets elements found, checking before click');

                cardDailySetElements.forEach(function (card) {
                        const data = card.closest('.rewards-card-container') || card.closest('.ds-card-sec');
                        if (!data) {
                            console.warn('Daily set card: could not find container with aria-label, skipping.', card);
                            return;
                        }
                        const cardText = data.getAttribute('aria-label') || '';

                        console.log(`Working on card with a text: "${cardText}"`);
                        card.click();
                        // another script will close opened tab
                    }
                )
            } else {
                console.info('Got all card points from cardDailySetElements');
            }

            // cards that for most cases requires custom search request on bing
            if (cardMoreActivitiesElements.length > 0) {
                console.log('===> More Activities Elements found, checking before click');

                cardMoreActivitiesElements.forEach(function (card) {
                        const link = card.closest('a');
                        if (link && link.href.includes('rewards.bing.com')) {
                            console.log('Skipping more-activities card that points back to rewards.bing.com to avoid loops:', link.href);
                            return;
                        }
                        // click on card, since there a chance that this one need click without any custom search
                        // TODO: identify this case and avoid this if is not needed
                        card.click();

                        // extract text from cards description and ask AI
                        const data = card.closest('.rewards-card-container') || card.closest('.ds-card-sec');
                        if (!data) {
                            console.warn('More activities card: could not find container with aria-label, skipping.', card);
                            return;
                        }
                        const cardText = data.getAttribute('aria-label') || '';

                        console.log(`Working on card with a text: "${cardText}"`);
                        askAI(cardText, function (result) {
                            if (result) {
                                const encodedQuery = encodeURIComponent(result);
                                const link = card.closest('a');
                                const isBingSearch = link && link.href && link.href.includes('bing.com') && !link.href.includes('rewards.bing.com');
                                const baseHref = isBingSearch ? link.href : BING_REWARDS_SEARCH_BASE;
                                const cardUrlWithData = baseHref + (baseHref.includes('?') ? '&' : '?') + 'data=' + encodedQuery;

                                console.log("Final query for card:", result);
                                if (openSearchInNewTab) {
                                    console.log("Opening new tab with encoded query: " + cardUrlWithData);
                                    if (typeof GM_openInTab === 'function') {
                                        GM_openInTab(cardUrlWithData, { active: false, insert: true });
                                    } else {
                                        const opened = window.open(cardUrlWithData, '_blank');
                                        if (!opened) {
                                            console.warn('window.open was blocked by the browser or failed to open.');
                                        }
                                    }
                                } else {
                                    console.log("Navigating current tab with encoded query: " + cardUrlWithData);
                                    window.location.href = cardUrlWithData;
                                }

                            } else {
                                console.error("No result received so going to open but next script will close it right a way");
                            }
                        });
                    }
                )
            } else {
                console.info('Got all card points from cardMoreActivitiesElements with primary selector, trying fallback selector.');

                // Fallback: grab any remaining visible, unlocked cards by generic structure.
                cardMoreActivitiesElements = document.querySelectorAll('.ds-card-sec[aria-label] ' + cardsBaseCSS);

                if (cardMoreActivitiesElements.length > 0) {
                    console.log('===> Fallback More Activities Elements found, checking before click');

                    cardMoreActivitiesElements.forEach(function (card) {
                            const data = card.closest('.ds-card-sec');
                            if (!data) {
                                return;
                            }
                            const cardText = data.getAttribute('aria-label');

                            console.log(`(Fallback) Working on card with a text: "${cardText}"`);
                            askAI(cardText, function (result) {
                                if (result) {
                                    const encodedQuery = encodeURIComponent(result);
                                    const link = card.closest('a');
                                    const isBingSearch = link && link.href && link.href.includes('bing.com') && !link.href.includes('rewards.bing.com');
                                    const baseHref = isBingSearch ? link.href : BING_REWARDS_SEARCH_BASE;
                                    const cardUrlWithData = baseHref + (baseHref.includes('?') ? '&' : '?') + 'data=' + encodedQuery;

                                    console.log("(Fallback) Final query for card:", result);
                                    if (openSearchInNewTab) {
                                        console.log("(Fallback) Opening new tab with encoded query: " + cardUrlWithData);
                                        if (typeof GM_openInTab === 'function') {
                                            GM_openInTab(cardUrlWithData, { active: false, insert: true });
                                        } else {
                                            const opened = window.open(cardUrlWithData, '_blank');
                                            if (!opened) {
                                                console.warn('(Fallback) window.open was blocked by the browser or failed to open.');
                                            }
                                        }
                                    } else {
                                        console.log("(Fallback) Navigating current tab with encoded query: " + cardUrlWithData);
                                        window.location.href = cardUrlWithData;
                                    }

                                } else {
                                    console.error("(Fallback) No result received so going to open but next script will close it right a way");
                                }
                            });
                        }
                    );
                } else {
                    console.info('Got all card points from cardMoreActivitiesElements including fallback.');
                }
            }
        }
    )
}

// requires AI chat model to work on your local, let me know if you interested and I can share this project
function askAI(prompt, callback) {
    const task = `Generate a one-line search query based on the following task: ${prompt}. The query should be concise and directly relevant to the user's needs. Please avoid using quotes in your example`;

    function buildFallbackQuery() {
        try {
            const cleaned = prompt
                .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width chars
                .replace(/[,|]/g, ' ')
                .replace(/[^\w\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            const words = cleaned.split(' ');
            const fallback = words.slice(0, 10).join(' ');
            return fallback || 'bing daily set';
        } catch (e) {
            console.error('Failed to build fallback query, using default.', e);
            return 'bing daily set';
        }
    }

    // Call your Spring Boot API
    GM_xmlhttpRequest({
        method: "GET",
        url: `http://localhost:5433/api/generate?prompt=${encodeURIComponent(task)}`,
        timeout: 4000,
        onload: function (response) {
            if (response.status === 200) {
                const result = response.responseText;
                console.log("Generated Query:", result);
                callback(result || buildFallbackQuery()); // Call the callback with the result
            } else {
                console.error("Error from AI service, using fallback query instead:", response.status, response.statusText);
                const fallback = buildFallbackQuery();
                console.log('Fallback Query (service error):', fallback);
                callback(fallback);
            }
        },
        onerror: function (error) {
            console.error("Request to local AI service failed, using fallback query instead:", error);
            const fallback = buildFallbackQuery();
            console.log('Fallback Query (request failure):', fallback);
            callback(fallback);
        },
        ontimeout: function () {
            console.error("Request to local AI service timed out, using fallback query instead.");
            const fallback = buildFallbackQuery();
            console.log('Fallback Query (timeout):', fallback);
            callback(fallback);
        }
    });
}
