/* 
   pwdhash-enhanced.js
   Features: Min/Max Length, Special Character Rules, Capitalization, URL State, User Hint
   Fixes: CSP compliance, Logic order for Max Length
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
    var refRow = passRow.nextSibling;

    // SVG Icons
    var iconNoSym = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`;
    var iconCap   = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 20l5-16 5 16M16 13H8"></path></svg>`;
    
    // Helper to create checkbox row (CSP Safe)
    function createCheckRow(id, label, iconHtml) {
        var tr = document.createElement('tr');
        
        var tdLabel = document.createElement('td');
        tdLabel.className = "label";
        tdLabel.style.verticalAlign = "middle";
        
        var span = document.createElement('span');
        span.style.display = "inline-flex";
        span.style.alignItems = "center";
        span.style.gap = "4px";
        span.innerHTML = iconHtml + " " + label;
        
        tdLabel.appendChild(span);
        
        var tdInput = document.createElement('td');
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

    // Helper to create number input row
    function createNumRow(id, label) {
        var tr = document.createElement('tr');
        var tdLabel = document.createElement('td');
        tdLabel.className = "label";
        
        var b = document.createElement('strong');
        b.innerText = label;
        tdLabel.appendChild(b);
        
        var tdInput = document.createElement('td');
        var input = document.createElement('input');
        input.type = "number";
        input.id = id;
        input.placeholder = "Default";
        input.style.width = "80px";
        
        input.addEventListener('input', applyConstraints);
        input.addEventListener('change', applyConstraints);

        tdInput.appendChild(input);
        tr.appendChild(tdLabel);
        tr.appendChild(tdInput);
        return tr;
    }

    // Helper to create text input row (For Hints)
    function createTextRow(id, label) {
        var tr = document.createElement('tr');
        var tdLabel = document.createElement('td');
        tdLabel.className = "label";
        
        var b = document.createElement('strong');
        b.innerText = label;
        tdLabel.appendChild(b);
        
        var tdInput = document.createElement('td');
        var input = document.createElement('input');
        input.type = "text";
        input.id = id;
        input.placeholder = "Optional";
        input.style.width = "140px"; // Slightly wider for text
        // Note: Hints do not trigger applyConstraints as they don't change the hash

        tdInput.appendChild(input);
        tr.appendChild(tdLabel);
        tr.appendChild(tdInput);
        return tr;
    }

    // Insert Checkboxes
    parentTable.insertBefore(createCheckRow("chk-nosym", "Ban Symbols", iconNoSym), refRow);
    parentTable.insertBefore(createCheckRow("chk-reqnum", "Require Number", "<b>#</b>"), refRow);
    parentTable.insertBefore(createCheckRow("chk-reqsym", "Require Symbol", "<b>@</b>"), refRow);
    parentTable.insertBefore(createCheckRow("chk-reqcap", "Require Uppercase", iconCap), refRow);

    // Insert Min/Max
    parentTable.insertBefore(createNumRow("ext-minLength", "Min Length:"), refRow);
    parentTable.insertBefore(createNumRow("ext-maxLength", "Max Length:"), refRow);

    // Insert Hint Field
    parentTable.insertBefore(createTextRow("ext-hint", "Hint:"), refRow);

    // Insert Copy Button
    var btnRow = document.createElement('tr');
    var emptyTd = document.createElement('td');
    var btnTd = document.createElement('td');
    var btn = document.createElement('button');
    btn.type = "button";
    btn.innerText = "Copy Link for this Config";
    btn.style.marginTop = "8px";
    btn.style.cursor = "pointer";
    btn.onclick = copySafeUrl;

    btnTd.appendChild(btn);
    btnRow.appendChild(emptyTd);
    btnRow.appendChild(btnTd);
    parentTable.insertBefore(btnRow, refRow);
}

// --- 2. Listeners ---
function attachListeners() {
    var inputs = document.querySelectorAll('input[type="text"], input[type="password"]');
    inputs.forEach(function(el) {
        // Skip the hint field for hash generation triggers
        if (el.id === 'ext-hint') return;

        el.addEventListener('keyup', function() { setTimeout(processHash, 50); });
        el.addEventListener('change', function() { setTimeout(processHash, 50); });
    });

    var genBtns = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
    genBtns.forEach(function(btn) {
        btn.addEventListener('click', function() { setTimeout(processHash, 50); });
    });
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

function applyConstraints() {
    var hashField = document.getElementById('hashedPassword') || document.getElementsByName('hashedPassword')[0];
    if (!hashField) return;

    var fullHash = hashField.getAttribute('data-full-hash');
    if (!fullHash) return;

    // Get Settings
    var noSym = document.getElementById('chk-nosym').checked;
    var reqNum = document.getElementById('chk-reqnum').checked;
    var reqSym = document.getElementById('chk-reqsym').checked;
    var reqCap = document.getElementById('chk-reqcap').checked;
    var min = parseInt(document.getElementById('ext-minLength').value);
    var max = parseInt(document.getElementById('ext-maxLength').value);

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

    // 3. Truncate: Max Length (Strictly before enforcement)
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

    // 5. Enforce Number & Symbol (Append or Overwrite end)
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

    // Set Hint (New)
    if (params.get('hint')) document.getElementById('ext-hint').value = params.get('hint');

    // Set Site & Trigger
    var site = params.get('site') || params.get('keyword');
    if (site) {
        var siteInput = document.querySelector('input[type="text"]:not([readonly])');
        if (siteInput) {
            siteInput.value = site;
            if (typeof Generate === 'function') Generate();
            else if (typeof generate === 'function') generate();
            setTimeout(processHash, 100);
        }
    }
}

function copySafeUrl() {
    var siteInput = document.querySelector('input[type="text"]:not([readonly])');
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
    setVal('ext-hint', 'hint'); // Save Hint

    window.history.replaceState({}, '', url);
    navigator.clipboard.writeText(url.toString()).then(function() {
        alert("Configuration Link Copied!");
    });
}