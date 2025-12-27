/* site-requirements.js
 * Database of known password requirements for popular sites
 * Used for auto-filling the PwdHash form
 */

var SITE_REQUIREMENTS = {
    // Financial
    "chase": { max: 32, noSym: true, reqCap: true, reqNum: true, hint: "32 max, no symbols" },
    "bankofamerica": { min: 8, max: 20, reqCap: true, reqNum: true, hint: "8-20 chars" },
    "bofa": { min: 8, max: 20, reqCap: true, reqNum: true, hint: "8-20 chars" },
    "wellsfargo": { min: 8, max: 32, reqCap: true, reqNum: true, reqSym: true, hint: "8-32, symbol required" },
    "paypal": { min: 8, max: 20, reqCap: true, reqNum: true, reqSym: true, hint: "8-20, symbol required" },
    "venmo": { min: 8, max: 20, reqCap: true, reqNum: true, reqSym: true, hint: "8-20, symbol required" },
    "fidelity": { min: 6, max: 20, noSym: true, hint: "6-20, no symbols" },
    "schwab": { min: 8, max: 20, reqCap: true, reqNum: true, hint: "8-20 chars" },
    "vanguard": { min: 8, max: 20, reqCap: true, reqNum: true, hint: "8-20 chars" },
    "capitalone": { min: 8, max: 50, reqCap: true, reqNum: true, reqSym: true, hint: "8-50, symbol required" },
    "americanexpress": { min: 8, max: 20, reqCap: true, reqNum: true, hint: "8-20 chars" },
    "amex": { min: 8, max: 20, reqCap: true, reqNum: true, hint: "8-20 chars" },
    "discover": { min: 8, max: 32, reqCap: true, reqNum: true, reqSym: true, hint: "8-32, symbol required" },
    "usbank": { min: 8, max: 24, reqCap: true, reqNum: true, hint: "8-24 chars" },
    "citibank": { min: 8, max: 50, reqCap: true, reqNum: true, hint: "8-50 chars" },
    "citi": { min: 8, max: 50, reqCap: true, reqNum: true, hint: "8-50 chars" },

    // Tech / Big platforms
    "apple": { min: 8, reqCap: true, reqNum: true, reqSym: false, hint: "8+ chars" },
    "icloud": { min: 8, reqCap: true, reqNum: true, reqSym: false, hint: "8+ chars" },
    "google": { min: 8, reqCap: false, reqNum: false, hint: "8+ chars" },
    "gmail": { min: 8, reqCap: false, reqNum: false, hint: "8+ chars" },
    "youtube": { min: 8, reqCap: false, reqNum: false, hint: "8+ chars" },
    "microsoft": { min: 8, reqCap: true, reqLower: true, reqNum: true, reqSym: true, hint: "8+, mixed case, num, symbol" },
    "outlook": { min: 8, reqCap: true, reqLower: true, reqNum: true, reqSym: true, hint: "8+, mixed case, num, symbol" },
    "live": { min: 8, reqCap: true, reqLower: true, reqNum: true, reqSym: true, hint: "8+, mixed case, num, symbol" },
    "amazon": { min: 8, max: 128, reqCap: true, reqNum: true, hint: "8-128 chars" },
    "aws": { min: 8, max: 128, reqCap: true, reqNum: true, reqSym: true, hint: "8-128, symbol required" },

    // Social
    "facebook": { min: 6, hint: "6+ chars" },
    "meta": { min: 6, hint: "6+ chars" },
    "instagram": { min: 6, hint: "6+ chars" },
    "twitter": { min: 8, hint: "8+ chars" },
    "x": { min: 8, hint: "8+ chars" },
    "linkedin": { min: 8, reqCap: true, reqNum: true, reqSym: true, hint: "8+, mixed requirements" },
    "reddit": { min: 8, hint: "8+ chars" },
    "tiktok": { min: 8, max: 20, reqCap: true, reqNum: true, reqSym: true, hint: "8-20, symbol required" },
    "pinterest": { min: 6, hint: "6+ chars" },
    "snapchat": { min: 8, hint: "8+ chars" },
    "discord": { min: 8, max: 72, hint: "8-72 chars" },

    // Streaming / Entertainment
    "netflix": { min: 4, max: 60, hint: "4-60 chars" },
    "hulu": { min: 8, hint: "8+ chars" },
    "disneyplus": { min: 8, reqCap: true, reqNum: true, reqSym: true, hint: "8+, symbol required" },
    "disney": { min: 8, reqCap: true, reqNum: true, reqSym: true, hint: "8+, symbol required" },
    "hbomax": { min: 8, max: 16, reqCap: true, reqNum: true, hint: "8-16 chars" },
    "max": { min: 8, max: 16, reqCap: true, reqNum: true, hint: "8-16 chars" },
    "spotify": { min: 8, hint: "8+ chars" },
    "twitch": { min: 8, max: 72, hint: "8-72 chars" },
    "steam": { min: 8, reqCap: true, reqNum: true, hint: "8+, upper and number" },
    "playstation": { min: 8, max: 30, reqCap: true, reqNum: true, hint: "8-30 chars" },
    "psn": { min: 8, max: 30, reqCap: true, reqNum: true, hint: "8-30 chars" },
    "xbox": { min: 8, reqCap: true, reqNum: true, reqSym: true, hint: "8+, symbol required" },
    "epicgames": { min: 7, reqCap: true, reqNum: true, reqSym: true, hint: "7+, symbol required" },

    // Shopping
    "ebay": { min: 8, reqCap: true, reqNum: true, reqSym: true, hint: "8+, symbol required" },
    "etsy": { min: 8, hint: "8+ chars" },
    "walmart": { min: 8, max: 100, reqCap: true, reqNum: true, hint: "8-100 chars" },
    "target": { min: 8, reqCap: true, reqNum: true, hint: "8+ chars" },
    "costco": { min: 8, max: 20, reqCap: true, reqNum: true, hint: "8-20 chars" },
    "bestbuy": { min: 8, reqCap: true, reqNum: true, hint: "8+ chars" },
    "homedepot": { min: 8, max: 12, reqCap: true, reqNum: true, hint: "8-12 chars" },
    "lowes": { min: 8, max: 20, reqCap: true, reqNum: true, hint: "8-20 chars" },

    // Travel
    "airbnb": { min: 8, hint: "8+ chars" },
    "expedia": { min: 8, reqCap: true, reqNum: true, reqSym: true, hint: "8+, symbol required" },
    "booking": { min: 8, hint: "8+ chars" },
    "delta": { min: 8, max: 20, reqCap: true, reqNum: true, hint: "8-20 chars" },
    "united": { min: 8, max: 32, reqCap: true, reqNum: true, reqSym: true, hint: "8-32, symbol required" },
    "southwest": { min: 8, max: 16, reqCap: true, reqNum: true, hint: "8-16 chars" },
    "american": { min: 8, max: 16, reqCap: true, reqNum: true, hint: "8-16 chars (airline)" },
    "marriott": { min: 8, max: 20, reqCap: true, reqNum: true, reqSym: true, hint: "8-20, symbol required" },
    "hilton": { min: 8, max: 32, reqCap: true, reqNum: true, hint: "8-32 chars" },

    // Productivity / Work
    "dropbox": { min: 8, hint: "8+ chars" },
    "slack": { min: 8, hint: "8+ chars" },
    "zoom": { min: 8, max: 99, reqCap: true, reqLower: true, reqNum: true, hint: "8-99, upper+lower+num" },
    "github": { min: 8, reqNum: true, hint: "8+, include number" },
    "gitlab": { min: 8, hint: "8+ chars" },
    "bitbucket": { min: 8, hint: "8+ chars" },
    "atlassian": { min: 8, hint: "8+ chars" },
    "jira": { min: 8, hint: "8+ chars" },
    "notion": { min: 8, hint: "8+ chars" },
    "trello": { min: 8, hint: "8+ chars" },
    "asana": { min: 8, hint: "8+ chars" },
    "evernote": { min: 8, hint: "8+ chars" },
    "todoist": { min: 8, hint: "8+ chars" },

    // Utilities / Services  
    "comcast": { min: 8, max: 16, reqCap: true, reqNum: true, hint: "8-16 chars" },
    "xfinity": { min: 8, max: 16, reqCap: true, reqNum: true, hint: "8-16 chars" },
    "att": { min: 8, max: 24, reqCap: true, reqNum: true, hint: "8-24 chars" },
    "verizon": { min: 8, max: 20, reqCap: true, reqNum: true, hint: "8-20 chars" },
    "tmobile": { min: 8, max: 32, reqCap: true, reqNum: true, hint: "8-32 chars" },

    // Food / Delivery
    "doordash": { min: 8, hint: "8+ chars" },
    "ubereats": { min: 8, hint: "8+ chars" },
    "uber": { min: 8, hint: "8+ chars" },
    "grubhub": { min: 8, reqCap: true, reqNum: true, hint: "8+, upper and number" },
    "instacart": { min: 8, hint: "8+ chars" },
    "starbucks": { min: 8, max: 25, reqCap: true, reqNum: true, hint: "8-25 chars" },
    "chipotle": { min: 8, max: 25, reqCap: true, reqNum: true, reqSym: true, hint: "8-25, symbol required" },

    // News / Media
    "nytimes": { min: 8, hint: "8+ chars" },
    "washingtonpost": { min: 8, hint: "8+ chars" },
    "wsj": { min: 8, reqCap: true, reqNum: true, hint: "8+, upper and number" },
    "medium": { min: 8, hint: "8+ chars" },
    "substack": { min: 8, hint: "8+ chars" },

    // Education
    "coursera": { min: 8, reqCap: true, reqNum: true, reqSym: true, hint: "8+, symbol required" },
    "udemy": { min: 6, hint: "6+ chars" },
    "khanacademy": { min: 8, hint: "8+ chars" },
    "duolingo": { min: 8, hint: "8+ chars" }
};

/* Aliases for common domain variations */
var SITE_ALIASES = {
    "bankofamerica": ["boa", "bofa"],
    "capitalone": ["capital-one"],
    "americanexpress": ["amex"],
    "disneyplus": ["disney+"],
    "hbomax": ["max"],
    "playstation": ["psn", "ps"],
    "comcast": ["xfinity"],
    "nytimes": ["newyorktimes", "nyt"]
};

// Build reverse lookup from aliases
(function() {
    for (var canonical in SITE_ALIASES) {
        if (SITE_ALIASES.hasOwnProperty(canonical)) {
            var aliases = SITE_ALIASES[canonical];
            for (var i = 0; i < aliases.length; i++) {
                if (!SITE_REQUIREMENTS[aliases[i]] && SITE_REQUIREMENTS[canonical]) {
                    SITE_REQUIREMENTS[aliases[i]] = SITE_REQUIREMENTS[canonical];
                }
            }
        }
    }
})();
