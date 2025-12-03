# Phase 0 - Task 1: Project Initialization

## Description

Funktionierende Next.js + TypeScript + Phaser Entwicklungsumgebung aufsetzen. Das Projekt muss lokal lauffähig sein und automatisch auf Vercel deployen. Supabase-Verbindung etablieren für spätere Content-Integration.

## Context

### Current state

Das Repository existiert mit Basis-Dokumentation (MVP Definition, Tech Stack, Implementation Roadmap). Noch keine Code-Basis vorhanden. Dies ist die erste Implementation-Task.

### Related Documents

- `docs/spec/Tech_Stack.md` - Definiert gewählten Tech-Stack (Next.js, Phaser, Supabase, Vercel)
- `docs/Tasks/01_Plans/MVP_Definition.md` - MVP-Scope und Features
- `docs/Tasks/01_Plans/Implementation_Roadmap.md` - Gesamter Implementation-Plan

---

## Requirements

### Functional

- Next.js Projekt mit TypeScript konfiguriert und lauffähig
- Phaser 3 Canvas rendert in einer Next.js Page
- Lokaler Dev-Server startet mit `pnpm dev`
- Vercel Deployment funktioniert automatisch bei Git Push
- Supabase Projekt ist erstellt und mit Next.js verbunden

### Technical

- Next.js 14+ mit App Router
- TypeScript strict mode aktiviert
- Phaser 3 als React Component integriert
- pnpm als Package Manager
- ESLint + Prettier konfiguriert
- Environment Variables Setup (lokal via `.env.local`, Vercel via Dashboard)
- Git Repository mit sinnvoller `.gitignore`

### Constraints

- Keine Premium-Dienste verwenden (Vercel Hobby, Supabase Free Tier)
- Code muss auf Windows (MINGW64) und anderen Plattformen laufen
- Branch Protection: Nur auf Feature-Branches arbeiten, nicht auf `main`
- Projektesprache: Markdown/Docs auf Deutsch, Code/Kommentare auf Englisch

---

## Deliverables

- `package.json` mit allen Dependencies (Next.js, React, TypeScript, Phaser 3)
- `tsconfig.json` mit strict mode
- `.eslintrc.json` und `.prettierrc` Konfiguration
- `.env.local.example` mit benötigten Environment Variables
- `.gitignore` (node_modules, .env.local, etc.)
- Basis-Folder-Struktur:
  - `/src/app` - Next.js App Router Pages
  - `/src/components` - React Components (inkl. Phaser-Wrapper)
  - `/src/game` - Phaser Game Code (Scenes, etc.)
  - `/src/lib` - Utilities (Supabase Client, etc.)
- `README.md` mit Setup-Anweisungen für das Team
- Vercel-Projekt konfiguriert mit automatischem Deployment
- Supabase-Projekt erstellt (leer, noch kein Schema)
- Funktionierender Proof-of-Concept: Phaser Canvas zeigt "Hello World" oder ähnliches

---

## Acceptance Criteria

- `pnpm install && pnpm dev` startet lokalen Server ohne Fehler
- Browser zeigt Next.js Page mit eingebettetem Phaser Canvas
- Phaser Canvas rendert visuellen Content (z.B. farbiger Hintergrund + Text)
- Git Push auf Feature-Branch triggert Vercel Preview-Deployment
- Vercel Preview-URL ist erreichbar und zeigt funktionierendes Projekt
- Supabase Client kann initialisiert werden (Connection-Test erfolgreich)
- Environment Variables sind dokumentiert und funktional
- TypeScript Compiler wirft keine Fehler (`pnpm tsc --noEmit`)
- ESLint zeigt keine kritischen Warnungen
