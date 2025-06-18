// ==UserScript==
// @name         Basic Penetration Testing Script
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  A Tampermonkey userscript for ethical penetration testing on the active site (authorized use only).
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    let uiVisible = false;
    let testResults = [];

    // Create a UI element to display findings
    function createUI() {
        const div = document.createElement('div');
        div.id = 'pentest-ui';
        div.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 400px;
            max-height: 500px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 10px;
            padding: 0;
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            display: none;
        `;

        div.innerHTML = `
            <div style="background: rgba(255,255,255,0.95); border-radius: 10px; padding: 20px; margin: 2px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; color: #333; font-size: 18px;">🔍 Security Test Results</h3>
                    <button id="close-pentest" style="background: #ff4757; color: white; border: none; border-radius: 50%; width: 25px; height: 25px; cursor: pointer; font-size: 14px;">×</button>
                </div>
                <div id="pentest-results" style="max-height: 350px; overflow-y: auto; margin-bottom: 15px;">
                    <p style="color: #666; font-style: italic;">Click "Run Test" to start security analysis...</p>
                </div>
                <div style="text-align: center;">
                    <button id="run-pentest" style="background: #5352ed; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; font-weight: bold;">Run Test</button>
                    <button id="copy-results" style="background: #00d2d3; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">Copy Results</button>
                    <button id="clear-results" style="background: #747d8c; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-left: 10px;">Clear</button>
                </div>
            </div>
        `;

        document.body.appendChild(div);

        // Add event listeners
        document.getElementById('close-pentest').addEventListener('click', hideUI);
        document.getElementById('run-pentest').addEventListener('click', runPenetrationTest);
        document.getElementById('copy-results').addEventListener('click', copyResultsToClipboard);
        document.getElementById('clear-results').addEventListener('click', clearResults);
    }

    // Create floating trigger button
    function createTriggerButton() {
        const button = document.createElement('button');
        button.id = 'pentest-trigger';
        button.innerHTML = '🔍';
        button.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            transition: transform 0.2s ease;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });

        button.addEventListener('click', showUI);
        document.body.appendChild(button);
    }

    function showUI() {
        const ui = document.getElementById('pentest-ui');
        const trigger = document.getElementById('pentest-trigger');
        if (ui && trigger) {
            ui.style.display = 'block';
            trigger.style.display = 'none';
            uiVisible = true;
        }
    }

    function hideUI() {
        const ui = document.getElementById('pentest-ui');
        const trigger = document.getElementById('pentest-trigger');
        if (ui && trigger) {
            ui.style.display = 'none';
            trigger.style.display = 'block';
            uiVisible = false;
        }
    }

    // Log findings to the UI with better formatting
    function logFinding(message, type = 'info') {
        const results = document.getElementById('pentest-results');
        const finding = document.createElement('div');

        let icon, color;
        switch(type) {
            case 'warning':
                icon = '⚠️';
                color = '#ff9f43';
                break;
            case 'danger':
                icon = '🚨';
                color = '#ff4757';
                break;
            case 'success':
                icon = '✅';
                color = '#2ed573';
                break;
            default:
                icon = 'ℹ️';
                color = '#5352ed';
        }

        finding.style.cssText = `
            background: ${color}15;
            border-left: 4px solid ${color};
            padding: 10px;
            margin: 8px 0;
            border-radius: 0 5px 5px 0;
            font-size: 14px;
            line-height: 1.4;
        `;

        finding.innerHTML = `
            <div style="display: flex; align-items: flex-start;">
                <span style="margin-right: 8px; font-size: 16px;">${icon}</span>
                <span style="color: #333;">${message}</span>
            </div>
        `;

        results.appendChild(finding);
        results.scrollTop = results.scrollHeight;

        testResults.push({message, type, timestamp: new Date()});
    }

    function clearResults() {
        const results = document.getElementById('pentest-results');
        results.innerHTML = '<p style="color: #666; font-style: italic;">Results cleared. Click "Run Test" to start a new analysis...</p>';
        testResults = [];
    }

    function copyResultsToClipboard() {
        if (testResults.length === 0) {
            showNotification('No results to copy!', 'warning');
            return;
        }

        let reportText = `Security Test Report\n`;
        reportText += `URL: ${window.location.href}\n`;
        reportText += `Date: ${new Date().toLocaleString()}\n`;
        reportText += `${'='.repeat(50)}\n\n`;

        testResults.forEach((result, index) => {
            const typeLabel = result.type.toUpperCase();
            reportText += `${index + 1}. [${typeLabel}] ${result.message}\n`;
            reportText += `   Time: ${result.timestamp.toLocaleTimeString()}\n\n`;
        });

        reportText += `Total findings: ${testResults.length}\n`;

        // Use the modern clipboard API if available, fallback to older method
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(reportText).then(() => {
                showNotification('Results copied to clipboard!', 'success');
            }).catch(() => {
                fallbackCopyTextToClipboard(reportText);
            });
        } else {
            fallbackCopyTextToClipboard(reportText);
        }
    }

    function fallbackCopyTextToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            showNotification('Results copied to clipboard!', 'success');
        } catch (err) {
            showNotification('Failed to copy results', 'danger');
        }

        document.body.removeChild(textArea);
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        let bgColor;

        switch(type) {
            case 'success':
                bgColor = '#2ed573';
                break;
            case 'warning':
                bgColor = '#ff9f43';
                break;
            case 'danger':
                bgColor = '#ff4757';
                break;
            default:
                bgColor = '#5352ed';
        }

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 12px 20px;
            border-radius: 5px;
            z-index: 10001;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;

        // Add CSS animation
        if (!document.getElementById('notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Check forms for CSRF tokens
    function checkFormsForCSRF() {
        const forms = document.getElementsByTagName('form');
        let formsChecked = 0;

        for (let form of forms) {
            const inputs = form.getElementsByTagName('input');
            let hasCSRF = false;
            for (let input of inputs) {
                if (input.name.toLowerCase().includes('csrf') || input.name.toLowerCase().includes('token')) {
                    hasCSRF = true;
                    break;
                }
            }
            if (!hasCSRF && form.action) {
                logFinding(`Form with action "${form.action}" may be missing CSRF token.`, 'warning');
            }
            formsChecked++;
        }

        if (formsChecked === 0) {
            logFinding('No forms found on this page.', 'info');
        } else {
            logFinding(`Checked ${formsChecked} form(s) for CSRF protection.`, 'info');
        }
    }

    // Check for XSS-vulnerable input fields
    function checkXSSVulnerability() {
        const inputs = document.querySelectorAll('input[type="text"], input[type="search"], textarea');
        let vulnerableInputs = 0;

        inputs.forEach(input => {
            const testPayload = '<script>alert("test")</script>';
            const originalValue = input.value;
            input.value = testPayload;

            if (input.value === testPayload) {
                logFinding(`Input field "${input.name || input.id || 'unnamed'}" may be vulnerable to XSS (accepts script tags).`, 'danger');
                vulnerableInputs++;
            }

            input.value = originalValue; // Restore original value
        });

        if (inputs.length === 0) {
            logFinding('No text input fields found on this page.', 'info');
        } else if (vulnerableInputs === 0) {
            logFinding(`Checked ${inputs.length} input field(s) - no obvious XSS vulnerabilities detected.`, 'success');
        } else {
            logFinding(`Found ${vulnerableInputs} potentially vulnerable input field(s).`, 'warning');
        }
    }

    // Check for sensitive data in client-side storage
    function checkClientSideStorage() {
        let criticalFindings = 0;
        let warningFindings = 0;

        // Check localStorage
        try {
            if (localStorage.length > 0) {
                logFinding(`Found ${localStorage.length} item(s) in localStorage - analyzing...`, 'info');

                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    const value = localStorage.getItem(key);

                    if (analyzeSensitiveData(key, value)) {
                        criticalFindings++;
                    }
                }
            } else {
                logFinding('No data found in localStorage.', 'success');
            }
        } catch (e) {
            logFinding('Unable to access localStorage.', 'warning');
        }

        // Check sessionStorage
        try {
            if (sessionStorage.length > 0) {
                logFinding(`Found ${sessionStorage.length} item(s) in sessionStorage - analyzing...`, 'info');

                for (let i = 0; i < sessionStorage.length; i++) {
                    const key = sessionStorage.key(i);
                    const value = sessionStorage.getItem(key);

                    if (analyzeSensitiveData(key, value)) {
                        criticalFindings++;
                    }
                }
            } else {
                logFinding('No data found in sessionStorage.', 'success');
            }
        } catch (e) {
            logFinding('Unable to access sessionStorage.', 'warning');
        }

        // Check for cookies with sensitive data
        if (document.cookie) {
            const cookies = document.cookie.split(';');
            logFinding(`Found ${cookies.length} cookie(s) - analyzing...`, 'info');

            cookies.forEach(cookie => {
                const [name, value] = cookie.trim().split('=');
                if (analyzeSensitiveData(name, value || '')) {
                    criticalFindings++;
                }
            });
        } else {
            logFinding('No cookies found.', 'success');
        }

        // Summary
        if (criticalFindings > 0) {
            logFinding(`🚨 CRITICAL: Found ${criticalFindings} instances of sensitive data in client-side storage!`, 'danger');
            logFinding('Recommendation: Sensitive authentication tokens should be stored securely server-side or in httpOnly cookies.', 'danger');
        }
    }

    // Analyze data for sensitive content
    function analyzeSensitiveData(key, value) {
        const keyLower = key.toLowerCase();
        const valueLower = value.toLowerCase();
        let isSensitive = false;

        // Whitelist of known legitimate tracking/analytics services to avoid false positives
        const legitimateServices = [
            'hubspot', '__hstc', '__hssc', '__hssrc', 'hubspotutk',
            '_ga', '_gid', '_gcl_au', '_fbp', '_ce.', 'amp_',
            'intercom', 'optanon', 'ajs_', 'cb_', 'cebs', 'cebsp_',
            'awsalb', 'awsalbcors', 'utm_', 'hs_', 'rws_'
        ];

        // Check if this is a known legitimate service
        const isLegitimateService = legitimateServices.some(service =>
            keyLower.includes(service) || keyLower.startsWith(service)
        );

        if (isLegitimateService) {
            return false; // Skip analysis for known legitimate services
        }

        // Check for authentication tokens (but exclude tracking tokens)
        if ((keyLower.includes('token') || keyLower.includes('auth') || keyLower.includes('msal')) && !isLegitimateService) {
            logFinding(`🔴 CRITICAL: Authentication token found in storage - Key: "${key}"`, 'danger');
            isSensitive = true;
        }

        // Check for JWT tokens - but be more specific (must start with eyJ and have proper structure)
        if (value.startsWith('eyJ') && value.split('.').length === 3) {
            // Additional check - decode header to verify it's actually a JWT
            try {
                const header = JSON.parse(atob(value.split('.')[0]));
                if (header.typ === 'JWT' || header.alg) {
                    logFinding(`🔴 CRITICAL: JWT token detected in storage - Key: "${key}"`, 'danger');
                    isSensitive = true;
                }
            } catch (e) {
                // If we can't decode it, it's probably not a real JWT
            }
        }

        // Check for OAuth tokens (but be more specific)
        if (valueLower.includes('accesstoken') || valueLower.includes('refreshtoken') || valueLower.includes('idtoken')) {
            // Check if it's in a structure that suggests real OAuth tokens
            if (value.includes('"accessToken"') || value.includes('"refreshToken"') || value.includes('"idToken"')) {
                logFinding(`🔴 CRITICAL: OAuth token detected - Key: "${key}"`, 'danger');
                isSensitive = true;
            }
        }

        // Check for email addresses (but only if not in analytics context)
        const emailMatch = value.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch && !isLegitimateService) {
            logFinding(`⚠️ WARNING: Email address found in storage - Key: "${key}" - Email: "${emailMatch[0]}"`, 'warning');
        }

        // Check for other sensitive patterns (but exclude known tracking services)
        const sensitivePatterns = [
            { pattern: /password/i, name: 'password' },
            { pattern: /secret/i, name: 'secret' },
            { pattern: /api[_-]?key/i, name: 'API key' },
            { pattern: /private[_-]?key/i, name: 'private key' },
            { pattern: /client[_-]?secret/i, name: 'client secret' },
            { pattern: /bearer/i, name: 'bearer token' }
        ];

        sensitivePatterns.forEach(({ pattern, name }) => {
            if ((pattern.test(keyLower) || pattern.test(valueLower)) && !isLegitimateService) {
                logFinding(`🔴 CRITICAL: Possible ${name} found in storage - Key: "${key}"`, 'danger');
                isSensitive = true;
            }
        });

        // Check for long encoded strings (potential tokens) - but be more selective
        if (value.length > 200 && /^[A-Za-z0-9+/=_-]+$/.test(value) && !isLegitimateService) {
            // Additional checks to avoid false positives
            if (!value.includes('%') && !keyLower.includes('consent') && !keyLower.includes('config')) {
                logFinding(`⚠️ WARNING: Long encoded string detected (potential token) - Key: "${key}"`, 'warning');
            }
        }

        return isSensitive;
    }

    // Intercept and log HTTP requests
    function interceptRequests() {
        const originalFetch = window.fetch;
        let requestCount = 0;

        window.fetch = function(url, options) {
            requestCount++;
            logFinding(`HTTP Request #${requestCount}: ${url} (Method: ${options?.method || 'GET'})`, 'info');
            return originalFetch.apply(this, arguments);
        };

        // Use GM_xmlhttpRequest to test external requests
        GM_xmlhttpRequest({
            method: 'GET',
            url: window.location.href,
            onload: function(response) {
                if (response.status === 200) {
                    logFinding(`Test request to current page succeeded (Status: ${response.status}).`, 'success');

                    // Check for security headers
                    const headers = response.responseHeaders.toLowerCase();
                    if (!headers.includes('x-frame-options')) {
                        logFinding('Missing X-Frame-Options header - page may be vulnerable to clickjacking.', 'warning');
                    }
                    if (!headers.includes('x-content-type-options')) {
                        logFinding('Missing X-Content-Type-Options header.', 'warning');
                    }
                } else {
                    logFinding(`Test request failed with status ${response.status}.`, 'warning');
                }
            },
            onerror: function() {
                logFinding(`Test request to ${window.location.href} failed.`, 'danger');
            }
        });
    }

    // Main penetration test function
    function runPenetrationTest() {
        clearResults();
        logFinding(`Starting security analysis on ${window.location.href}`, 'info');

        setTimeout(() => {
            checkFormsForCSRF();
        }, 100);

        setTimeout(() => {
            checkXSSVulnerability();
        }, 200);

        setTimeout(() => {
            checkClientSideStorage();
        }, 300);

        setTimeout(() => {
            interceptRequests();
        }, 400);

        setTimeout(() => {
            logFinding('Security analysis completed.', 'success');
        }, 600);
    }

    // Initialize the script
    window.addEventListener('load', function() {
        createUI();
        createTriggerButton();
    });
})();