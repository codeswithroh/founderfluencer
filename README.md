# FoundrProof

> **Stop building alone. Find your co-founder in 60 seconds.**

FoundrProof analyzes any X (Twitter) profile using AI to reveal your founder archetype, score your potential, brutally roast your takes, and suggest the ideal co-founder you'd actually want to build with.

**Live:** [founderfluencer.vercel.app](https://founderfluencer.vercel.app)

---

## What it does

- **Profile Scan** — Drop any X username. We pull their bio, tweets, and engagement stats.
- **Founder Score** — AI scores them 1–10 on vision, execution, communication, hustle, and resilience.
- **The Roast** — One brutally constructive line about their profile. No one escapes.
- **Archetype** — Are they a Visionary Dreamer, Relentless Hustler, Technical Builder, or something else?
- **Rarity Tier** — Mythic, Legendary, Epic, Rare, Uncommon, or Common.
- **Ideal Co-founder Match** — Who they actually need (Technical CTO, Design-Focused CPO, Growth Hacker CMO, etc.).
- **Startup Ideas** — Three hyper-personalised startup concepts based on their actual tweets and interests.
- **Shareable Card** — Generate a beautiful founder card to flex (or get roasted) on X.

---

## Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router + Turbopack)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com)
- **UI:** [shadcn/ui](https://ui.shadcn.com)
- **Charts:** [Recharts](https://recharts.org)
- **AI:** OpenRouter (GPT-4o) + Kimi (Moonshot) fallback
- **Data:** [twitterapi.io](https://twitterapi.io)
- **Deploy:** [Vercel](https://vercel.com)

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/codeswithroh/founderfluencer.git
cd founderfluencer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in your keys:

| Variable | How to get it |
|----------|---------------|
| `TWITTERAPI_IO_KEY` | Sign up at [twitterapi.io](https://twitterapi.io) |
| `OPENROUTER_API_KEY` | Sign up at [openrouter.ai](https://openrouter.ai) |
| `KIMI_API_KEY` *(optional)* | Sign up at [platform.moonshot.cn](https://platform.moonshot.cn) |

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for production

```bash
npm run build
npm start
```

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run typecheck` | Run TypeScript checks |

---

## Project Structure

```
app/
  ├── page.tsx              # Landing page
  ├── layout.tsx            # Root layout (fonts, metadata)
  ├── globals.css           # Global styles + animations
  ├── analyze/[username]/   # Analysis results page (bento grid, charts)
  └── api/
        ├── analyze/route.ts   # Main analysis API
        └── card/route.tsx     # OG image card generator
components/ui/              # shadcn/ui components
lib/
  ├── twitter.ts            # Twitter API client
  ├── openrouter.ts         # OpenRouter AI analysis
  ├── kimi.ts               # Kimi AI fallback
  └── utils.ts              # Utilities
types/
  └── index.ts              # TypeScript types
public/
  ├── hero.mp4              # Landing page background video
  └── logo.png              # Brand logo
```

---

## Contributing

We welcome contributions! Whether it's a bug fix, a new feature, or a design tweak — jump in.

### How to contribute

1. **Fork** the repo and clone your fork.
2. **Create a branch:** `git checkout -b feat/your-feature-name` or `fix/your-bug-name`.
3. **Make your changes.** Follow the existing code style.
4. **Test locally:** Run `npm run typecheck` and `npm run build` before pushing.
5. **Commit:** Write clear, concise commit messages.
   - `feat: add startup ideas carousel`
   - `fix: resolve radar chart overflow on mobile`
   - `style: tighten hero spacing on tablets`
6. **Push and open a Pull Request** against `main`.

### Guidelines

- **Keep it minimal.** The design system is intentionally restrained — cinematic, soft depth, glass + air. Avoid loud gradients, heavy shadows, or "startup noise."
- **One accent colour.** Stick to the brand green (`#5C7F4F`) and its soft variant (`#A8C09A`).
- **Prefer opacity over colour overload.** Use `white/40`, `black/5`, etc. for hierarchy.
- **Maintain centre visual balance.** Keep at least 40% empty space in the hero.
- **No more than 2 font weights** in any section.
- **Add types** for any new data structures.
- **Run the build** before submitting — Vercel deploys from `main`.

### Ideas for contributions

- [ ] Add more founder archetypes
- [ ] Make the roast even more personalised (industry-aware)
- [ ] Add a leaderboard of highest-scoring founders
- [ ] Improve the shareable card design
- [ ] Add tweet-level engagement heatmap
- [ ] Dark mode toggle
- [ ] Multi-language support

---

## License

MIT — feel free to fork, remix, and ship your own version.

---

Built with ☕ and AI by [Rohit](https://x.com/codeswithroh). Find your co-founder at [cofoundrs.fun](https://www.cofoundrs.fun).
