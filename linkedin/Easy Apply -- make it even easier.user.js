// ==UserScript==
// @name         Easy Apply -> make it even easier
// @version      0.2.0
// @description  Makes "Easy Apply" actually easy: 1) auto uncheck company to follow 2) closes pop after submit 3) auto click next on contact info 4) auto select SWE/SDET resume 5) logs empty fields on questions 6) auto submit 7) close post-apply popups 8) handle safety reminders 9) handle work auth and other steps
// @author       kyxap | https://github.com/kyxap
// @match        https://www.linkedin.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=linkedin.com
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/linkedin/Easy%20Apply%20--%20make%20it%20even%20easier.user.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/linkedin/Easy%20Apply%20--%20make%20it%20even%20easier.user.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const followCompanySelector = 'input#follow-company-checkbox';
    const doneButtonOnPopUpSelector = 'div[data-test-modal][role="dialog"] > .artdeco-modal__actionbar .artdeco-button .artdeco-button__text'
    const xButtonOnPopUpSelector = 'button[data-test-modal-close-btn]';
    const nextButtonSelector = 'button[data-easy-apply-next-button]';
    const reviewButtonSelector = 'button[data-live-test-easy-apply-review-button]';
    const submitButtonSelector = 'button[data-live-test-easy-apply-submit-button]';
    const continueApplyingButtonSelector = 'button[data-live-test-job-apply-button]';
    const stepHeaderSelector = '.jobs-easy-apply-modal h3';
    
    // Selectors for the "Next best action" / "Application Sent" modal
    const postApplyModalSelector = 'div[data-test-modal][aria-labelledby="post-apply-modal"]';

    const jobTitleSelectors = [
        '.job-details-jobs-unified-top-card__job-title',
        'h1.t-24.t-bold',
        '.jobs-unified-top-card__job-title',
        '.job-card-list__title'
    ];

    const allowedUrls = [
        "https://www.linkedin.com/jobs/search/",
        "https://www.linkedin.com/jobs/collections/",
        "https://www.linkedin.com/jobs/search-results/",
        "https://www.linkedin.com/preload/",
        "https://www.linkedin.com/jobs/view/"
    ];

    // Create a debounced version of the start function
    const debouncedStart = debounce(start, 500); // Adjust the delay as needed

    // Create a MutationObserver
    var observer = new MutationObserver(debouncedStart);

    // Observe changes in the document
    observer.observe(document.body, { subtree: true, childList: true });

    function getJobType() {
        let title = "";
        for (const selector of jobTitleSelectors) {
            const el = document.querySelector(selector);
            if (el && el.textContent.trim()) {
                title = el.textContent.trim().toLowerCase();
                break;
            }
        }

        if (!title) return "Unknown";

        const sdetKeywords = ["sdet", "qa", "quality assurance", "test engineer", "automation engineer", "developer in test", "engineer in test"];
        const sweKeywords = ["software engineer", "software developer", "full stack", "backend", "frontend", "systems engineer"];

        if (sdetKeywords.some(kw => title.includes(kw))) {
            return "SDET";
        } else if (sweKeywords.some(kw => title.includes(kw))) {
            return "SWE";
        }

        return "Unknown";
    }

    /**
     * Checks for empty required fields.
     * @returns {boolean} True if all fields are filled, false otherwise.
     */
    function isFormComplete() {
        const formElements = document.querySelectorAll('.jobs-easy-apply-modal .fb-dash-form-element');
        let emptyFields = [];

        formElements.forEach(container => {
            const labelEl = container.querySelector('label, legend span[data-test-form-builder-radio-button-form-component__title]');
            const fieldName = labelEl ? labelEl.textContent.trim() : "Unknown Field";

            const radios = container.querySelectorAll('input[type="radio"]');
            if (radios.length > 0) {
                const isChecked = Array.from(radios).some(r => r.checked);
                if (!isChecked) {
                    emptyFields.push({ name: fieldName, type: "Radio" });
                }
                return;
            }

            const textInput = container.querySelector('input[type="text"], textarea');
            if (textInput) {
                if (!textInput.value.trim()) {
                    emptyFields.push({ name: fieldName, type: "Text" });
                }
                return;
            }

            const select = container.querySelector('select');
            if (select) {
                if (select.value === "Select an option" || !select.value) {
                    emptyFields.push({ name: fieldName, type: "Select" });
                }
                return;
            }
        });

        if (emptyFields.length === 0) {
            logHighlighter("All fields are pre-filled! Ready to proceed.");
            return true;
        } else {
            logHighlighter(`Found ${emptyFields.length} empty fields that need input:`);
            emptyFields.forEach(f => {
                logHighlighter(`  - [${f.type}] ${f.name}`);
            });
            return false;
        }
    }

    function start() {
        var url = location.href;
        if (allowedUrls.some(allowedUrl => url.startsWith(allowedUrl))) {
            logHighlighter("Easy Apply script is active...");

            // 0. Handle "Job search safety reminder" modal
            const safetyReminderHeader = document.querySelector('h2#header');
            if (safetyReminderHeader && safetyReminderHeader.textContent.trim() === "Job search safety reminder") {
                const continueButton = document.querySelector(continueApplyingButtonSelector);
                if (continueButton) {
                    logHighlighter("Safety reminder detected, clicking 'Continue applying'...");
                    continueButton.click();
                    return;
                }
            }

            const currentStepHeader = document.querySelector(stepHeaderSelector);
            const stepText = currentStepHeader ? currentStepHeader.textContent.trim().toLowerCase() : "";

            // 1. Contact info step (Auto-click)
            if (stepText.includes("contact info")) {
                const nextButton = document.querySelector(nextButtonSelector);
                if (nextButton) {
                    logHighlighter("Contact info step detected, clicking Next...");
                    nextButton.click();
                    return;
                }
            }

            // 2. Resume step (AUTO-SELECT + AUTO-CLICK)
            if (stepText.includes("resume")) {
                const jobType = getJobType();
                logHighlighter(`Resume step detected ("${stepText}"). We think this is: ${jobType}`);
                
                if (jobType !== "Unknown") {
                    const resumeContainers = document.querySelectorAll('.jobs-document-upload-redesign-card__container');
                    let targetResume = null;

                    resumeContainers.forEach(container => {
                        const fileNameEl = container.querySelector('.jobs-document-upload-redesign-card__file-name');
                        if (fileNameEl && fileNameEl.textContent.trim().toUpperCase().includes(jobType)) {
                            targetResume = container;
                        }
                    });

                    if (targetResume) {
                        logHighlighter(`Target resume (${jobType}) found! Selecting...`);
                        
                        // Check if already selected
                        if (!targetResume.classList.contains('jobs-document-upload-redesign-card__container--selected')) {
                            targetResume.click();
                        }

                        const nextButton = document.querySelector(nextButtonSelector);
                        if (nextButton) {
                            logHighlighter("Proceeding to next step...");
                            nextButton.click();
                            return;
                        }
                    } else {
                        logHighlighter(`No resume found containing "${jobType}". Standing by for manual selection.`);
                    }
                } else {
                    logHighlighter("Job type is Unknown. Standing by for manual resume selection.");
                }
                
                // Log options for visibility even if we stand by
                const resumes = document.querySelectorAll('.jobs-document-upload-redesign-card__file-name');
                if (resumes.length > 0) {
                    logHighlighter(`Found ${resumes.length} resume options:`);
                    resumes.forEach(r => logHighlighter(`  - ${r.textContent.trim()}`));
                }
                return;
            }

            // 3. Final Review step & Submit (Auto-click)
            const submitButton = document.querySelector(submitButtonSelector);
            if (submitButton) {
                const followCompanyCheckbox = document.querySelector(followCompanySelector);
                if (followCompanyCheckbox && followCompanyCheckbox.checked) {
                    logHighlighter('Unchecking follow company before submission...');
                    followCompanyCheckbox.click();
                }
                
                logHighlighter("Review step detected, clicking Submit Application...");
                submitButton.click();
                return;
            }

            // 4. Intermediate Steps (Questions, Work Auth, etc.)
            const reviewButton = document.querySelector(reviewButtonSelector);
            const nextButton = document.querySelector(nextButtonSelector);
            const btnToClick = reviewButton || nextButton;
            
            if (btnToClick) {
                logHighlighter(`Intermediate step detected ("${stepText}"). Checking fields...`);
                const complete = isFormComplete();
                
                if (complete) {
                    logHighlighter(`Form complete, clicking ${reviewButton ? "Review" : "Next"}...`);
                    btnToClick.click();
                    return;
                } else {
                    logHighlighter(`Standing by for manual input on "${stepText}" step.`);
                    return;
                }
            }

            // 5. Done button (Initial Success screen)
            const doneBtn = document.querySelector(doneButtonOnPopUpSelector);
            if (doneBtn) {
                logHighlighter('Initial application sent, clicking Done...');
                doneBtn.click();
                return;
            }

            // 6. Close post-apply NBA (Next Best Action) modal
            const postApplyModal = document.querySelector(postApplyModalSelector);
            if (postApplyModal) {
                const notNowBtn = Array.from(postApplyModal.querySelectorAll('button')).find(btn => btn.textContent.trim().toLowerCase() === "not now");
                if (notNowBtn) {
                    logHighlighter('NBA modal detected, clicking "Not now"...');
                    notNowBtn.click();
                } else {
                    const closeBtn = postApplyModal.querySelector(xButtonOnPopUpSelector);
                    if (closeBtn) {
                        logHighlighter('NBA modal detected, clicking close (X)...');
                        closeBtn.click();
                    }
                }
            }
        }
    }
})();

function waitForElm(selector) {
    return new Promise((resolve, reject) => {
        // Check if the element is already present
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        let timeoutId;

        const observer = new MutationObserver(mutations => {
            // Check if the element is now present
            if (document.querySelector(selector)) {
                observer.disconnect();
                clearTimeout(timeoutId);
                resolve(document.querySelector(selector));
            }
        });

        // Observe changes in the document
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

// Debounce function to limit the frequency of calls
function debounce(func, delay) {
    let timeout;
    return function () {
        clearTimeout(timeout);
        timeout = setTimeout(func, delay);
    };
}

function logHighlighter(logToHighlight) {
    const debug = true;
    if (debug) {
        console.log('[userscript-easy-apply] ' + logToHighlight);
    }
}
