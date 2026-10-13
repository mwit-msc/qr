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
- **Captions** - Add a title and optional description below the QR, with three font sizes and left/center/right alignment. Captions appear in downloads and clipboard copies, with automatic Thai/English text wrapping.
- **Export Sizes** - Choose a PNG width of 400, 1,024, or 2,048 pixels. Captions add height below the square QR; hide or clear the caption for a square export. Downloads and clipboard copies use the same image as the preview.
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
2. Customize the optional caption, font size, and alignment
3. Select a QR code style and a preset or uploaded logo
4. Pick QR colors and an export width
5. Download the QR code or copy it to clipboard

## Development

Run `npm run lint`, `npm test`, `npm run typecheck`, and `npm run build` to validate changes.

TypeScript 7 handles the standalone type check. TypeScript 6 supplies the compiler API required by Next.js and ESLint; the separate native TypeScript 7 alias avoids Bun's nested-alias resolution issue. ESLint uses the newest 9.x release supported by Next.js's lint plugins.

Keep `package-lock.json` and `bun.lock` synchronized when updating dependencies. The Bun lockfile is generated with Bun 1.2.15 to remain compatible with the Cloudflare Pages build image.

## License

[MIT](./LICENSE)
