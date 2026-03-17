// ==UserScript==
// @name         Auto Microsoft Reword Points Mobile Searches | Background Searcher
// @namespace    https://github.com/kyxap/tampermonkey-userscripts/
// @version      0.1.3
// @description  Perform both PC and Mobile background searches
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

    console.log("[Background Searcher] Initialized! Listening for triggers...");

    // UA strings
    const PC_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const MOBILE_UA = "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36";

    setInterval(checkForTrigger, 5000);

    async function checkForTrigger() {
        const trigger = GM_getValue('triggerSearches');
        if (trigger && (Date.now() - trigger.timestamp < 120000)) {
            console.log(`[Background Searcher] TRIGGER RECEIVED: PC=${trigger.pcCount}, Mobile=${trigger.mobileCount}`);
            GM_setValue('triggerSearches', null);

            // Do Mobile first (often faster)
            if (trigger.mobileCount > 0) {
                console.log(`[Background Searcher] Starting ${trigger.mobileCount} Mobile searches...`);
                await processSearches(trigger.mobileCount, MOBILE_UA, "Mobile");
            }

            // Then PC
            if (trigger.pcCount > 0) {
                console.log(`[Background Searcher] Starting ${trigger.pcCount} PC searches...`);
                await processSearches(trigger.pcCount, PC_UA, "PC");
            }

            console.log("[Background Searcher] All triggered searches complete.");
        }
    }

    async function processSearches(count, ua, type) {
        for (let i = 0; i < count; i++) {
            const query = await getQuery();
            console.log(`[Background Searcher] [${type}] #${i+1}/${count}: ${query}`);
            await performSearch(query, ua);
            
            // Random delay between 10-15 seconds to be very safe with new cooldowns
            const delay = 10000 + Math.random() * 5000;
            console.log(`[Background Searcher] Waiting ${Math.round(delay/1000)}s...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }

    async function getQuery() {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: `http://localhost:5433/api/generate?prompt=${encodeURIComponent("One-line unique search query, no quotes.")}`,
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
