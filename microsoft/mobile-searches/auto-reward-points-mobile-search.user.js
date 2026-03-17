// ==UserScript==
// @name         Auto Microsoft Reword Points Mobile Searches | Background Searcher
// @namespace    https://www.bing.com/
// @version      0.1.0
// @description  Perform mobile searches in background via GM_xmlhttpRequest
// @match        https://www.bing.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bing.com
// @author       kyxap | https://github.com/kyxap
// ==/UserScript==

(function () {
    'use strict';

    // Check for trigger every 5 seconds
    setInterval(checkForTrigger, 5000);

    async function checkForTrigger() {
        const trigger = GM_getValue('triggerMobileSearch');
        if (trigger && (Date.now() - trigger.timestamp < 60000)) { // Valid for 1 minute
            console.log(`[Mobile Searcher] Trigger detected! Performing ${trigger.count} searches.`);
            
            // Clear trigger so we don't repeat
            GM_setValue('triggerMobileSearch', null);

            for (let i = 0; i < trigger.count; i++) {
                const query = await getQuery();
                console.log(`[Mobile Searcher] Search #${i + 1}: ${query}`);
                await performMobileSearch(query);
                // Random delay between 3-7 seconds to look human
                await new Promise(r => setTimeout(r, 3000 + Math.random() * 4000));
            }
            console.log("[Mobile Searcher] All background searches complete.");
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
        const items = ["weather", "pizza near me", "best movies 2024", "how to bake cake", "stock market", "latest news", "top travel destinations", "workout routine"];
        return items[Math.floor(Math.random() * items.length)] + " " + Math.floor(Math.random() * 100);
    }

    function performMobileSearch(query) {
        return new Promise((resolve) => {
            // Android / Chrome Mobile User-Agent
            const mobileUA = "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Mobile Safari/537.36";
            
            GM_xmlhttpRequest({
                method: "GET",
                url: `https://www.bing.com/search?q=${encodeURIComponent(query)}&PC=OPALIOS&form=LWS001&s_it=mobile`,
                headers: {
                    "User-Agent": mobileUA,
                    "Referer": "https://www.bing.com/"
                },
                onload: (res) => {
                    console.log(`[Mobile Searcher] Search request sent for: ${query}`);
                    resolve();
                },
                onerror: (err) => {
                    console.error("[Mobile Searcher] Search failed:", err);
                    resolve();
                }
            });
        });
    }

})();
