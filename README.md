# Tampermonkey-Scripts

A set of custom userscripts I have generated with the help of various AI tools designed for use with [Tampermonkey](https://www.tampermonkey.net/), the popular userscript manager extension for Chromium-based and Firefox browsers, developed by Jan Biniok.

These scripts can be used to enhance, clean up, inspect, or test the behaviour of web pages. Whether you're conducting basic penetration testing, investigating how a site handles data, or exploring the DOM structure, this repository provides handy tools for various tasks. I created these through needing to simplify the acquisition of information to help in building accessibility tools for applications such as NVDA and JAWS where some websites make it harder than others to obtain the appropriate information to support visually impaired users. You may wonder how a penetration testing tool came out of that... well that was the result of innocently seeing information in websites I never expected to see at all that showed just how vulnerable we all are when we browse and use websites without really knowing how they handle our personal data, including emails, passwords etc. So now you can!  If web developers can build tools they expect us to use, we should have easier ways to make sure what we're using is safe!

## Included Script Collections

### Basic Penetration Testing Tool
A minimal set of helpers for inspecting form handling, potential injection vectors, and surface-level vulnerabilities during early-stage assessments.

### Site Data Inspector & Cleaner
Scripts that allow you to inspect and clear cookies, local storage, session storage, and other relevant data directly from the browser interface.

### Ultimate Element Inspector – Bible Edition
A heavily customised element inspection toolkit tailored for structured or nested content analysis – called the "Bible Edition" because I wanted to know chapter and verse about the elements I was investigating since some are often so outside of any sane accessibility requirements they are really hard to find.

---

## Requirements

These scripts require the [Tampermonkey browser extension](https://www.tampermonkey.net/) to be installed.

Tampermonkey is developed and maintained by **Jan Biniok** and is available for:

- Chrome / Chromium
- Firefox
- Microsoft Edge
- Safari
- Opera

---

## License

This repository uses the [Unlicense](https://unlicense.org/), effectively placing the contents in the public domain. See the [LICENSE](./LICENSE) file for details.

---

## 🤝 Acknowledgements

All credit and thanks go to **Jan Biniok** for his work on Tampermonkey, which makes this kind of user scripting possible in modern browsers.

---

Feel free to fork, adapt, and contribute!
