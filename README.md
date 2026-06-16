# Build My Paper Lamp 🦜

**Turn guided photos of one object into a low-poly printable paper model.**

Take 10-15 photos around one object -> AI segmentation -> visual-hull mesh -> faceted shell -> connected SVG net for printing or cutting.

The current MVP is a technical tester build. It is honest about what works: recognizable silhouette geometry, not exact texture or label reconstruction.

---

## What is This?

A web app that wraps the proven Phase 1 pipeline:

1. **Capture:** Take 10-15 guided photos around one object.
2. **Segment:** AI isolates the object from the background.
3. **Reconstruct:** A visual-hull mesh is generated from the silhouettes.
4. **Simplify:** The mesh becomes a low-poly faceted shell.
5. **Export:** A connected SVG net is generated for printing or cutting.

**No 3D modeling skills required.** The app still needs guided capture and works best with solid, silhouette-driven objects.

---

## Features

### MVP (Phase 1)
- ✅ Real-time camera capture on mobile
- ✅ AI foreground segmentation
- ✅ Visual-hull mesh generation
- ✅ Low-poly faceted shell generation
- ✅ Connected SVG net export
- ✅ Live progress tracking
- ✅ 3D model preview (interactive)
- ✅ SVG vector preview
- ✅ One-click SVG download
- ✅ Mobile-first design
- ✅ Works on iOS + Android

### Phase 2 (Planned)
- 🔜 3D model editor (adjust scale, rotate)
- 🔜 Vector adjustments (line thickness, smoothing)
- 🔜 Batch processing (create multiple lamps at once)
- 🔜 Design history (save favorite designs)
- 🔜 Paper/material selection (weight, color)
- 🔜 Assembly guides (step-by-step instructions)

### Phase 3 (Future)
- 🔮 AI-assisted folding patterns
- 🔮 Unfolding visualization
- 🔮 E-commerce integration (order pre-cut kits)
- 🔮 Community gallery (share your designs)

---

## How It Works

### The Pipeline

```
📱 YOUR PHONE
    ↓
  📸 Take 10-15 photos (one full turn around the object)
    ↓
💾 Photos stored locally in browser
    ↓
🚀 Click "Process" → upload to server
    ↓
🤖 AI segmentation
    • Generates clean foreground masks
    • Preserves object silhouette
    ↓
📐 Visual-hull pipeline
    • Builds watertight mesh
    • Generates faceted shell
    • Exports connected SVG net
    ↓
📊 Results in App
    • 3D model preview (interactive)
    • SVG net preview
    • Download button
    ↓
📥 Download SVG
    • Use in Inkscape
    • Send to laser cutter
    • Print, cut, glue, add light!
```

### Technology Stack

**Frontend:**
- Next.js 14 (React + TypeScript)
- Tailwind CSS
- Three.js (3D viewer)
- Camera API (phone capture)

**Backend:**
- Next.js API routes
- Python processing scripts
- rembg / ONNX Runtime for segmentation
- trimesh / scikit-image / shapely for geometry and SVG export

**Hosting:**
- Single Docker web service for the first cloud MVP
- Persistent disk for uploaded photos and generated outputs
- Render or Railway recommended first

---

## Quick Start

### For Users (App)

1. Open the deployed tester link on your phone
2. Click **"Start Creating"**
3. Allow camera permission
4. Take **10-15 photos** of your object while walking around it once
5. Click **"Process"**
6. Wait while the cloud worker processes
7. Download the **SVG file**
8. Open in **Inkscape**, print as a cutting template, or send to a laser cutter
9. Print, cut, glue, add light → **Done!** 🎉

### For Developers (Build from Source)

#### Prerequisites
- Node.js 18+
- Python 3.11+ for local processing
- Git

#### Setup

```bash
# Clone the repo
git clone https://github.com/apichecker1-max/build-my-paper-lamp.git
cd build-my-paper-lamp

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Add your API keys
# KIRI_ENGINE_API_KEY=...
# SKETCH_EDGE_API_KEY=...

# Start dev server
npm run dev

# Open http://localhost:3000
```

#### Build for Production

```bash
# Build
npm run build

# Test production build locally
npm run start

# Deploy the cloud MVP as a Docker app
# See CLOUD_MVP.md
```

---

## Documentation

### For Users
- **[Getting Started Guide](docs/GETTING_STARTED.md)** — Step-by-step tutorial
- **[FAQ](docs/FAQ.md)** — Common questions
- **[Tips & Tricks](docs/TIPS.md)** — Get better results

