/* 
   pwdhash-enhanced.js
   Features: Min/Max Length, Special Character Rules, Capitalization, URL State, User Hint, Dynamic Title, Auto-fill
   Fixes: CSP compliance, Logic order for Max Length, Selector specificity
*/

window.addEventListener('load', function() {
    console.log("PwdHash-Enhanced: Loaded.");
    injectInterface();
    attachListeners();
    // Delay load slightly to ensure original scripts have initialized
    setTimeout(loadFromUrl, 500); 
});

// --- 0. Auto-fill from Site Requirements ---

/**
 * Normalize a domain or keyword for lookup in SITE_REQUIREMENTS
 * Examples:
 *   "secure.chase.com" -> "chase"
 *   "www.bankofamerica.com" -> "bankofamerica"
 *   "login.paypal.com" -> "paypal"
 *   "Amazon" -> "amazon"
 */
function normalizeForLookup(input) {
    if (!input) return "";
    return input
        .toLowerCase()
        .trim()
        .replace(/^(https?:\/\/)?/, "")          // strip protocol
        .replace(/^(www|secure|login|auth|account|my|signin|signon)\./, "")  // strip common subdomains
        .replace(/\/.*$/, "")                     // strip path
        .replace(/\.(com|org|net|edu|gov|io|co|me|app|dev|ai|tv|info|biz|us|uk|ca|au|de|fr|jp|cn|in|br|ru|co\.uk|com\.au|co\.jp|com\.br)$/, "")  // strip TLD
        .replace(/[^a-z0-9]/g, "");               // remove remaining non-alphanumeric
}

/**
 * Check if auto-fill data exists for the given input and apply it
 */
function checkAutoFill(rawValue) {
    if (typeof SITE_REQUIREMENTS === 'undefined') {
        console.log("PwdHash-Enhanced: SITE_REQUIREMENTS not loaded");
        return false;
    }
    
    var key = normalizeForLookup(rawValue);
    if (!key) return false;
    
    var reqs = SITE_REQUIREMENTS[key];
    if (reqs) {
        applyRequirements(reqs, false);  // false = don't clear first
        showAutoFillNotice(key);
        return true;
    }
    return false;
}

/**
 * Apply requirements to the form
 */
function applyRequirements(reqs, clearFirst) {
    if (clearFirst) {
        clearRequirements();
    }
    
    if (reqs.min) document.getElementById('ext-minLength').value = reqs.min;
    if (reqs.max) document.getElementById('ext-maxLength').value = reqs.max;
    if (reqs.noSym) document.getElementById('chk-nosym').checked = true;
    if (reqs.reqSym) document.getElementById('chk-reqsym').checked = true;
    if (reqs.reqNum) document.getElementById('chk-reqnum').checked = true;
    if (reqs.reqCap) document.getElementById('chk-reqcap').checked = true;
    if (reqs.reqLower) document.getElementById('chk-reqlower').checked = true;
    // Note: hint is intentionally NOT auto-filled - it's for personal notes
    
    // Trigger constraint application
    applyConstraints();
}

/**
 * Clear all requirement fields to defaults
 */
function clearRequirements() {
    document.getElementById('ext-minLength').value = "";
    document.getElementById('ext-maxLength').value = "";
    document.getElementById('chk-nosym').checked = false;
    document.getElementById('chk-reqsym').checked = false;
    document.getElementById('chk-reqnum').checked = false;
    document.getElementById('chk-reqcap').checked = false;
    document.getElementById('chk-reqlower').checked = false;
    // Note: hint is intentionally NOT cleared - it's for personal notes
}

/**
 * Show notification that auto-fill was applied
 */
function showAutoFillNotice(siteName) {
    var notice = ensureAutoFillNotice();
    if (!notice) return;
    
    notice.innerText = "Auto-filled rules for " + siteName;
    positionCopyNotice(notice);
    notice.classList.add('show');
    
    if (window.autoFillNoticeTimer) clearTimeout(window.autoFillNoticeTimer);
    window.autoFillNoticeTimer = setTimeout(function() {
        notice.classList.remove('show');
    }, 2400);
}

function ensureAutoFillNotice() {
    var existing = document.getElementById('autofill-notice');
    if (existing) return existing;
    
    var hashedSection = document.getElementById('theHashedPassword');
    if (!hashedSection) return null;
    
    var notice = document.createElement('div');
    notice.id = "autofill-notice";
    notice.className = "copy-notice";
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    
    hashedSection.appendChild(notice);
    return notice;
}

