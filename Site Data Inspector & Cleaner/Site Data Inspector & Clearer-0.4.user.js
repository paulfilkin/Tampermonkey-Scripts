// ==UserScript==
// @name         Site Data Inspector & Clearer
// @namespace    http://tampermonkey.net/
// @version      0.4
// @description  Adds a button to inspect and clear cookies, localStorage, and sessionStorage for the current site, visible only if data exists.
// @author       multifarious
// @match        *://*/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Inject CSS for the overlay and button visibility
    GM_addStyle(`
        #site-data-inspector-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            font-family: sans-serif;
            font-size: 14px;
        }
        #site-data-inspector-content {
            background-color: #f0f0f0;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
            max-width: 80%;
            max-height: 80%;
            overflow: auto;
            color: #333;
            position: relative;
        }
        #site-data-inspector-content h3 {
            margin-top: 0;
            color: #0056b3;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }
        #site-data-inspector-content pre {
            background-color: #e9e9e9;
            padding: 10px;
            border-radius: 4px;
            white-space: pre-wrap;
            word-break: break-all;
            max-height: 150px; /* Limit height for preformatted content */
            overflow-y: auto;
        }
        #site-data-inspector-content .close-button {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            font-size: 16px;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        #site-data-inspector-content .section {
            margin-bottom: 15px;
        }
        #site-data-inspector-content .section-content {
            border: 1px solid #ddd;
            padding: 5px;
            background-color: #fff;
        }
        #inspect-site-data-button {
            display: none; /* Hidden by default */
        }
        #clear-data-in-overlay-button {
            margin-top: 20px;
            padding: 10px 20px;
            background-color: #f44336; /* Red color for clear */
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            display: block; /* Make it a block element for full width or centered */
            margin-left: auto;
            margin-right: auto;
            text-align: center;
        }
        #clear-data-in-overlay-button:hover {
            opacity: 0.9;
        }
    `);

    // Function to clear accessible client-side storage
    function clearCurrentSiteData(reloadPage = true) {
        console.log("Attempting to clear data for:", location.hostname);

        // 1. Clear Cookies
        var cookies = document.cookie.split("; ");
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i];
            var eqPos = cookie.indexOf("=");
            var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;

            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + location.hostname;

            var parts = location.hostname.split('.');
            while(parts.length > 1) {
                var subdomain = "." + parts.join('.');
                document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + subdomain;
                parts.shift();
            }
        }

        // 2. Clear Local Storage
        try {
            localStorage.clear();
            console.log("localStorage cleared.");
        } catch (e) {
            console.error("Error clearing localStorage:", e);
        }

        // 3. Clear Session Storage
        try {
            sessionStorage.clear();
            console.log("sessionStorage cleared.");
        } catch (e) {
            console.error("Error clearing sessionStorage:", e);
        }

        // Note: IndexedDB and Cache Storage cannot be reliably cleared via simple JavaScript/bookmarklet.
        // You would need to use browser's built-in "Clear Site Data" for those.

        alert("Accessible client-side data (cookies, localStorage, sessionStorage) for " + location.hostname + " cleared!");
        if (reloadPage) {
            location.reload(); // Reload the page to see the effect
        }
    }

    function showInspectorOverlay(data) {
        let overlay = document.getElementById('site-data-inspector-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'site-data-inspector-overlay';
            document.body.appendChild(overlay);
        }

        let content = document.getElementById('site-data-inspector-content');
        if (!content) {
            content = document.createElement('div');
            content.id = 'site-data-inspector-content';
            overlay.appendChild(content);

            const closeButton = document.createElement('button');
            closeButton.className = 'close-button';
            closeButton.textContent = 'X';
            closeButton.onclick = () => overlay.remove();
            content.appendChild(closeButton);
        }

        content.innerHTML = `
            <button class="close-button">X</button>
            <h2>Site Data for ${location.hostname}</h2>

            <div class="section">
                <h3>Cookies</h3>
                <div class="section-content"><pre>${data.cookies}</pre></div>
            </div>

            <div class="section">
                <h3>Local Storage</h3>
                <div class="section-content"><pre>${data.localStorage}</pre></div>
            </div>

            <div class="section">
                <h3>Session Storage</h3>
                <div class="section-content"><pre>${data.sessionStorage}</pre></div>
            </div>

            <div class="section">
                <h3>IndexedDB Databases (Names only)</h3>
                <p style="font-size: 12px; color: #666;">(Full content requires specific database/store knowledge)</p>
                <div class="section-content"><pre>${data.indexedDB}</pre></div>
            </div>

            <div class="section">
                <h3>Cache Storage Names</h3>
                <p style="font-size: 12px; color: #666;">(Full content inspection not feasible via generic script)</p>
                <div class="section-content"><pre>${data.cacheStorage}</pre></div>
            </div>

            <button id="clear-data-in-overlay-button">Clear All Displayed Site Data & Reload</button>
        `;

        // Re-attach close button listener as innerHTML overwrites it
        content.querySelector('.close-button').onclick = () => overlay.remove();

        // Attach event listener for the new clear button inside the overlay
        const clearButtonInOverlay = document.getElementById('clear-data-in-overlay-button');
        if (clearButtonInOverlay) {
            clearButtonInOverlay.addEventListener('click', () => {
                clearCurrentSiteData(true); // Pass true to reload page
                overlay.remove(); // Close overlay after clearing
            });
        }

        overlay.style.display = 'flex';
    }

    async function inspectAndDisplaySiteData() {
        const data = {};

        // 1. Get Cookies
        data.cookies = document.cookie.split('; ').join('\n');
        if (!data.cookies) data.cookies = 'No cookies found.';

        // 2. Get Local Storage
        try {
            const ls = {};
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                ls[key] = localStorage.getItem(key);
            }
            data.localStorage = JSON.stringify(ls, null, 2);
            if (Object.keys(ls).length === 0) data.localStorage = 'No localStorage data.';
        } catch (e) {
            data.localStorage = 'Error accessing localStorage: ' + e.message;
        }

        // 3. Get Session Storage
        try {
            const ss = {};
            for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                ss[key] = sessionStorage.getItem(key);
            }
            data.sessionStorage = JSON.stringify(ss, null, 2);
            if (Object.keys(ss).length === 0) data.sessionStorage = 'No sessionStorage data.';
        } catch (e) {
            data.sessionStorage = 'Error accessing sessionStorage: ' + e.message;
        }

        // 4. Get IndexedDB database names
        try {
            const dbNames = await indexedDB.databases();
            data.indexedDB = dbNames.map(db => db.name).join('\n');
            if (dbNames.length === 0) data.indexedDB = 'No IndexedDB databases found.';
        } catch (e) {
            data.indexedDB = 'Error accessing IndexedDB names: ' + e.message;
        }

        // 5. Get Cache Storage names
        try {
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                data.cacheStorage = cacheNames.join('\n');
                if (cacheNames.length === 0) data.cacheStorage = 'No Cache Storage entries found.';
            } else {
                data.cacheStorage = 'Cache Storage API not available.';
            }
        } catch (e) {
            data.cacheStorage = 'Error accessing Cache Storage names: ' + e.message;
        }

        showInspectorOverlay(data);
    }

    // Function to check if any relevant data exists for button visibility
    function hasAnyClientSideData() {
        // Check Cookies
        if (document.cookie) {
            return true;
        }

        // Check Local Storage
        try {
            if (localStorage.length > 0) {
                return true;
            }
        } catch (e) { /* silent error */ }

        // Check Session Storage
        try {
            if (sessionStorage.length > 0) {
                return true;
            }
        } catch (e) { /* silent error */ }

        return false;
    }

    // Create the main inspect button
    const inspectButton = document.createElement('button');
    inspectButton.id = 'inspect-site-data-button'; // Assign ID for CSS targeting
    inspectButton.textContent = 'Inspect Site Data';
    inspectButton.style.position = 'fixed';
    inspectButton.style.bottom = '25px';
    inspectButton.style.left = '25px';
    inspectButton.style.zIndex = '99999';
    inspectButton.style.padding = '8px 15px';
    inspectButton.style.backgroundColor = '#007bff';
    inspectButton.style.color = 'white';
    inspectButton.style.border = 'none';
    inspectButton.style.borderRadius = '5px';
    inspectButton.style.cursor = 'pointer';
    inspectButton.style.fontSize = '14px';
    inspectButton.title = 'Click to inspect client-side data for this site.';

    inspectButton.addEventListener('click', inspectAndDisplaySiteData);

    // Append the button to the body
    document.body.appendChild(inspectButton);

    // --- Conditional Visibility Logic ---
    // Check after a short delay to allow page's own scripts to set initial cookies/storage
    setTimeout(() => {
        if (hasAnyClientSideData()) {
            inspectButton.style.display = 'block'; // Make button visible
        }
    }, 500); // Adjust delay if needed

})();