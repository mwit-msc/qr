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

## URL configuration

Opening a configured URL fills the controls and generates the preview automatically. Settings remain editable; the URL does not trigger a download.

| Parameter | Values | Default for a configured URL |
| --- | --- | --- |
| `link` | URL or text to encode | `https://mwit.ac.th` |
| `title` | Caption title, up to 80 UTF-16 code units | Blank |
| `description` | Caption description, up to 120 UTF-16 code units | Blank |
| `logo` (alias `icon`) | `none`, `alvis`, `openhouse2025`, `premwit2026`, `openhouse2026` | `alvis` |
| `style` | `square`, `dots`, `rounded`, `extra-rounded`, `classy`, `classy-rounded` | `rounded` |
| `fontSize` | `small`, `medium`, `large` | `medium` |
| `align` | `left`, `center`, `right` | `center` |
| `foreground` | Six-digit hex, with or without `#` | `0B1220` |
| `background` | Six-digit hex, with or without `#` | `FFFFFF` |
| `size` | `400`, `1024`, `2048` (image width) | `400` |
| `caption` | `true`, `false` | Enabled when nonblank caption text exists |

Missing or blank title/description values add no text. `caption=false` hides the caption while retaining its text in the controls. Even with `caption=true`, blank text produces a square export. `logo=none` omits the logo. Custom uploaded logos cannot be supplied through a URL.

Invalid choices fall back to defaults; unknown parameters are ignored. Parameter names and preset IDs are case-sensitive. The first occurrence of a repeated parameter wins, and `logo` takes precedence over `icon`. With no recognized configuration parameters, the homepage retains its usual `QR Code` / `mwit.link` caption.

Examples:

```text
/?link=https%3A%2F%2Fexample.com&logo=none
/?link=https%3A%2F%2Fexample.com&title=Open%20House&logo=openhouse2026&fontSize=large&align=center
```

Build queries with `URLSearchParams` to preserve nested URLs, Thai text, spaces, `&`, `+`, and `#`. Values are decoded once:

```js
const params = new URLSearchParams({
  link: 'https://example.com/register?event=openhouse&lang=th',
  title: 'Open House 2026',
  description: 'ลงทะเบียนเข้าร่วมงาน',
  logo: 'openhouse2026',
  fontSize: 'large',
  align: 'center',
})
const qrUrl = `${location.origin}/?${params}`
```

## Development

Run `npm run lint`, `npm test`, `npm run typecheck`, and `npm run build` to validate changes.

TypeScript 7 handles the standalone type check. TypeScript 6 supplies the compiler API required by Next.js and ESLint; the separate native TypeScript 7 alias avoids Bun's nested-alias resolution issue. ESLint uses the newest 9.x release supported by Next.js's lint plugins.

Keep `package-lock.json` and `bun.lock` synchronized when updating dependencies. The Bun lockfile is generated with Bun 1.2.15 to remain compatible with the Cloudflare Pages build image.

## License

[MIT](./LICENSE)
