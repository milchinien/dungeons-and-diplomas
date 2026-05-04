# Technical Architecture & Stack

> **Deprecated / historisch (Stand 2026-05-04):** Dieses Dokument beschreibt die urspruengliche MVP-Stack-Entscheidung vom 13.11.2025. Es bleibt als Entscheidungsprotokoll erhalten, ist aber nicht mehr die operative Architektur. Aktuell relevant sind [../ARCHITECTURE.md](../ARCHITECTURE.md), [../CURRENT_STATUS.md](../CURRENT_STATUS.md) und [../Tasks/01_Plans/Current_Roadmap.md](../Tasks/01_Plans/Current_Roadmap.md). Wichtige Abweichungen: Phaser wurde durch Custom Canvas Rendering ersetzt, npm wird verwendet, und der SQLite/Supabase-Adapter-Layer ist implementiert.

## Erstellt
2025-11-13 - Tobias

## Übersicht
Technische Spezifikation für den Educational Dungeon Crawler MVP. Browser-basierte Anwendung mit Fokus auf rapid deployment, minimal operations, und AI-gestützter Content-Generierung.

---

## Plattform-Entscheidungen

### Deployment-Ziel
- **Browser-only** (keine Desktop-/Mobile-Native-Apps im MVP)
- Responsive Design (Desktop + Tablet, Mobile optional)
- Public accessibility (Staging + Production Environments)

### Deployment-Anforderungen
- ✅ Rapid deployment (automatisiert)
- ✅ Minimal Operations-Aufwand
- ✅ Auto-Scaling
- ✅ Preview-Deployments für Testing
- ✅ Git-basierter Workflow

---

## Frontend Stack

### Game Engine: Phaser 3
**Begründung:**
- Reife 2D Game Engine für Browser
- Exzellente AI-Training-Data (hohe Code-Generierungs-Qualität)
- Built-in Features für Slay-the-Spire-artiges Gameplay:
  - Scene Management (Overworld → Combat → Result)
  - Tween/Animation System (Card-Bewegungen, Transitions)
  - Sprite-Rendering + Particle Systems
  - Asset Loading Pipeline
  - Input Handling

**Alternativen erwogen:**
- PixiJS: Zu lightweight, mehr Custom-Code nötig
- Three.js: Overkill für 2D-Game

### UI Framework: Next.js (React) mit TypeScript
**Begründung:**
- Perfekte Integration mit Vercel (Hosting-Platform)
- TypeScript für Type-Safety und bessere AI-Code-Generierung
- Server-Side Rendering (SSR) für schnelle Initial Loads
- React-Ökosystem für Menüs/Overworld/Settings außerhalb des Game-Canvas

**Komponentenstruktur:**
- Next.js Pages für Navigation (Home, Overworld, Settings)
- Phaser Game Canvas als React-Component embedded
- Shared State Management zwischen React + Phaser (z.B. Zustand Context/Redux)

**TypeScript-Konfiguration:**
- Strict Mode enabled
- Klare Interfaces für Game-Data (Gegner, Items, Aufgaben)
- Type-Safety für Supabase-Queries

---

## Backend Stack

### Database & Backend: Supabase
**Komponenten:**
- **PostgreSQL** (managed): Storage für Aufgaben, Items, Gegner-Definitions
- **Edge Functions** (Deno): Backend-Logic für AI-Content-Generierung
- **Storage**: Asset-Hosting (Sprites, Sounds, wenn nicht via CDN)
- **Auth** (optional für MVP): User-Management für spätere Features

**Schema-Beispiel (Initial):**
```sql
-- Subjects (Fächer)
CREATE TABLE subjects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT false
);

-- Dungeons
CREATE TABLE dungeons (
  id UUID PRIMARY KEY,
  subject_id UUID REFERENCES subjects(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false
);

-- Questions (Aufgaben)
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  dungeon_id UUID REFERENCES dungeons(id),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL, -- ["Option A", "Option B", "Option C", "Option D"]
  correct_index INTEGER NOT NULL,
  difficulty INTEGER, -- Skalierung 1-10
  metadata JSONB -- Für spätere Erweiterungen
);

-- Enemy Types
CREATE TABLE enemy_types (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  base_hp INTEGER NOT NULL,
  base_damage INTEGER NOT NULL,
  solve_time_seconds INTEGER NOT NULL,
  sprite_asset TEXT -- Path zu Asset
);

-- Items
CREATE TABLE items (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  effect_type TEXT NOT NULL, -- "damage_boost", "hp_boost", etc.
  effect_value INTEGER NOT NULL,
  sprite_asset TEXT
);
```

**Edge Functions Use-Cases:**
- AI-Content-Generierung (Aufgaben on-demand nachgenerieren)
- Background-Jobs für Content-Caching
- Optional: Highscore-Validation

---

## Hosting & Deployment

### Platform: Vercel
**Begründung:**
- Nahtlose Next.js-Integration (zero-config)
- GitHub-Integration: Auto-Deploy on Push
- Preview-Deployments: Jeder Branch/PR → eigene URL
- Edge Network (CDN) für schnelle Global-Availability
- Free Tier ausreichend für MVP

**Deployment-Workflow:**
```
Developer → git push origin feature/xyz
          ↓
Vercel    → Build Preview Deploy
          → URL: xyz-project.vercel.app
          ↓
Developer → Test + Review
          ↓
          → git merge to main
          ↓
Vercel    → Build Production Deploy
          → URL: dungeons-diplomas.vercel.app (Custom Domain optional)
```

**Environment Variables (Vercel Dashboard):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Backend only)
- `OPENAI_API_KEY` (für AI-Content-Generation)

