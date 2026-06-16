# Start Here - Build My Paper Lamp

This repo is now a local MacBook-hosted MVP for testing the proven paperlamp pipeline.

## Current Product Shape

The app turns guided photos of one object into:

1. AI foreground masks.
2. A silhouette visual-hull mesh.
3. A simplified low-poly shell.
4. A connected printable SVG net.
5. A GLB preview in the results screen.

This is not arbitrary image-to-3D. The current working constraint is controlled capture: one object, one full turn, centered framing, clean/high-contrast background, and roughly 10 to 12 useful photos.

## Current Hosting Decision

The MVP runs on Jacob's MacBook for now.

```text
phone/browser -> MacBook Next.js app -> local Python pipeline -> ~/.paperlamp/jobs
```

Use `LOCAL_MACBOOK_MVP.md` for the runbook.
Use `HTTPS_CAMERA_SETUP.md` when live camera capture is needed from an iPhone.

## Start The App

From the repo root:

```bash
npm run dev:mac
```

Open locally:

```text
http://localhost:3000
```

Open from a phone on the same Wi-Fi:

```text
http://YOUR_MAC_LOCAL_IP:3000
```

For iPhone live camera capture, use the HTTPS tunnel documented in `HTTPS_CAMERA_SETUP.md`.

## Current MVP Flow

1. Capture or choose photos.
2. Follow the 12-slot capture guide.
3. Reorder uploaded photos before segmentation if needed.
4. Segment photos and inspect the AI mask contact sheet.
5. Choose complexity: simple, medium, or detailed.
6. Choose template style: plain or colored.
7. Generate the model and SVG.
8. Inspect the 3D preview and download the SVG.

## What Has Been Proven

- Stanford Bunny proved the mesh-to-faceted-shell-to-SVG-net path.
- Public object datasets proved the visual-hull path generalizes best to solid, silhouette-driven objects.
- Real Jagermeister bottle photos proved that proper AI segmentation can produce a recognizable bottle silhouette from phone images.
- Color SVG export exists as an MVP option, but color quality is still basic sampled face color, not true texture reconstruction.

## Known Limits

- Handles, holes, thin parts, glass, transparency, heavy concavities, and complex internal geometry are weak targets.
- The pipeline depends heavily on segmentation quality and capture order.
- The current SVG is a technical net, not yet a polished commercial assembly kit.
- The MacBook must stay awake while testers use the app.

## Source Of Truth Docs

- `PROJECT_PLAN.md` - project status, phases, and proof history.
- `LOCAL_MACBOOK_MVP.md` - local runbook and tester checklist.
- `HTTPS_CAMERA_SETUP.md` - HTTPS tunnel setup for phone camera access.
- `poc/reports/poc-report.md` - raw proof-of-concept notes.
- `poc/reports/tool-test-matrix.md` - tool and dataset findings.
