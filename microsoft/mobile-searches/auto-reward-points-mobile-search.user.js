// ==UserScript==
// @name         Auto Microsoft Reword Points Mobile Searches | Background Searcher
// @namespace    https://github.com/kyxap/tampermonkey-userscripts/
// @version      0.1.2
// @description  Perform mobile searches in background via GM_xmlhttpRequest
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

    console.log("[Mobile Searcher] Initialized! Listening for trigger from Breakdown page...");

    // Check for trigger every 5 seconds
    setInterval(checkForTrigger, 5000);

    async function checkForTrigger() {
        const trigger = GM_getValue('triggerMobileSearch');
        if (trigger) {
            // Check if trigger is recent (last 2 minutes)
            if (Date.now() - trigger.timestamp < 120000) {
                console.log(`[Mobile Searcher] TRIGGER DETECTED! Count: ${trigger.count}`);
                
                // Clear trigger immediately
                GM_setValue('triggerMobileSearch', null);

                for (let i = 0; i < trigger.count; i++) {
                    const query = await getQuery();
                    console.log(`[Mobile Searcher] Performing search ${i+1}/${trigger.count}: "${query}"`);
                    await performMobileSearch(query);
                    
                    const delay = 6000 + Math.random() * 6000;
                    console.log(`[Mobile Searcher] Waiting ${Math.round(delay/1000)}s for next search...`);
                    await new Promise(r => setTimeout(r, delay));
                }
                console.log("[Mobile Searcher] Background searches complete.");
            } else {
                console.warn("[Mobile Searcher] Found expired trigger, clearing.");
                GM_setValue('triggerMobileSearch', null);
            }
        }
    }

    async function getQuery() {
        return new Promise((resolve) => {
            const prompt = "Generate a one-line human-like mobile search query. One liner, no quotes.";
            GM_xmlhttpRequest({
                method: "GET",
                url: `http://localhost:5433/api/generate?prompt=${encodeURIComponent(prompt)}`,
                timeout: 5000,
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
        const items = ["weather", "pizza", "news", "how to", "best books", "movies", "games", "travel"];
        return items[Math.floor(Math.random() * items.length)] + " " + Math.floor(Math.random() * 100);
    }

    function performMobileSearch(query) {
        return new Promise((resolve) => {
            const mobileUA = "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36";
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://www.bing.com/search?q=${encodeURIComponent(query)}&PC=OPALIOS&form=LWS001&s_it=mobile`,
                headers: {
                    "User-Agent": mobileUA,
                    "Referer": "https://www.bing.com/"
                },
                onload: () => resolve(),
                onerror: () => resolve()
            });
        });
    }

})();
