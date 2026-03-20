// ==UserScript==
// @name         Auto Microsoft Reword Points Mobile Searches | Background Searcher
// @namespace    https://github.com/kyxap/tampermonkey-userscripts/
// @version      0.1.4
// @description  Perform Mobile background searches ONLY
// @match        https://www.bing.com/*
// @match        https://bing.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

(function () {
    'use strict';

    console.log("[Background Searcher] Mobile background searcher initialized!");

    const MOBILE_UA = "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36";

    setInterval(checkForTrigger, 5000);

    async function checkForTrigger() {
        const trigger = GM_getValue('triggerSearches');
        if (trigger && trigger.mobileCount > 0 && (Date.now() - trigger.timestamp < 120000)) {
            console.log(`[Background Searcher] MOBILE TRIGGER: ${trigger.mobileCount} searches.`);
            GM_setValue('triggerSearches', null);

            for (let i = 0; i < trigger.mobileCount; i++) {
                const query = await getQuery();
                console.log(`[Background Searcher] [Mobile] #${i+1}/${trigger.mobileCount}: ${query}`);
                await performSearch(query, MOBILE_UA);
                
                const delay = 10000 + Math.random() * 5000;
                console.log(`[Background Searcher] Waiting ${Math.round(delay/1000)}s...`);
                await new Promise(r => setTimeout(r, delay));
            }
            console.log("[Background Searcher] All triggered mobile searches complete.");
        }
    // @version      0.1.5
    ...
        async function getQuery() {
            return new Promise((resolve) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: `http://localhost:5433/api/generate?prompt=${encodeURIComponent("One-line unique search query, no quotes.")}`,
                    timeout: 10000,
                    onload: (res) => {
                    if (res.status === 200) resolve(res.responseText.trim());
                    else resolve(getRandomFallbackQuery());
                },
                onerror: () => resolve(getRandomFallbackQuery()),
                ontimeout: () => resolve(getRandomFallbackQuery())
            });
        });
    }

    function getRandomFallbackQuery() {
        const items = ["news", "weather", "stocks", "recipes", "movies", "tech", "history", "science"];
        return items[Math.floor(Math.random() * items.length)] + " " + Math.floor(Math.random() * 9999);
    }

    function performSearch(query, ua) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://www.bing.com/search?q=${encodeURIComponent(query)}&PC=OPALIOS&form=LWS001`,
                headers: { "User-Agent": ua, "Referer": "https://www.bing.com/" },
                onload: () => resolve(),
                onerror: () => resolve()
            });
        });
    }

})();
