/* 
   pwdhash-enhanced.js
   Features: Min/Max Length, Special Character Rules, Capitalization, URL State, User Hint, Dynamic Title
   Fixes: CSP compliance, Logic order for Max Length, Selector specificity
*/

window.addEventListener('load', function() {
    console.log("PwdHash-Enhanced: Loaded.");
    injectInterface();
    attachListeners();
    // Delay load slightly to ensure original scripts have initialized
    setTimeout(loadFromUrl, 500); 
});

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
    var iconCap   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 20l5-16 5 16M16 13H8"></path></svg>`;
    
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
        span.innerHTML = iconHtml + " " + label;
        
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
    parentTable.insertBefore(createCheckRow("chk-reqcap", "Require Uppercase", iconCap), insertBeforeRow);

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
    var btnTd = document.createElement('td');
    btnTd.colSpan = 2;
    var btn = document.createElement('button');
    btn.type = "button";
    btn.innerText = "Copy config link";
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
            if (hashField.value && hashField.value !== "Press Generate") {
                copyGeneratedPassword(hashField.value);
            }
        });
    }

    // Specific listener for Page Title updates (Site Keyword field)
    // We use :not(#ext-hint) to ensure we don't grab the hint field by mistake
    var siteInput = document.querySelector('input[type="text"]:not([readonly]):not(#ext-hint)');
    if (siteInput) {
        var updateTitle = function() {
            if (siteInput.value) {
                document.title = "Site password for " + siteInput.value;
            }
        };
        siteInput.addEventListener('input', updateTitle);
        siteInput.addEventListener('keyup', updateTitle);
        siteInput.addEventListener('change', updateTitle);
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
    regenerateTimer = setTimeout(regenerateHash, 50);
}

function regenerateHash() {
    if (typeof GenerateToTextField === 'function') {
        GenerateToTextField();
    } else if (typeof Generate === 'function') {
        var hashField = document.getElementById('hashedPassword') || document.getElementsByName('hashedPassword')[0];
        if (hashField) {
            hashField.value = Generate();
            hashField.disabled = false;
        }
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
    var minInput = document.getElementById('ext-minLength');
    var maxInput = document.getElementById('ext-maxLength');
    var min = getValidatedNumber(minInput, { minValue: 0 });
    var max = getValidatedNumber(maxInput, { minValue: 0 });

    var result = fullHash;

    // 1. Filter: Ban Symbols
    if (noSym) {
        result = result.replace(/[^a-zA-Z0-9]/g, '');
        if (result.length === 0) result = "Res" + fullHash.length; 
    }

    // 2. Pad: Min Length
    if (!isNaN(min) && min > 0) {
        while (result.length < min) {
            result += result;
        }
    }

    // 3. Truncate: Max Length
    if (!isNaN(max) && max > 0 && result.length > max) {
        result = result.substring(0, max);
    }

    // 4. Enforce Uppercase
    if (reqCap && !/[A-Z]/.test(result)) {
        if (/[a-z]/.test(result)) {
            result = result.replace(/[a-z]/, function(c) { return c.toUpperCase(); });
        } else {
            var caps = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var char = caps.charAt(result.charCodeAt(0) % caps.length);
            if (!isNaN(max) && max > 0 && result.length >= max) {
                result = char + result.substring(1);
            } else {
                result = char + result;
            }
        }
    }

    // 5. Enforce Number & Symbol
    var suffix = "";

    if (reqNum && !/\d/.test(result)) {
        suffix += (result.length % 10).toString();
    }

    if (reqSym && !noSym && !/[^a-zA-Z0-9]/.test(result)) {
        var syms = "!@#$%^&*";
        suffix += syms.charAt(result.charCodeAt(0) % syms.length);
    }

    if (suffix.length > 0) {
        if (!isNaN(max) && max > 0) {
            var cutLen = max - suffix.length;
            if (cutLen < 0) cutLen = 0; 
            result = result.substring(0, cutLen) + suffix;
        } else {
            result += suffix;
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
    notice.classList.add('show');
    if (copyNoticeTimer) clearTimeout(copyNoticeTimer);
    copyNoticeTimer = setTimeout(function() {
        notice.classList.remove('show');
    }, 2400);
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
        if (hashField.value && hashField.value !== "Press Generate") {
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
            document.title = "Site password for " + site; // Update Title on Load
            
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
    setVal('ext-minLength', 'min');
    setVal('ext-maxLength', 'max');
    setVal('ext-hint', 'hint');

    window.history.replaceState({}, '', url);
    navigator.clipboard.writeText(url.toString()).then(function() {
        alert("Configuration Link Copied!");
    });
}
