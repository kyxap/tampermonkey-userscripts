// ==UserScript==
// @name         Auto Microsoft Reword Points PC Searches 2 of 3 | Do the search
// @namespace    https://github.com/kyxap/tampermonkey-userscripts/
// @version      0.1.0
// @description  Do the search (unified namespace and configurable AI URL)
// @match        https://www.bing.com/news/?form=*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        window.close
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-do-the-search.user.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/microsoft/pc-searches/auto-reward-points-pc-search-do-the-search.user.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

const aiRequest = "Please give me one example of human like search request for search engines line google one liner. Please avoid using quotes in your example";
const timeout = 5 * 1000; // 5 sec
const DEFAULT_AI_BASE_URL = 'http://localhost:5433';

(function () {
    'use strict';

    // Function to simulate typing
    function simulateTextareaInput(textareaElement, text) {
        textareaElement.value = text;
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        textareaElement.dispatchEvent(inputEvent);
        document.getElementById("sb_form_go").click();
    }

    const inputElement = document.getElementById('sb_form_q');

    if (inputElement) {
        askAI(aiRequest, function (result) {
            if (result) {
                console.log("Query received from ai: " + result)
                simulateTextareaInput(inputElement, result);
            } else {
                console.error("No result received from AI");
            }
        });
    } else {
        console.log("Input element not found");
    }

    setTimeout(function () {
        window.close();
    }, timeout);
})();

function generateRandomSearchText() {
    const items = ["car", "shirt", "laptop", "bike", "hat", "paint", "pen", "shoes"];
    const colors = ["red", "blue", "green", "yellow", "purple", "dark", "grey", "black"];
    return colors[Math.floor(Math.random() * colors.length)] + " " + items[Math.floor(Math.random() * items.length)];
}

function askAI(prompt, callback) {
    const aiBaseUrl = GM_getValue('aiBaseUrl', DEFAULT_AI_BASE_URL);
    GM_xmlhttpRequest({
        method: "GET",
        url: `${aiBaseUrl}/api/generate?prompt=${encodeURIComponent(prompt)}`,
        timeout: 30000,
        onload: function (response) {
            if (response.status === 200) {
                callback(response.responseText);
            } else {
                console.error("AI service error, using fallback.");
                callback(generateRandomSearchText());
            }
        },
        onerror: function (error) {
            console.error("AI request failed, using fallback.");
            callback(generateRandomSearchText());
        },
        ontimeout: function () {
            console.error("AI request timed out, using fallback.");
            callback(generateRandomSearchText());
        }
    });
}
