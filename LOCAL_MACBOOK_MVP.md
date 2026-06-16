# Local MacBook MVP

This is the current preferred tester setup: your MacBook runs the full app and processing pipeline.

```text
phone/browser -> MacBook Next.js app -> local Python pipeline -> ~/.paperlamp/jobs
```

## Start The App

From the repo root:

```bash
npm run dev:mac
```

The script sets:

- `LAMP_JOB_DIR=$HOME/.paperlamp/jobs`
- `PYTHON_BIN=/opt/anaconda3/envs/paperlamp-poc/bin/python`
- host `0.0.0.0`
- port `3000`

Open on the Mac:

```text
http://localhost:3000
```

Open from a phone on the same Wi-Fi:

```text
http://YOUR_MAC_LOCAL_IP:3000
```

Some mobile browsers block live camera access on local `http://` network URLs. If that happens, use **Choose Photos** in the capture screen and select 10-15 images from the phone library. For live camera capture from another device, use an HTTPS tunnel such as ngrok or Cloudflare Tunnel.

See `HTTPS_CAMERA_SETUP.md` for the current localtunnel setup.

Find the Mac IP with:

```bash
ipconfig getifaddr en0
```

## Requirements

- MacBook stays awake while testers use it.
- Same Wi-Fi network for phone testing, unless you add a tunnel.
- POC Python environment exists at `/opt/anaconda3/envs/paperlamp-poc`.
- The first segmentation run may be slower if the model cache is cold.

## Optional Public Link

For testers outside your Wi-Fi, use a tunnel such as ngrok or Cloudflare Tunnel pointing to:

```text
http://localhost:3000
```

Keep that tunnel private for now. The MVP has no authentication.

## Where Files Go

Uploaded images and generated results are stored under:

```text
~/.paperlamp/jobs
```

Delete old test jobs from that folder when disk usage grows.

## Current App Flow

1. Open the capture screen.
2. Take guided photos directly over HTTPS, or choose existing photos from the library.
3. Keep the photos in one smooth rotation order. The current capture guide uses 12 slots:
   - front;
   - front right;
   - right side;
   - back right;
   - back;
   - back left;
   - left side;
   - front left;
   - slightly above front;
   - slightly above right;
   - slightly above back;
   - slightly above left.
4. Rearrange thumbnails with the left/right controls before segmentation if the library upload order is wrong.
5. Segment the photos.
6. Review the segmentation contact sheet.
7. Choose complexity and template style:
   - `Plain` for easiest cutting and assembly.
   - `Colored` for approximate sampled printed face colors.
8. Generate the model and SVG.

## Second Object Test Checklist

For each new test object, record:

- object name and rough material;
- number of selected photos;
- whether the photos are in the intended slot/order;
- whether the segmentation preview keeps the full object in white;
- whether the 3D preview is recognizable;
- whether plain or colored SVG was used;
- whether **Download SVG** returns a file;
- any failure message shown on the processing screen.
