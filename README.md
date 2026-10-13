# MWIT QR Generator

[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Pages-orange?logo=cloudflare)](https://pages.cloudflare.com)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A modern, stylish QR code generator built for MWIT. Create customized QR codes with various styles and optional logo overlays.

## Features

- **Multiple QR Styles** - Square, Dots, Rounded, Extra Rounded, Classy, and Classy Rounded
- **Logo Overlays** - Choose a MWIT event logo or upload your own PNG, JPG, or WebP (up to 5 MB). Uploaded images stay in your browser.
- **QR Colors** - Set foreground and background colors, with contrast and inverted-color warnings. Always test the finished QR with a scanner.
- **Export Sizes** - Render PNGs at 400, 1,024, or 2,048 pixels; downloads and clipboard copies use the same image as the preview.
- **Export Options** - Download as PNG or copy to clipboard
- **Mobile Friendly** - Native share functionality on mobile devices
- **Real-time Preview** - See your QR code update as you type

## Tech Stack

- Next.js 16 (Turbopack)
- React 19
- Tailwind CSS 4
- qr-code-styling
- lucide-react
- react-hot-toast

## Usage

1. Enter any text or URL in the input field
2. Select a QR code style from the dropdown
3. Choose a logo overlay or upload your own image
4. Pick QR colors and an export size
5. Download the QR code or copy it to clipboard

## License

[MIT](./LICENSE)
