# Site Data Inspector & Clearer

A lightweight [Tampermonkey](https://www.tampermonkey.net/) userscript that provides a simple interface to **inspect and clear client-side data** stored by the current website.

> Easily view cookies, localStorage, sessionStorage, IndexedDB names, and Cache Storage keys — and clear them with a single click.

---

## Purpose & Usage

This tool is ideal for:

- Frontend developers verifying data persistence and privacy
- Security-conscious users wishing to inspect what a site stores
- Troubleshooting persistent login/session or caching issues

**Note:** This script does **not** touch server-side data or delete IndexedDB and cache contents (only lists them by name).

---

## Features

- Inspects:
  - Cookies
  - localStorage
  - sessionStorage
  - IndexedDB database names
  - Cache Storage keys
- Clear all accessible client-side data in one go
- Reloads page after clearing for immediate effect
- UI only appears if any data exists
- Modern overlay UI with themed formatting and mobile-friendly layout

---

## Installation

1. Install the [Tampermonkey browser extension](https://www.tampermonkey.net/).
2. Add this script manually:
   - Click the Tampermonkey icon → *Create a new script*.
   - Paste the code from `Site Data Inspector & Clearer-0.4.user.js`.
   - Save and enable the script.
3. Visit any website to use.

---

## How to Use

1. A blue **"Inspect Site Data"** button appears at the bottom-left **only if** cookies, localStorage, or sessionStorage data is detected.
2. Click it to open an overlay displaying all stored data for the site.
3. Click **"Clear All Displayed Site Data & Reload"** to remove everything (cookies, localStorage, sessionStorage) and reload the page.

---

## Data Handling Notes

- IndexedDB and Cache Storage cannot be deleted generically from JavaScript due to security restrictions — this script only lists their names.
- No data is sent externally — everything is executed client-side within the browser.
- Intended for **personal or authorised use only**.

---

## Example Output

```plaintext
Site Data for example.com

Cookies:
session_id=abc123; theme=dark;

Local Storage:
{
  "user_id": "42",
  "authToken": "abcdefg123456"
}

Session Storage:
{
  "tempSearch": "laptops"
}

IndexedDB Databases:
- user-store
- app-cache

Cache Storage Names:
- my-site-cache
- font-cache