// --- 1. Interface Injection ---
function injectInterface() {
    var passInput = document.querySelector('input[type="password"]');
    if (!passInput) return;

    var passRow = passInput.closest('tr');
    var parentTable = passRow.parentNode;
    var refRow = passRow.nextElementSibling;
    var insertBeforeRow = refRow ? refRow.nextElementSibling : null;
    var hashField = document.getElementsByName('hashedPassword')[0];

    // SVG Icons
    var iconNoSym = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`;
    
    // Helper to create checkbox row (CSP Safe)
    function createCheckRow(id, label, iconHtml) {
        var tr = document.createElement('tr');
        tr.className = "check-row";
        
        var tdLabel = document.createElement('td');
        tdLabel.className = "label";
        tdLabel.style.verticalAlign = "middle";
        tdLabel.classList.add("check-label");
        
        var span = document.createElement('span');
        span.style.display = "inline-flex";
        span.style.alignItems = "center";
        span.style.gap = "4px";
        
        var iconSpan = document.createElement('span');
        iconSpan.className = "check-icon";
        iconSpan.innerHTML = iconHtml;
        
        var labelSpan = document.createElement('span');
        labelSpan.textContent = label;
        
        span.appendChild(iconSpan);
        span.appendChild(labelSpan);
        tdLabel.appendChild(span);
        
        var tdInput = document.createElement('td');
        tdInput.classList.add("check-input");
        var input = document.createElement('input');
        input.type = "checkbox";
        input.id = id;
        input.style.verticalAlign = "middle";
        
        input.addEventListener('change', applyConstraints);

        tdInput.appendChild(input);
        tr.appendChild(tdLabel);
        tr.appendChild(tdInput);
        return tr;
    }

    function createInlineField(id, label, type, placeholder) {
        var wrapper = document.createElement('div');
        wrapper.className = "inline-field";

        var labelEl = document.createElement('label');
        labelEl.setAttribute('for', id);
        labelEl.innerText = label;

        var input = document.createElement('input');
        input.type = type;
        input.id = id;
        input.placeholder = placeholder;

        if (type === "number") {
            input.style.width = "100%";
            if (id === "ext-minLength" || id === "ext-maxLength") {
                input.classList.add("length-input");
                input.maxLength = 3;
                input.setAttribute("maxlength", "3");
            }
        } else {
            input.style.width = "100%";
        }

        input.addEventListener('input', applyConstraints);
        input.addEventListener('change', applyConstraints);

        wrapper.appendChild(labelEl);
        wrapper.appendChild(input);
        return wrapper;
    }

    function createInlineFieldsRow(fields) {
        var tr = document.createElement('tr');
        tr.className = "inline-fields-row";

        var td = document.createElement('td');
        td.colSpan = 2;

        var container = document.createElement('div');
        container.className = "inline-fields";
        fields.forEach(function(field) {
            container.appendChild(createInlineField(field.id, field.label, field.type, field.placeholder));
        });

        td.appendChild(container);
        tr.appendChild(td);
        return tr;
    }

    function createSingleFieldRow(field, rowClass) {
        var tr = document.createElement('tr');
        tr.className = rowClass || "";

        var td = document.createElement('td');
        td.colSpan = 2;
        td.appendChild(createInlineField(field.id, field.label, field.type, field.placeholder));

        tr.appendChild(td);
        return tr;
    }

    // Insert Checkboxes
    parentTable.insertBefore(createCheckRow("chk-reqsym", "Require Symbol", "<b>@</b>"), insertBeforeRow);
    parentTable.insertBefore(createCheckRow("chk-nosym", "Ban Symbols", iconNoSym), insertBeforeRow);
    parentTable.insertBefore(createCheckRow("chk-reqnum", "Require Number", "<b>#</b>"), insertBeforeRow);
    parentTable.insertBefore(createCheckRow("chk-reqcap", "Require Uppercase", "<b>A</b>"), insertBeforeRow);
    parentTable.insertBefore(createCheckRow("chk-reqlower", "Require Lowercase", "<b><u>a</u></b>"), insertBeforeRow);

    parentTable.insertBefore(createInlineFieldsRow([
        { id: "ext-minLength", label: "Min Length", type: "number", placeholder: "None" },
        { id: "ext-maxLength", label: "Max Length", type: "number", placeholder: "None" }
    ]), insertBeforeRow);
    parentTable.insertBefore(createSingleFieldRow(
        { id: "ext-hint", label: "Hint", type: "text", placeholder: "Optional" },
        "hint-row"
    ), insertBeforeRow);

    // Insert Copy Button
    var btnRow = document.createElement('tr');
    btnRow.className = "copy-config-row";
    var btnTd = document.createElement('td');
    btnTd.colSpan = 2;
    var btn = document.createElement('button');
    btn.type = "button";
    btn.innerText = "Copy site rules link";
    btn.style.marginTop = "8px";
    btn.style.cursor = "pointer";
    btn.style.whiteSpace = "nowrap";
    btn.onclick = copySafeUrl;

    btnTd.appendChild(btn);
    btnRow.appendChild(btnTd);
    parentTable.insertBefore(btnRow, insertBeforeRow);

    insertHashedPasswordCopyButton(hashField);
    ensureCopyNotice();
}

// --- 2. Listeners ---
function attachListeners() {
    // General listeners for hash regeneration
    var inputs = document.querySelectorAll('input');
    inputs.forEach(function(el) {
        if (el.id === 'ext-hint') return; // Skip hint field for hash gen
        if (el.name === 'hashedPassword') return;
        el.addEventListener('input', scheduleRegenerate);
        el.addEventListener('change', scheduleRegenerate);
    });

    var hashField = document.getElementById('hashedPassword') || document.getElementsByName('hashedPassword')[0];
    if (hashField) {
        configureHashedPasswordField(hashField);
        hashField.addEventListener('click', function() {
            if (hashField.value && hashField.value !== "Press Generate" && !hashField.classList.contains('hash-error')) {
                copyGeneratedPassword(hashField.value);
            }
        });
    }

    setupKeywordClear();

    // Specific listener for Page Title updates and Auto-fill (Site Keyword field)
    var siteInput = document.querySelector('input[type="text"]:not([readonly]):not(#ext-hint)');
    if (siteInput) {
        var lastAutoFillValue = "";
        
        var handleSiteChange = function() {
            // Update title
            if (siteInput.value) {
                document.title = "Site password for " + siteInput.value;
            }
            
            // Attempt auto-fill only when value changes significantly
            var normalized = normalizeForLookup(siteInput.value);
            if (normalized && normalized !== lastAutoFillValue) {
                if (checkAutoFill(siteInput.value)) {
                    lastAutoFillValue = normalized;
                }
            }
        };
        
        siteInput.addEventListener('input', handleSiteChange);
        siteInput.addEventListener('change', handleSiteChange);
        
        // Also handle blur for paste scenarios
        siteInput.addEventListener('blur', handleSiteChange);
    }

    var noSymInput = document.getElementById('chk-nosym');
    var reqSymInput = document.getElementById('chk-reqsym');
    if (noSymInput && reqSymInput) {
        noSymInput.addEventListener('change', function() {
            if (noSymInput.checked) {
                reqSymInput.checked = false;
            }
            applyConstraints();
        });
        reqSymInput.addEventListener('change', function() {
            if (reqSymInput.checked) {
                noSymInput.checked = false;
            }
            applyConstraints();
        });
    }

    var minInput = document.getElementById('ext-minLength');
    var maxInput = document.getElementById('ext-maxLength');
    var iterationInput = document.getElementsByName('iterations')[0];
    if (minInput) {
        minInput.addEventListener('input', function() { validateNumberInput(minInput, { minValue: 0 }); });
        minInput.addEventListener('change', function() { validateNumberInput(minInput, { minValue: 0 }); });
    }
    if (maxInput) {
        maxInput.addEventListener('input', function() { validateNumberInput(maxInput, { minValue: 0 }); });
        maxInput.addEventListener('change', function() { validateNumberInput(maxInput, { minValue: 0 }); });
    }
    if (iterationInput) {
        iterationInput.addEventListener('input', function() { validateNumberInput(iterationInput, { minValue: 1 }); });
        iterationInput.addEventListener('change', function() { validateNumberInput(iterationInput, { minValue: 1 }); });
    }

    // Salt validation
    setupSaltValidation();
}

function setupSaltValidation() {
    var saltInput = document.getElementsByName('salt')[0];
    if (!saltInput) return;

    // Revert to ChangeMe if empty on blur
    saltInput.addEventListener('blur', function() {
        if (!saltInput.value.trim()) {
            saltInput.value = 'ChangeMe';
        }
        updateSaltErrorState();
    });

    saltInput.addEventListener('input', updateSaltErrorState);
    saltInput.addEventListener('change', updateSaltErrorState);

    // Initial check
    updateSaltErrorState();
}

function updateSaltErrorState() {
    var saltInput = document.getElementsByName('salt')[0];
    if (!saltInput) return;

    var isDefault = saltInput.value === 'ChangeMe';
    
    if (isDefault) {
        saltInput.classList.add('salt-error');
    } else {
        saltInput.classList.remove('salt-error');
    }
}

function isSaltValid() {
    var saltInput = document.getElementsByName('salt')[0];
    return saltInput && saltInput.value !== 'ChangeMe';
}

function setupKeywordClear() {
    var keywordInput = document.getElementById('keywordInput');
    var clearButton = document.getElementById('keywordClear');
    if (!keywordInput || !clearButton) return;

    var updateButtonState = function() {
        clearButton.disabled = !keywordInput.value;
    };

    clearButton.addEventListener('click', function() {
        keywordInput.value = "";
        keywordInput.dispatchEvent(new Event('input', { bubbles: true }));
        keywordInput.focus();
        updateButtonState();
        clearRequirements();  // Also clear auto-filled requirements
    });

    keywordInput.addEventListener('input', updateButtonState);
    keywordInput.addEventListener('change', updateButtonState);
    updateButtonState();
}

// --- 3. Core Logic ---
function processHash() {
    var hashField = document.getElementById('hashedPassword') || document.getElementsByName('hashedPassword')[0];
    if (!hashField) return;

    var currentVal = hashField.value;
    if (!currentVal || currentVal === "undefined") return;

    var lastOutput = hashField.getAttribute('data-last-output');
    if (currentVal !== lastOutput) {
        hashField.setAttribute('data-full-hash', currentVal);
    }

    applyConstraints();
}

var regenerateTimer;
function scheduleRegenerate() {
    if (regenerateTimer) clearTimeout(regenerateTimer);
    regenerateTimer = setTimeout(regenerateHash, 300);
}

function regenerateHash() {
    var hashField = document.getElementById('hashedPassword') || document.getElementsByName('hashedPassword')[0];
    if (!hashField) return;

    // Check if salt is still default
    if (!isSaltValid()) {
        hashField.value = "Choose a secret salt you'll remember";
        hashField.classList.add('hash-error');
        hashField.setAttribute('data-full-hash', '');
        hashField.setAttribute('data-last-output', '');
        return;
    }

    hashField.classList.remove('hash-error');

    if (typeof GenerateToTextField === 'function') {
        GenerateToTextField();
    } else if (typeof Generate === 'function') {
        hashField.value = Generate();
        hashField.disabled = false;
    }
    processHash();
}

function applyConstraints() {
    var hashField = document.getElementById('hashedPassword') || document.getElementsByName('hashedPassword')[0];
    if (!hashField) return;

    var previousOutput = hashField.getAttribute('data-last-output');
    var fullHash = hashField.getAttribute('data-full-hash');
    if (!fullHash) return;

    // Get Settings
    var noSym = document.getElementById('chk-nosym').checked;
    var reqNum = document.getElementById('chk-reqnum').checked;
    var reqSym = document.getElementById('chk-reqsym').checked;
    var reqCap = document.getElementById('chk-reqcap').checked;
    var reqLower = document.getElementById('chk-reqlower').checked;
    var minInput = document.getElementById('ext-minLength');
    var maxInput = document.getElementById('ext-maxLength');
    var min = getValidatedNumber(minInput, { minValue: 0 });
    var max = getValidatedNumber(maxInput, { minValue: 0 });

    var result = fullHash;

    function applyLengthConstraints() {
        // Pad: Min Length
        if (!isNaN(min) && min > 0) {
            while (result.length < min) {
                result += result;
            }
        }

        // Truncate: Max Length
        if (!isNaN(max) && max > 0 && result.length > max) {
            result = result.substring(0, max);
        }
    }

    // 1. Pad/Truncate to Length Constraints
    applyLengthConstraints();

    // 3. Filter: Ban Symbols
    if (noSym) {
        result = result.replace(/[^a-zA-Z0-9]/g, '');
        if (result.length === 0) result = "Res" + fullHash.length;
    }

    // Re-apply length constraints after filtering to honor min/max limits.
    applyLengthConstraints();

    function insertOrReplace(char, avoidRegexes) {
        if (!isNaN(max) && max > 0 && result.length >= max) {
            var index = -1;
            for (var i = 0; i < result.length; i++) {
                var shouldAvoid = avoidRegexes && avoidRegexes.some(function(regex) {
                    return regex.test(result[i]);
                });
                if (!shouldAvoid) {
                    index = i;
                    break;
                }
            }
            if (index === -1) index = result.length - 1;
            result = result.substring(0, index) + char + result.substring(index + 1);
        } else {
            result += char;
        }
    }

    var requiredTypes = 0;
    if (reqCap) requiredTypes += 1;
    if (reqLower) requiredTypes += 1;
    if (reqNum) requiredTypes += 1;
    if (reqSym && !noSym) requiredTypes += 1;
    var canEnforceAll = isNaN(max) || max === 0 || max >= requiredTypes;

    if (canEnforceAll) {
        // 4. Enforce Uppercase
        if (reqCap && !/[A-Z]/.test(result)) {
            if (/[a-z]/.test(result) && !reqLower) {
                result = result.replace(/[a-z]/, function(c) { return c.toUpperCase(); });
            } else {
                var caps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                var upperChar = caps.charAt(result.charCodeAt(0) % caps.length);
                insertOrReplace(upperChar);
            }
        }

        // 4b. Enforce Lowercase
        if (reqLower && !/[a-z]/.test(result)) {
            if (/[A-Z]/.test(result) && !reqCap) {
                result = result.replace(/[A-Z]/, function(c) { return c.toLowerCase(); });
            } else {
                var lowers = "abcdefghijklmnopqrstuvwxyz";
                var lowerChar = lowers.charAt(result.charCodeAt(0) % lowers.length);
                var avoidForLower = [];
                if (reqCap) avoidForLower.push(/[A-Z]/);
                insertOrReplace(lowerChar, avoidForLower);
            }
        }

        // 5. Enforce Number
        if (reqNum && !/\d/.test(result)) {
            var numberChar = (result.length % 10).toString();
            var avoidForNumber = [];
            if (reqCap) avoidForNumber.push(/[A-Z]/);
            if (reqLower) avoidForNumber.push(/[a-z]/);
            if (reqSym && !noSym) avoidForNumber.push(/[^a-zA-Z0-9]/);
            insertOrReplace(numberChar, avoidForNumber);
        }

        // 6. Enforce Symbol
        if (reqSym && !noSym && !/[^a-zA-Z0-9]/.test(result)) {
            var syms = "!@#$%^&*";
            var symbolChar = syms.charAt(result.charCodeAt(0) % syms.length);
            var avoidForSymbol = [];
            if (reqCap) avoidForSymbol.push(/[A-Z]/);
            if (reqLower) avoidForSymbol.push(/[a-z]/);
            if (reqNum) avoidForSymbol.push(/\d/);
            insertOrReplace(symbolChar, avoidForSymbol);
        }
    }

    hashField.value = result;
    hashField.setAttribute('data-last-output', result);
}

function copyGeneratedPassword(password) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) return;
    navigator.clipboard.writeText(password).then(function() {
        showCopyNotice();
    }).catch(function() {});
}

function ensureCopyNotice() {
    var existing = document.getElementById('copy-notice');
    if (existing) return existing;

    var hashedSection = document.getElementById('theHashedPassword');
    if (!hashedSection) return null;

    var notice = document.createElement('div');
    notice.id = "copy-notice";
    notice.className = "copy-notice";
    notice.innerText = "Password copied to clipboard.";
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');

    hashedSection.appendChild(notice);
    return notice;
}

var copyNoticeTimer;
function showCopyNotice() {
    var notice = ensureCopyNotice();
    if (!notice) return;
    positionCopyNotice(notice);
    notice.classList.add('show');
    if (copyNoticeTimer) clearTimeout(copyNoticeTimer);
    copyNoticeTimer = setTimeout(function() {
        notice.classList.remove('show');
    }, 2400);
}

function positionCopyNotice(notice) {
    var hashedSection = document.getElementById('theHashedPassword');
    if (!hashedSection) return;
    var rect = hashedSection.getBoundingClientRect();
    notice.style.left = (rect.left + rect.width / 2) + "px";
    notice.style.top = (rect.bottom - 8) + "px";
}

function configureHashedPasswordField(hashField) {
    var hintText = "Click the copy button to copy the password";
    hashField.placeholder = hintText;
    hashField.title = hintText;
    hashField.setAttribute('aria-label', hintText);
    hashField.setAttribute('aria-describedby', 'copy-notice');
}

function getValidatedNumber(input, options) {
    if (!input) return NaN;
    var raw = input.value.trim();
    if (!raw) return NaN;
    var num = Number(raw);
    if (!Number.isFinite(num) || num < options.minValue) {
        input.value = "";
        return NaN;
    }
    if (!Number.isInteger(num)) {
        num = Math.floor(num);
        input.value = num.toString();
    }
    return num;
}

function validateNumberInput(input, options) {
    getValidatedNumber(input, options);
}

function insertHashedPasswordCopyButton(hashField) {
    if (!hashField) return;
    var existing = document.getElementById('hashedPasswordCopyButton');
    if (existing) return;

    var row = document.createElement('div');
    row.className = 'hashed-password-row';

    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'hashedPasswordCopyButton';
    button.className = 'copy-button';
    button.setAttribute('aria-label', 'Copy hashed password');
    button.title = 'Copy hashed password';
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="9" y="9" width="11" height="11" rx="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
    button.addEventListener('click', function() {
        if (hashField.value && hashField.value !== "Press Generate" && !hashField.classList.contains('hash-error')) {
            copyGeneratedPassword(hashField.value);
        }
    });

    var parent = hashField.parentNode;
    parent.insertBefore(row, hashField);
    row.appendChild(hashField);
    row.appendChild(button);
}

// --- 4. URL State ---
function loadFromUrl() {
    var params = new URLSearchParams(window.location.search);
    
    // Set Checkboxes
    if (params.get('nosym') === 't') document.getElementById('chk-nosym').checked = true;
    if (params.get('reqnum') === 't') document.getElementById('chk-reqnum').checked = true;
    if (params.get('reqsym') === 't') document.getElementById('chk-reqsym').checked = true;
    if (params.get('reqcap') === 't') document.getElementById('chk-reqcap').checked = true;
    if (params.get('reqlower') === 't') document.getElementById('chk-reqlower').checked = true;

    // Set Numbers
    if (params.get('min')) document.getElementById('ext-minLength').value = params.get('min');
    if (params.get('max')) document.getElementById('ext-maxLength').value = params.get('max');

    // Set Hint
    if (params.get('hint')) document.getElementById('ext-hint').value = params.get('hint');

    // Set Site & Trigger
    var site = params.get('site') || params.get('keyword');
    if (site) {
        // Ensure we find the main keyword input, not our hint field
        var siteInput = document.querySelector('input[type="text"]:not([readonly]):not(#ext-hint)');
        if (siteInput) {
            siteInput.value = site;
            siteInput.dispatchEvent(new Event('input', { bubbles: true }));
            document.title = "Site password for " + site; // Update Title on Load
            
            // Only auto-fill if NO URL params were provided for requirements
            var hasUrlRequirements = params.get('nosym') || params.get('reqnum') || 
                                     params.get('reqsym') || params.get('reqcap') || 
                                     params.get('reqlower') ||
                                     params.get('min') || params.get('max');
            
            if (!hasUrlRequirements) {
                checkAutoFill(site);
            }
            
            if (typeof Generate === 'function') Generate();
            else if (typeof generate === 'function') generate();
            setTimeout(processHash, 100);
        }
    }
}

function copySafeUrl() {
    var siteInput = document.querySelector('input[type="text"]:not([readonly]):not(#ext-hint)');
    var url = new URL(window.location.href);

    var setBool = (id, param) => {
        if (document.getElementById(id).checked) url.searchParams.set(param, 't');
        else url.searchParams.delete(param);
    };
    var setVal = (id, param) => {
        var val = document.getElementById(id).value;
        if (val) url.searchParams.set(param, val);
        else url.searchParams.delete(param);
    };

    if (siteInput && siteInput.value) url.searchParams.set('site', siteInput.value);
    
    setBool('chk-nosym', 'nosym');
    setBool('chk-reqnum', 'reqnum');
    setBool('chk-reqsym', 'reqsym');
    setBool('chk-reqcap', 'reqcap');
    setBool('chk-reqlower', 'reqlower');
    setVal('ext-minLength', 'min');
    setVal('ext-maxLength', 'max');
    setVal('ext-hint', 'hint');

    window.history.replaceState({}, '', url);
    navigator.clipboard.writeText(url.toString()).then(function() {
        showConfigCopiedNotice();
    });
}

function showConfigCopiedNotice() {
    var notice = ensureAutoFillNotice();
    if (!notice) return;
    
    notice.innerText = "Site rules link copied!";
    positionCopyNotice(notice);
    notice.classList.add('show');
    
    if (window.autoFillNoticeTimer) clearTimeout(window.autoFillNoticeTimer);
    window.autoFillNoticeTimer = setTimeout(function() {
        notice.classList.remove('show');
    }, 2400);
}
