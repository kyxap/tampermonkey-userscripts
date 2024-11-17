// ==UserScript==
// @name         Get Author - Book as to do list
// @namespace    https://www.goodreads.com
// @version      0.0.2
// @description  Get author and book as to do list (md)
// @author       kyxap
// @match        https://www.goodreads.com/review/list/*shelf=to-read*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=goodreads.com
// @grant        none
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/goodreads/to-read-author-books-extractor.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/goodreads/to-read-author-books-extractor.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// ==/UserScript==

(function() {
    'use strict';

    // Utility function to clean text
    function cleanText(text) {
        return text.replace(/\n/g, '')       // Remove newlines
            .replace(/\s{2,}/g, ' ') // Collapse multiple spaces into one
            .trim();                 // Remove leading/trailing whitespace
    }

    // Select all author elements
    const authors = document.querySelectorAll("[class='field author'] > .value");
    // Select all book title elements
    const books = document.querySelectorAll("[class='field title'] > .value");

    // Create an array to hold the output list
    const bookList = [];

    // Ensure both lists are of the same length
    const length = Math.min(authors.length, books.length);

    // Collect the data into the array
    for (let i = 0; i < length; i++) {
        const author = cleanText(authors[i]?.textContent || '');
        const book = cleanText(books[i]?.textContent || '');
        if (author && book) {
            bookList.push(`- [ ] ${author} - ${book}`);
        }
    }

    // Sort the bookList in ascending order
    // Does not make sense to sort since hard to find what was added new
    //bookList.sort((a, b) => a.localeCompare(b));

    // Print the sorted list to the console
    console.log("Books and Authors Checklist:");
    console.log(bookList.join("\n"));
})();