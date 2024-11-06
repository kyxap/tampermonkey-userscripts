// ==UserScript==
// @name         Auto Microsoft Reword Points PC Searches 2 of 3 | Do the search
// @namespace    https://rewards.bing.com/
// @version      0.0.2
// @description  Do the search
// @match        https://www.bing.com/news/?form=*
// @grant        GM_xmlhttpRequest
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-do-the-search.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-do-the-search.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

const aiRequest = "Please give me one example of human like search request for search engines line google one liner. Please avoid using quotes in your example";
const timeout = 5 * 1000; // 5 sec

(function () {
    'use strict';

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

        document.getElementById("sb_form_go").click(); // click on search
    }

    // Find the input element using its ID
    const inputElement = document.getElementById('sb_form_q');

    if (inputElement) {

        askAI(aiRequest, function (result) {
            if (result) {
                console.log("Query received from ai: " + result)
                // Simulate typing in the input element
                simulateTextareaInput(inputElement, result);

            } else {
                console.error("No result received from AI");
            }
        });

    } else {
        console.log("Input element not found");
    }

    // Optional: Set a timeout to close the tab after a delay
    setTimeout(function () {
        // Close the tab after the timeout
        window.close();
    }, timeout);
})();

// requires AI chat model to work on your local, let me know if you interested and I can share this project
function askAI(prompt, callback) {
    // Call your Spring Boot API
    GM_xmlhttpRequest({
        method: "GET",
        url: `http://localhost:5433/generate?prompt=${encodeURIComponent(prompt)}`,
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
