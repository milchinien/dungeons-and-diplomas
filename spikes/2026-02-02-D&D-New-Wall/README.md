# Spike: Tileset-Umstellung - Neue Wände & Türen

**Datum:** 2026-02-04
**Status:** 📋 **PLANUNG**
**Verantwortlich:** Michi (Junior Dev)
**Review:** Tobias (Senior Dev)

---

## Ziel

Das aktuelle Tileset (`Tileset.png`) soll mit detaillierteren Wänden und Türen aus dem alten Tileset (`Tileset_old.png`) kombiniert werden.

**Verbesserungen:**
- Mehr Tiefenwirkung bei Wänden
- Detailliertere Türen
- Bessere visuelle Klarheit

**Zusätzlich:** Behebung bekannter Wand-Generierungs-Bugs (Doppel-Wände, fehlende Wände)

---

## 📚 Dokumentations-Index

Lies die Dokumente in dieser Reihenfolge:

### 🔵 Phase 1: Verständnis & Planung
1. **[00-Überblick.md](./00-Überblick.md)** ← **START HIER!**
   - Gesamtübersicht des Projekts
   - Betroffene Dateien
   - Vorgehensweise (High-Level)

2. **[01-Tileset-Analyse.md](./01-Tileset-Analyse.md)**
   - Detaillierte Analyse beider Tilesets
   - Autotiling-System erklärt
   - Koordinaten-Mapping Tabellen

### 🟢 Phase 2: Umsetzung
3. **[02-Tileset-Erstellung.md](./02-Tileset-Erstellung.md)**
   - Schritt-für-Schritt GIMP-Anleitung
   - Tiles kopieren und exportieren
   - Rollback-Plan

4. **[03-Code-Mapping.md](./03-Code-Mapping.md)**
   - Alle betroffenen Code-Stellen
   - Prioritäten (KRITISCH / HOCH / MITTEL / NIEDRIG)
   - Änderungs-Reihenfolge

5. **[04-Tile-Koordinaten-Update.md](./04-Tile-Koordinaten-Update.md)**
   - **ARBEITS-TABELLE** zum Ausfüllen
   - Koordinaten für alle Wand-Typen
   - Code-Snippet für `spriteConfig.ts`

6. **[05-Room-Editor-Anpassung.md](./05-Room-Editor-Anpassung.md)**
   - Room Editor spezifische Tests
   - Bekannte Probleme & Lösungen
   - Canvas-Rendering Details

### 🟡 Phase 3: Bug-Fixes & Testing
7. **[06-Wand-Bug-Fix.md](./06-Wand-Bug-Fix.md)**
   - Bekannte Bugs in Wand-Generierung
   - Root Cause Analysis
   - Fix-Plan & Code-Stellen

8. **[07-Testing-Strategie.md](./07-Testing-Strategie.md)**
   - Unit-Tests, E2E-Tests, Manuelle Tests
   - Performance-Tests
   - Screenshot-Vergleich
   - Test-Report Vorlage

### ✅ Phase 4: Abschluss
9. **[08-Checkliste.md](./08-Checkliste.md)** ← **ARBEITS-DOKUMENT**
   - Komplette Checkliste zum Abhaken
   - Schritt-für-Schritt durch alle Phasen
   - Probleme & Lösungen Tracker

---

## 🚨 Wichtige Hinweise

### ⚠️ KEIN CODE SCHREIBEN - NUR PLANUNG!
Dieser Spike enthält **ausschließlich Planungsdokumente**.

**Code wird erst geschrieben wenn:**
1. ✅ Alle Dokumente gelesen
2. ✅ Plan verstanden
3. ✅ Review mit Tobias durchgeführt
4. ✅ Freigabe erhalten

### ⚠️ Backup-Strategie
**VOR jeder Änderung:**
- Backup des Tilesets erstellen
- Git-Branch erstellen (`feature/tileset-wall-update`)
- Regelmäßig committen

### ⚠️ Kritische Dateien
**Diese Dateien werden geändert:**
- `public/Assets/Castle-Dungeon2_Tiles/Tileset.png` (physische Datei)
- `lib/spriteConfig.ts` (Koordinaten)
- Eventuell: `lib/tiletheme/WallTypeDetector.ts` (Bug-Fix)

**Diese Dateien müssen getestet werden:**
- `lib/rendering/TileRenderer.ts`
- `lib/dungeon/generation.ts`
- `components/roomeditor/LayoutCanvas.tsx`

---

## 📊 Fortschritt

### Planungs-Phase
- [x] Dokumentation erstellt (00-08)
- [ ] Dokumentation gelesen (Michi)
- [ ] Review durchgeführt (Tobias)
- [ ] Freigabe erhalten

### Umsetzungs-Phase
- [ ] Tileset-Koordinaten identifiziert
- [ ] Tileset erstellt
- [ ] Code aktualisiert
- [ ] Tests durchgeführt
- [ ] Pull Request erstellt
- [ ] Gemerged

---

## 📝 Nächste Schritte

1. **Michi:** Alle Dokumente lesen (00-08)
2. **Michi:** Fragen aufschreiben
3. **Meeting:** Review mit Tobias
4. **Michi:** Checkliste (08) abarbeiten

---

## 🛠️ Werkzeuge

**Benötigt:**
- GIMP (Bildbearbeitung)
- Git (Versionskontrolle)
- VS Code (Code-Editor)
- Chrome/Firefox (Browser mit Dev-Tools)

**Optional:**
- Aseprite (Pixel Art Editor)
- ImageMagick (CLI-basierte Bildbearbeitung)

---

## 🐛 Bekannte Issues

### Issue 1: Doppelte Wände
**Status:** 🔴 Offen
**Priorität:** HOCH
**Dokument:** `06-Wand-Bug-Fix.md`

### Issue 2: Fehlende Wände
**Status:** 🔴 Offen
**Priorität:** HOCH
**Dokument:** `06-Wand-Bug-Fix.md`

### Issue 3: HORIZONTAL/VERTICAL Swap
**Status:** ✅ Gefixt (im Code dokumentiert)
**Priorität:** MITTEL
**Dokument:** `06-Wand-Bug-Fix.md`

---

## 📞 Kontakt

**Fragen zu diesem Spike?**
- Frage Tobias (Senior Dev)
- GitHub Issue erstellen
- Im Code-Review ansprechen

---

## 📜 Lizenz & Credits

**Tileset-Quellen:**
- `Tileset.png`: Aktuelles Projekt-Tileset
- `Tileset_old.png`: Legacy Tileset (Quelle für neue Wände)

**Erstellt von:** Claude Sonnet 4.5
**Für:** Michi (Junior Dev)
**Projekt:** Dungeons & Diplomas

---

**Viel Erfolg! 🚀**
