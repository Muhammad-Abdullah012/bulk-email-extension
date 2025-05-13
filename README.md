# Outlook Email Automator 🚀

A browser extension built with [WXT](https://wxt.dev/) and [React](https://react.dev/) to automate sending bulk emails using your Outlook (outlook.live.com) account.

> **Note:** This extension interacts directly with the Outlook web interface. Please use responsibly and be mindful of Outlook's sending limits and terms of service to avoid account issues.

---

## ✨ Features

- **Bulk Email Sending:** Send emails to multiple recipients efficiently.
- **Outlook Integration:** Works directly within your Outlook web session.
- **Modern UI:** Built with React for a responsive and user-friendly interface.
- **Cross-Browser (Dev):** Develop for both Chrome and Firefox with WXT.

---

## 🛠️ Tech Stack

- [WXT](https://wxt.dev/): Next-gen Web Extension Framework  
- [React](https://react.dev/): JavaScript library for building user interfaces  
- [TypeScript](https://www.typescriptlang.org/): Superset of JavaScript for type safety  
- [pnpm](https://pnpm.io/): Fast, disk space-efficient package manager

---

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)  
- [pnpm](https://pnpm.io/installation)

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Muhammad-Abdullah012/bulk-email-extension.git
cd bulk-email-extension
```

### 2. Install Dependencies

This project uses pnpm for package management.

```bash
pnpm install
```

---

## 💻 Development

WXT provides a great development experience with Hot Module Replacement (HMR).

### Running in Chrome

```bash
pnpm run dev
```

This will start the development server and build the extension into the `.output/chrome-mv3-dev` directory.

To load the extension in Chrome:

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (toggle in the top right).
3. Click **Load unpacked**.
4. Select the `.output/chrome-mv3-dev` directory from this project.

### Running in Firefox

```bash
pnpm run dev:firefox
```

This will start the development server and build the extension into the `.output/firefox-mv2-dev` directory.

To load the extension in Firefox:

1. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Navigate to the `.output/firefox-mv2-dev` directory and select the `manifest.json` file (or any file within the directory).

> Changes to your code will automatically rebuild the extension and reload it in your browser.

---

## 📦 Building for Production

### Build for Chrome (MV3)

```bash
pnpm run build
```

The production-ready extension will be in the `.output/chrome-mv3` directory.

### Build for Firefox (MV2)

```bash
pnpm run build:firefox
```

The production-ready extension will be in the `.output/firefox-mv2` directory.
