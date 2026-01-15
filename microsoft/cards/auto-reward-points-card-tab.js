// ==UserScript==
// @name         Auto Microsoft Reword Points Cards 2 of 3 | Performs custom searches
// @namespace    https://www.bing.com/
// @version      0.0.4
// @description  Perform search actions in the tab
// @match        https://www.bing.com/*?*PUBL=Rewards*data=*
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://raw.githubusercontent.com/kyxap/tampermonkey-userscripts/refs/heads/main/microsoft/cards/auto-reward-points-card-tab.js
// @downloadURL  https://raw.githubusercontent.com/kyxap/tampermonkey-userscripts/refs/heads/main/microsoft/cards/auto-reward-points-card-tab.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

(function () {
    'use strict';

    // Function to get URL parameters
    function getUrlParameter(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }

    // Function to simulate typing
    function simulateTextareaInput(textareaElement, text) {
        // Set the textarea element's value
        textareaElement.value = text;

        // Create and dispatch an input event to simulate typing
        const inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true
        });
        textareaElement.dispatchEvent(inputEvent);
    }

    // Get the cardText from the URL
    const cardText = getUrlParameter('data');
    console.log("Received card text: " + cardText);
    // close if there specific data (e.g. was not able to get data from AI)
    if (cardText === "close-me") {
        window.close();
    }

    // Find the input element using its ID
    const inputElement = document.getElementById('sb_form_q');

    if (inputElement) {
        // Simulate typing in the input element
        simulateTextareaInput(inputElement, cardText);

        // Wait for 2 seconds before clicking the search icon
        setTimeout(() => {
            const searchIcon = document.getElementById('search_icon');
            if (searchIcon) {
                searchIcon.click();
                console.log("Clicked the search icon.");

                // Wait for an additional second before simulating the Enter key press
                const enterEvent = new KeyboardEvent('keydown', {
                    key: 'Enter',
                    keyCode: 13,
                    code: 'Enter',
                    which: 13,
                    bubbles: true
                });
                inputElement.dispatchEvent(enterEvent);
                console.log("Simulated pressing Enter.");
            } else {
                console.log("Search icon not found.");
            }
        }, 2000); // 2 seconds delay before clicking the search icon

        // Optional: Set a timeout to close the tab after a delay
        const timeout = 5000; // Set your desired timeout in milliseconds
        setTimeout(function () {
            // Close the tab after the timeout
            window.close();
        }, timeout);
    } else {
        console.log("Input element not found");
    }

    // THIS WORK WHEN THERE SOME PAZZLE NO NEW TAB OPENED DUE TO SEARCH
    // Optional: Set a timeout to close the tab after a delay
    const timeout = 5000; // Set your desired timeout in milliseconds
    setTimeout(function () {
        // Close the tab after the timeout
        window.close();
    }, timeout);


})();
