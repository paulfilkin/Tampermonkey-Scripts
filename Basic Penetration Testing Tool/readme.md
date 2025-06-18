# 🔍 Basic Penetration Testing Script (v1.2)

A Tampermonkey userscript for performing lightweight, client-side security assessments on web pages. Useful if you are developing a website and want to carry out some basic security testing for any misconfigurations in real-time.

---

## Features

- Checks for missing CSRF tokens in forms
- Detects possible XSS vulnerabilities in text input fields
- Analyses localStorage, sessionStorage, and cookies for:
  - Auth tokens (e.g. JWT, OAuth)
  - Sensitive keys (e.g. passwords, API keys, secrets)
  - Email addresses
- Warns about suspicious long encoded strings in storage
- Tests for critical security headers (e.g. `X-Frame-Options`, `X-Content-Type-Options`)
- Logs all client-side HTTP requests made via `fetch()`
- Stylish floating UI for launching, viewing, copying, and clearing results
- Clipboard export of findings with a detailed summary

---

## Installation

1. Install [Tampermonkey](https://www.tampermonkey.net/) browser extension.
2. Add the script manually by copying from [`Basic Penetration Testing Script-1.2.user.js`](./Basic%20Penetration%20Testing%20Script-1.2.user.js).
3. Save and ensure the script is enabled in Tampermonkey.
4. Visit any authorised website and click the floating 🔍 button to start testing.

---

## UI Overview

- 🔍 **Trigger Button**: Bottom-right floating button to show the testing panel.
- **Run Test**: Starts the full scan process.
- **Copy Results**: Exports a formatted log of the test findings.
- **Clear**: Resets the results view.
- ❌ **Close**: Hides the panel and returns to the trigger button.

---

## Example Findings

```plaintext
[WARNING] Form with action "https://example.com/login" may be missing CSRF token.
[DANGER] JWT token detected in storage - Key: "auth_token"
[INFO] HTTP Request #1: https://example.com/api/data (Method: GET)
[WARNING] Missing X-Frame-Options header - page may be vulnerable to clickjacking.

```
