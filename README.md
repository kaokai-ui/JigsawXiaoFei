# JigsawXiaoFei

A single-page jigsaw puzzle game built with Vite, React, and TypeScript.

## Quick Start

```bash
npm install
npm run dev
```

Open the local Vite URL in your browser to start the app.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run test
```

## Project Structure

```text
.
├─ assets/
│  └─ source-images/      # Source images used to generate puzzle assets
├─ docs/                  # Planning notes and bug tracking
├─ public/
│  └─ images/             # Generated web assets copied from source images
├─ scripts/               # Build-time utilities
├─ src/                   # Application source code
└─ package.json
```

## Image Asset Flow

`npm run build` runs `scripts/generate-image-manifest.mjs` before Vite builds the app.

That script:

1. Reads source files from `assets/source-images/`
2. Regenerates `public/images/`
3. Rewrites `src/generated/imageManifest.ts`

If you add or replace puzzle images, put them in `assets/source-images/` and run:

```bash
npm run generate-manifest
```

## Notes

- `node_modules/`, `dist/`, coverage output, and test artifacts are ignored by git.
- The repository keeps both the original source images and the generated web-ready assets so a fresh clone can build successfully.
