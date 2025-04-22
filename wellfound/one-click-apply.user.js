// ==UserScript==
// @name         wellfound-one-click-apply
// @namespace    https://wellfound.com/
// @version      0.0.4
// @description  Only click apply for Wellfound
// @match        https://wellfound.com/jobs
// @author       kyxap | https://github.com/kyxap
// @icon         https://wellfound.com/wellfound-favicon-16x.png
// @updateURL    https://github.com/kyxap/tampermonkey-userscripts/raw/main/wellfound/one-click-apply.user.js
// @downloadURL  https://github.com/kyxap/tampermonkey-userscripts/raw/main/wellfound/one-click-apply.user.js
// @supportURL   https://github.com/kyxap/tampermonkey-userscripts/issues
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// ==/UserScript==

(function () {
    'use strict';

    const apolloSignatureKey = "apollo-signature-key";
    const operationIdKey = "operation-id-key";

    let apolloSignature = GM_getValue(apolloSignatureKey, null);
    if (!apolloSignature) {
        apolloSignature = prompt('Please enter your x-apollo-signature: ');
        if (apolloSignature) {
            GM_setValue(apolloSignatureKey, apolloSignature);
        } else {
            alert('x-apollo-signature is required!');
            return;
        }
    }

    let operationId = GM_getValue(operationIdKey, null);
    if (!operationId) {
        operationId = prompt('Please enter your operationId:');
        if (operationId) {
            GM_setValue(operationIdKey, operationId);
        } else {
            alert('operationId is required!');
            return;
        }
    }

    function injectButtons(container) {
        const buttonBlocks = container.querySelectorAll('[class^="styles_controlButtons__"]');
        buttonBlocks.forEach(buttonBlock => {
            if (buttonBlock.querySelector('.quick-apply-btn')) return;

            // Quick Apply button
            const applyBtn = document.createElement('button');
            applyBtn.innerText = 'Quick Apply';
            applyBtn.className = 'quick-apply-btn styles_component__sMuDw rounded border-solid border gap-x-2 whitespace-nowrap font-medium antialiased text-center text-sm no-underline cursor-pointer focus:outline-0 transition duration-200 px-3 py-1 bg-green-600 border-green-800 text-white hover:border-gtmblue-500';

            applyBtn.onclick = () => {
                const jobLink = container.querySelector('a[href^="/jobs/"]')?.getAttribute('href');
                const startupImgSrc = container.querySelector('[src^="/cdn-cgi/image/"]')?.getAttribute('src');

                if (!jobLink || !startupImgSrc) {
                    showError("Missing job link or startup image");
                    return;
                }

                const jobMatch = jobLink.match(/\/jobs\/(\d+)-/);
                const startupMatch = startupImgSrc.match(/startups\/i\/(\d+)-/);

                if (!jobMatch || !startupMatch) {
                    showError("Could not extract job/startup ID");
                    return;
                }

                const jobId = jobMatch[1];
                const startupId = startupMatch[1];

                fetch('https://wellfound.com/graphql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-angellist-dd-client-referrer-resource': `/jobs/:jobId-:jobSlug([a-zA-Z0-9-_]+)`,
                        'x-apollo-operation-name': 'CreateJobApplication',
                        'x-apollo-signature': apolloSignature,
                        'x-original-referer': 'https://wellfound.com/jobs',
                        'x-requested-with': 'XMLHttpRequest'
                    },
                    body: JSON.stringify({
                        operationName: "CreateJobApplication",
                        variables: {
                            input: {
                                sourceId: null,
                                jobListingId: jobId,
                                product: "company profile",
                                questionResponseSets: null,
                                customQuestionAnswers: [],
                                startupId: startupId,
                                userNote: ""
                            }
                        },
                        extensions: {
                            operationId: operationId
                        }
                    })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data?.data?.jobListing?.currentUserApplied) {
                            applyBtn.disabled = true;
                            applyBtn.className = applyBtn.className.replace('bg-green-600', 'bg-gray-400');
                        } else if (data?.errors?.length) {
                            const msg = data.errors.map(err => err.message).join('\n');
                            showError(msg);
                            applyBtn.className = applyBtn.className.replace('bg-green-600', 'bg-red-600');
                            applyBtn.onclick = () => {
                                window.open(`https://wellfound.com${jobLink}`, '_blank');
                            };
                        } else {
                            throw new Error("Unknown application issue");
                        }
                    })
                    .catch(err => {
                        console.error('Application error:', err);
                        showError(err.message || "Unknown error occurred");
                        applyBtn.className = applyBtn.className.replace('bg-green-600', 'bg-red-600');
                        applyBtn.onclick = () => {
                            window.open(`https://wellfound.com${jobLink}`, '_blank');
                        };
                    });
            };


            buttonBlock.appendChild(applyBtn);
        });
    }

    function showError(message) {
        const existing = document.querySelector('.quick-apply-error-popup');
        if (existing) existing.remove();

        const popup = document.createElement('div');
        popup.className = 'quick-apply-error-popup';
        popup.innerText = message;
        Object.assign(popup.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#ff4d4f',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '5px',
            boxShadow: '0 0 10px rgba(0,0,0,0.2)',
            zIndex: 10000,
            maxWidth: '300px',
            fontSize: '14px'
        });

        document.body.appendChild(popup);

        setTimeout(() => popup.remove(), 4000);
    }


    function scanAndInject() {
        document.querySelectorAll('[data-test="StartupResult"]').forEach(injectButtons);
    }

    function addResetButton() {
        const button = document.createElement('button');
        button.textContent = 'Reset History';
        Object.assign(button.style, {
            position: 'fixed',
            bottom: '100px',
            right: '10px',
            zIndex: 1000,
            padding: '10px',
            backgroundColor: '#ff6347',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
        });

        button.addEventListener('click', () => {
            if (confirm('Are you sure you want to reset operationId and apolloSignature?')) {
                GM_deleteValue(operationIdKey);
                GM_deleteValue(apolloSignatureKey);
                alert('Values removed! Refresh the page to re-enter them.');
            }
        });

        document.body.appendChild(button);
    }

    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            mutation.addedNodes.forEach(node => {
                if (!(node instanceof HTMLElement)) return;
                if (node.matches?.('[data-test="StartupResult"]')) {
                    injectButtons(node);
                } else if (node.querySelectorAll) {
                    node.querySelectorAll('[data-test="StartupResult"]').forEach(injectButtons);
                }
            });
        }
    });

    observer.observe(document.querySelector('#main') || document.body, { childList: true, subtree: true });

    addResetButton();
    scanAndInject();
})();
