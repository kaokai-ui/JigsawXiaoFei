# JigsawXiaoFei Agent Notes

This file is local guidance for Codex.

## Command Rule

- Prefix shell commands with `rtk`.
- For PowerShell cmdlets, use `rtk powershell -NoProfile -Command "..."`.

## Project

- Stack: Vite + React + TypeScript
- Domain: jigsaw puzzle game
- Generated assets: image manifest and optimized web images
- Target devices: PC, iPhone, iPad, Android phone/tablet

## Before Editing

Read:

- `D:\Game\project-map.md`
- `D:\Game\codex-workflow-playbook.md`
- `D:\Game\ui-mobile-verification-checklist.md`
- `README.md`
- `package.json`
- existing tests near the changed files

For puzzle shape, piece bitmap, image, or board-fit work, inspect:

- `scripts/generate-image-manifest.mjs`
- `src/domain/puzzle/`
- `src/features/puzzle/`
- `src/generated/imageManifest.ts`

## Generated Asset Rule

If `Pic/`, `public/images/`, image paths, thumbnails, or manifest generation changes:

```powershell
rtk npm run generate-manifest
```

Then verify:

- `src/generated/imageManifest.ts` points at the expected files
- `public/images` contains the expected optimized images
- no stale image extension remains after changing output format

## UI / Mobile Validation

For board, piece, or touch interaction changes, verify:

- right-side pieces visually match left board slots
- SVG plate and piece bitmap use the same geometry
- no piece is clipped by its own bitmap bleed
- phone long-press does not trigger image share/save/copy menus
- touch mode supports tap-select/tap-place or equivalent low-friction mobile interaction

## Validation

Use the smallest relevant set:

```powershell
rtk npm run typecheck
rtk npm run test
rtk npm run build
```

For image/board geometry changes, prefer:

```powershell
rtk npm run test -- src/domain/puzzle/libraryFit.test.ts
```

For full visual confidence, use:

```powershell
rtk npm run test:e2e
```

## Known Risks

- Shape geometry, board plate SVG, and piece bitmap clipping must stay aligned.
- WebP conversion must update both generated files and manifest paths.
- Desktop number inputs can be too narrow because browser spinners consume width.
- Mobile Safari/Chrome can open native image menus on long press unless touch callouts/context menu are disabled.