### For Developers
- **[PROJECT_PLAN.md](PROJECT_PLAN.md)** — High-level project overview
- **[LOCAL_MACBOOK_MVP.md](LOCAL_MACBOOK_MVP.md)** — Run the tester MVP from your MacBook
- **[CLOUD_MVP.md](CLOUD_MVP.md)** — Single-container cloud MVP deployment
- **[TECHNICAL_SPEC.md](TECHNICAL_SPEC.md)** — Detailed technical architecture
- **[API_DOCUMENTATION.md](docs/API.md)** — Backend endpoint reference
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** — Legacy Vercel notes
- **[TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)** — Common issues & fixes

---

## Project Structure

```
build-my-paper-lamp/
├── PROJECT_PLAN.md           # Project overview & phases
├── TECHNICAL_SPEC.md         # Detailed technical specs
├── README.md                 # This file
├── package.json
├── next.config.js
├── tailwind.config.js
│
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing page
│   │   ├── capture/          # Camera capture page
│   │   ├── processing/       # Job processing page
│   │   ├── results/          # Results & download page
│   │   └── api/              # Backend routes
│   │       ├── upload/
│   │       ├── process/
│   │       ├── status/
│   │       ├── model/
│   │       └── download/
│   │
│   ├── components/           # React components
│   ├── lib/                  # Utilities & API clients
│   ├── hooks/                # Custom React hooks
│   └── types/                # TypeScript definitions
│
├── public/                   # Static assets
├── docs/                     # Documentation
└── tests/                    # Test files
```

---

## How to Get Better Results

### 📸 Photography Tips
1. **Good lighting** — Bright, even lighting (avoid shadows)
2. **One full turn** — Capture 10-15 photos around the object
3. **Consistent framing** — Keep the object centered and similarly sized
4. **Focus** — Make sure photos are sharp, not blurry
5. **Simple background** — High contrast or plain backgrounds segment better

### 📊 For Complex Objects
- First MVP target: 10-15 guided photos
- Good early objects: solid, silhouette-driven forms
- Weak early objects: handles, holes, thin parts, transparent objects, heavy concavities

### 🖨️ Laser Cutter Tips
1. Get **material thickness right** (3mm cardstock works great)
2. Test cut **a small piece first**
3. Adjust **power/speed** based on material
4. Use **masking tape** on back (prevents scorch marks)
5. **Sand edges** gently for smooth assembly

---

## FAQ

**Q: Do I need experience with 3D modeling?**  
A: No! The app handles all the hard stuff. You just take photos.

**Q: What phone do I need?**  
A: Any phone with a decent camera (iPhone 11+ or Android equivalent). Newer is better.

**Q: How long does processing take?**  
A: About 2-3 minutes for photos → 3D → vector. Most of that is waiting for AI services.

**Q: Can I use this without a laser cutter?**  
A: Yes! You can:
- Print the SVG template on regular paper, hand-cut it
- Send SVG to a local makerspace (they have laser cutters)
- Order pre-cut kits online (future feature)

**Q: Is my data private?**  
A: Yes. We delete all photos after processing (48 hours). We don't store personal data.

**Q: How much does it cost?**  
A: Free! (Costs us ~$0.50-$1 per job for API calls, but we're covering it during beta)

**Q: Can I commercialize designs?**  
A: Yes, for personal use. For commercial resale, contact us for a license.

---

## Roadmap

### 🟢 Phase 1: MVP (April 2026)
- Basic workflow: capture → 3D → SVG → download
- Works on mobile
- Free to use

### 🟡 Phase 2: Features (May-June 2026)
- 3D model editor
- Batch processing
- Design history
- Material selection

### 🔴 Phase 3: Scale (July 2026+)
- User accounts
- Design marketplace
- Premium features
- E-commerce integration

---

## Support & Feedback

### Report a Bug
- Open an issue on GitHub
- Include photos (if possible)
- Describe what went wrong

### Suggest a Feature
- Discussions tab on GitHub
- Vote on existing suggestions
- Share your use case

### Contact Us
- Email: [support@buildmypaperlamp.com](mailto:support@buildmypaperlamp.com) (future)
- Twitter: [@buildmypaperlamp](https://twitter.com) (future)

---

## Credits

Built with love by [apichecker1-max](https://github.com/apichecker1-max)

### Open Source
- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [rembg](https://github.com/danielgatis/rembg)
- [trimesh](https://trimesh.org)
- [Shadcn/ui](https://ui.shadcn.com)
- [Three.js](https://threejs.org)

---

## License

MIT License — Build & sell! (With attribution appreciated 💙)

---

## Contributing

Want to help? Pull requests welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Let's make paper lamp creation accessible to everyone!** 🎉

**[Live Demo](https://build-my-paper-lamp.vercel.app)** | **[GitHub](https://github.com/apichecker1-max/build-my-paper-lamp)** | **[Docs](docs/)**

Made with ❤️ for makers, artists, and lamp lovers.
