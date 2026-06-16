# HTTPS Camera Setup

Mobile browsers generally require HTTPS for live camera access. The MacBook-hosted app still processes everything locally, but the phone should open an HTTPS tunnel URL.

## Start The App

Terminal 1:

```bash
cd /Users/jacoblind/build-my-paper-lamp
npm run dev:mac
```

## Start HTTPS Tunnel

Terminal 2:

```bash
cd /Users/jacoblind/build-my-paper-lamp
npm run tunnel:https
```

The command prints a URL like:

```text
https://something.loca.lt
```

Open that HTTPS URL on the phone. The live camera capture should be available there.

## Notes

- Keep both terminals running while testing.
- The tunnel sends browser requests to your MacBook, but the heavy processing still runs locally.
- If the tunnel asks for a password, localtunnel commonly expects your public IP address. The terminal output usually links to the exact instruction.
- If the tunnel is unreliable, use ngrok or Cloudflare Tunnel later; the app itself does not need code changes.
