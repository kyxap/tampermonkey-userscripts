// ==UserScript==
// @name         LinkedIn Job Description Copier
// @namespace    https://www.linkedin.com/jobs/search/
// @version      0.0.2
// @description  Adds a button to copy job descriptions to the clipboard on LinkedIn job search pages.
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
// @author       kyxappp
// @match        https://www.linkedin.com/jobs/search/?*
// @match        https://www.linkedin.com/jobs/collections/recommended/?*
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/linkedin/JobDescriptionCopier.user.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/linkedin/JobDescriptionCopier.user.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  // Add custom CSS for the button
GM_addStyle(`
  #copyJobDescriptionButton {
    position: fixed;
    bottom: 20px;
    right: 20%;
    background-color: #0073b1;
    color: white;
    border: none;
    padding: 10px 20px;
    font-size: 14px;
    border-radius: 5px;
    cursor: pointer;
    z-index: 1000;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transform: translateX(-10%);
  }
  #copyJobDescriptionButton:hover {
    background-color: #005582;
  }
`);

  // Create the copy button
  const button = document.createElement('button');
  button.id = 'copyJobDescriptionButton';
  button.textContent = 'Copy Job Description';
  document.body.appendChild(button);

  // Add click event to copy job description
  button.addEventListener('click', () => {
    const jobDescriptionElement = document.querySelector('.jobs-box--fadein');
    if (jobDescriptionElement) {
      const textToCopy = jobDescriptionElement.textContent.trim();
      navigator.clipboard.writeText(textToCopy).then(() => {
        console.log('Job description copied to clipboard!');
      }).catch((err) => {
        console.error('Failed to copy text: ', err);
      });
    } else {
      console.log('No job description found on this page.');
    }
  });
})();
