// ==UserScript==
// @name         new-sits-updates
// @version      0.0.5
// @description  TODO
// @author       kyxap | https://github.com/kyxap
// @match        https://www.trustedhousesitters.com/house-and-pet-sitting-assignments/?q=*
// @icon         https://cdn.trustedhousesitters.com/static/favicon/mstile-150x150.png
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(function() {
    'use strict';

    const botTokenKey = "bot-token-key";
    const chatIdKey = "chat-id-key";
    const idsKey = "trusted-house-sitters-ids-key";
    const oneDayInMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds

    let botToken = GM_getValue(botTokenKey, null);
    if (!botToken) {
        botToken = prompt('Please enter your Telegram bot token:');
        if (botToken) {
            GM_setValue(botTokenKey, botToken);

        } else {
            alert('Token is required!');
            return;
        }
    }

    let chatId = GM_getValue(chatIdKey, null);
    if (!chatId) {
        chatId = prompt('Please enter your chatId:');
        if (chatId) {
            GM_setValue(chatIdKey, chatId);
        } else {
            alert('ChatId is required!');
            return;
        }
    }

    const newListingCss = `[data-testid="ListingCard__container"]:has([data-testid="ListingCard__badge__new"])`
    const listingLocationCss = `[data-testid="ListingCard__location"]`;

    start()

    function start() {
        cleanupOldIds(); // check if there old listing (> 1d)
        getNewListings()
        setTimeout(function () { location.reload(); }, 3600 * 1000); // 60m (3600 sec) // 20 mins was too much they added some "human" verification
    };

    function getNewListings() {
        let newListingsElements = document.querySelectorAll(newListingCss);
        if (newListingsElements.length > 0) {
            const baseUrl = `https://www.trustedhousesitters.com`

            console.log(`Found ${newListingsElements.length} listing with new tag`);

            for (let newListingElement of newListingsElements) {
                const id = newListingElement.querySelector(`label > input`).getAttribute(`id`)
                if (isIdExists(id)) {
                    continue;
                } else {
                    addId(id);
                }

                newListingElement = newListingElement.querySelector(`a`); // main node with all data
                const listingUrl = baseUrl + newListingElement.getAttribute('href');
                const location = newListingElement.querySelector(listingLocationCss).innerText;
                const imgUrl = newListingElement.querySelector(`img[src]`).getAttribute(`src`);
                const name = newListingElement.querySelector(`[data-testid="ListingCard__title"]`).innerText
                const dates = newListingElement.querySelector('div:nth-of-type(3)').innerText; // TODO no id so may not work

                const message = `
<a href="${listingUrl}"><u>${name}</u></a>
<i>${location}</i>
<i>${dates}</i>
            `;
                sendMessage(message, imgUrl);
              }

        } else {
            console.log("No new listings at the moment");
        }
    }

    // Function to add a new ID with current timestamp
    function addId(id) {
        console.log(`Saving id: ${id}`)
        const ids = getAllIds();
        ids[id] = Date.now(); // Store current timestamp for the ID
        console.log(`ids after id inster: ${ids}`)
        GM_setValue(idsKey, ids); // Save updated IDs
        console.log(`Saved: ids[${id}]:${ids[id]}`)
    }

    // Function to get all stored IDs
    function getAllIds() {
        const ids = GM_getValue(idsKey, {});
        console.log(`All IDS: ${Object.keys(ids)}`)
        return ids; // Return array of IDs
    }

    // Function to check if a specific ID already exists in the stored list
    function isIdExists(newId) {
        console.log(`Checking if id already exist: ${newId}`);

        const ids = getAllIds(); // Retrieve stored IDs

        // Check if newId exists in the stored IDs
        if (newId && ids[newId]) {
            console.log(`ID ${newId} exists in GM!`);
            return true; // ID exists
        } else {
            console.log(`ID ${newId} does not exists in GM!`);
        }

        return false; // ID does not exist
    }

    // Function to clean up IDs older than 1 day
    function cleanupOldIds() {
        console.log(`Starting old id cleanup`);
        const ids = getAllIds(); // Retrieve stored IDs
        const currentTimestamp = Date.now();
        console.log(`Stored ids count: ${Object.keys(ids).length}`);
        // Iterate over IDs and check timestamps
        for (const id in ids) {
            console.log(`Checking: ${id}`);
            if (currentTimestamp - ids[id] >= oneDayInMs) {
                console.log(`Deleting ID: ${id}`);
                delete ids[id]; // Remove ID from object
            } else {
                console.log(`ID: ${id} is not old`);
            }
        }
        GM_setValue(idsKey, ids); // Save updated IDs after cleanup

    }

    // Function to send the message
    function sendMessage(message, imgUrl) {
        const url = `https://api.telegram.org/bot${botToken}/sendPhoto`;

        const data = {
            chat_id: chatId,
            text: message,
            photo: imgUrl,
            caption: message,
            parse_mode: 'HTML'
        };

        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                console.log('Message sent successfully:', data);
            } else {
                console.error('Error sending message:', data);
            }
        })
        .catch(error => {
            console.error('Error sending message:', error);
        });
    }

})();