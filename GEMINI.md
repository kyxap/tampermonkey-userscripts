# Project Overview

This repository contains a collection of [Tampermonkey](https://tampermonkey.net/) userscripts designed to automate tasks, improve UI usability, and enhance productivity on various websites, including LinkedIn, Microsoft Rewards, TrustedHousesitters, and Wellfound.

# Usage

These scripts are intended to be installed directly into a browser via the Tampermonkey extension.

### Installation
1. Ensure the [Tampermonkey](https://tampermonkey.net/) browser extension is installed.
2. Navigate to the desired `.user.js` file in the repository.
3. Click the `Raw` button in your browser/GitHub interface to trigger the Tampermonkey installation dialog.
4. Confirm the installation in the Tampermonkey tab.

# Project Structure

- `goodreads/`: Scripts for Goodreads.
- `img/`: Assets, including installation guides.
- `linkedin/`: Scripts for LinkedIn automation (e.g., Easy Apply helpers, unfollowing companies).
- `microsoft/`:
  - `cards/`: Scripts for managing Microsoft Rewards point collection via cards.
  - `pc-searches/`: Scripts for automating Microsoft Rewards PC searches.
- `trustedhousesitters/`: Automation for monitoring new sitting opportunities with Telegram notifications.
- `wellfound/`: One-click apply utilities.

# Development Conventions

- **Language:** JavaScript (Userscript format).
- **Metadata:** Each script contains a standard Tampermonkey/GreaseMonkey metadata block (e.g., `@name`, `@match`, `@grant`).
- **Compatibility:** Scripts are designed to interact with specific DOM elements of target websites. Changes to website UI may break scripts and require maintenance.
- **Licensing:** Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License.