---

## Art & Assets

### Art-Style: Low-Poly 2D
**Begründung:**
- Team hat limitierte visuelle Skills
- AI-generierbar (MidJourney, DALL-E)
- Konsistente Ergebnisse (geometrische Formen = weniger Varianz)
- Modern/clean Look
- Performance-freundlich (simple shapes, wenige Details)

**Asset-Pipeline:**
1. **Konzept-Phase:**
   - AI-Prompts für Asset-Generierung (z.B. "low poly geometric goblin, flat colors, 2D game sprite, white background")
   - MidJourney/DALL-E → PNG Export
2. **Processing:**
   - Optional: Cleanup in Figma/Photoshop (Background removal, Resizing)
   - Export als PNG (transparenter Hintergrund)
3. **Integration:**
   - Upload zu Supabase Storage ODER direktes Bundling in `/public/assets/`
   - Phaser Asset-Loader lädt Sprites

**Asset-Kategorien (MVP):**
- **Gegner-Sprites:** 3-5 Typen (Speedster, Tank, Balanced, etc.)
- **Item-Icons:** 5 Items mit Icons
- **UI-Elements:** Buttons, Panels, Health-Bars (können CSS/SVG sein)
- **Backgrounds:** 2-3 einfache Hintergründe (Overworld, Dungeon-Raum)

**Alternativen erwogen:**
- Pixel-Art: Schwieriger AI-zu-generieren, inkonsistente Ergebnisse
- Cartoon/Hand-Drawn: Zu aufwendig ohne Art-Skills

---

## AI-Integration

### Content-Generierung
**Aufgaben-Generierung (Questions):**
- **Tool:** OpenAI API (GPT-4 oder Claude via Anthropic API oder OpenRouter)
- **Strategie:** Pre-Generation (nicht live im Game)
- **Workflow:**
  1. Admin startet Script: `npm run generate-questions -- --dungeon=mathe-grundrechenarten --count=100`
  2. Script ruft AI-API mit Prompt:
     ```
     Generate 100 math questions for grade 5 (basic arithmetic).
     Format: Multiple choice with 4 options.
     Return JSON: [{ question, options: [A, B, C, D], correct_index }]
     ```
  3. Script validiert + schreibt in Supabase `questions` Table
  4. Game lädt Aufgaben aus Supabase

**Asset-Generierung:**
- **Tool:** MidJourney (via Discord Bot) oder DALL-E API
- **Workflow:** Manuell im MVP (später automatisierbar)

---

## Development Tooling

### Package Manager
- **pnpm** (schneller, weniger Disk-Usage)

### Code Quality
- **ESLint** + **Prettier** (Next.js bringt beides mit)
- **Husky** + **lint-staged** für Pre-Commit Hooks
- TypeScript Strict Mode

### Testing (Optional für MVP, empfohlen später)
- **Vitest** (schneller als Jest, ESM-native)
- **Playwright** für E2E-Tests (Vercel hat native Integration)

### Version Control
- **Git** + **GitHub**
- Branch-Strategie:
  - `main` → Production
  - `develop` → Integration Branch
  - `feature/*` → Feature-Development

---

## Skalierungs-Überlegungen (Post-MVP)

### Wenn Traffic wächst:
- Vercel skaliert automatisch (bis Free-Tier-Limit)
- Supabase Free Tier: 500MB DB, 1GB Storage
  - Upgrade zu Pro ($25/month): 8GB DB, 100GB Storage

### Wenn Content wächst:
- Supabase PostgreSQL kann Millionen Aufgaben handlen
- Asset-Delivery: Wechsel zu dediziertem CDN (Cloudflare R2, AWS S3)

### Wenn Features wachsen:
- Microservices-Architektur via Supabase Edge Functions
- Separate AI-Content-Service (Background-Worker)
- Caching-Layer (Redis via Vercel KV Store)

---

## Cost Estimation (MVP Phase)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby (Free) | $0 |
| Supabase | Free Tier | $0 |
| OpenAI API | Pay-per-Use | ~$5-10/month (Content-Gen) |
| MidJourney | Basic Plan | $10/month (optional) |
| **Total** | | **~$15/month** |

Nach MVP (Production-ready):
- Vercel Pro: $20/month (Custom Domain, mehr Bandwidth)
- Supabase Pro: $25/month (mehr DB/Storage)
- Total: ~$60-70/month

---

## Security Considerations

### API Keys
- Supabase Anon Key: Public (nur für Row-Level-Security gecheckte Queries)
- Supabase Service Role Key: Server-only (Vercel Environment Variables)
- OpenAI API Key: Server-only (Edge Functions)

### Supabase Row-Level Security (RLS)
- Questions Table: Public Read-Only
- User-Data (später): User kann nur eigene Daten sehen

### Rate Limiting
- Vercel: Built-in (100 requests/10 seconds per IP)
- Supabase: Built-in (60 requests/minute per IP)

---

## Offene Entscheidungen (für Implementation Phase)

1. **State Management:**
   - Zustand, Redux Toolkit, oder React Context?
   - Wie kommunizieren React + Phaser?

2. **Audio:**
   - Howler.js (Web Audio Library)?
   - Phaser's eingebautes Audio-System?

3. **Analytics:**
   - Vercel Analytics (Built-in)?
   - Custom-Tracking für Game-Metrics (Run-Length, Accuracy)?

4. **Custom Domain:**
   - Kostenlos über Vercel konfigurierbar
   - DNS-Setup nötig

---

## Status
✅ **Tech-Stack finalisiert** - Bereit für Implementation Planning & Projektsetup
