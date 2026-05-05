# MVP Definition - Educational Dungeon Crawler

> **Historischer Planungsstand (Stand 2026-05-04):** Dieses Dokument bleibt als urspruengliche MVP-Definition erhalten. Mehrere als Post-MVP markierte Features sind inzwischen teilweise oder vollstaendig im Code vorhanden, z.B. Treasure-Raeume, Items, Highscores, XP, Editor-Tools und Supabase-Adapter. Fuer den aktuellen Stand siehe [../../CURRENT_STATUS.md](../../CURRENT_STATUS.md).

MVP = Minimal Viable Product

## Erstellt
2025-11-13 - Michi (michi.waggoner@gmail.com)

## Zielsetzung
Minimal funktionsfähige Version des Educational Dungeon Crawlers, die die Kern-Roguelike-Mechanik demonstriert und testbar macht. Fokus auf **Core Gameplay Loop** statt Feature-Breite.

## Kern-Designprinzipien des MVP

### Was ist drin (MVP Scope)
- **Roguelike-Struktur:** Prozedural generierte Runs mit Permadeath
- **Combat-fokussiert:** Raumauswahl, Gegnertypen, taktische Tiefe
- **In-Run-Progression:** XP, Level-Ups, Item-Slot-Unlocks
- **Overworld-Struktur:** Fächer-basierte Navigation mit Content-Skalierbarkeit
- **AI-Content-Pipeline:** Pre-generierte Aufgaben, AI-gestützte Nachgenerierung

### Was ist NICHT drin (Post-MVP)
- Meta-Progression (permanente Items, Gold-System, fachübergreifende Level)
- Shop/Treasure/Boss-Räume
- Taktische Item-Effekte (Shields, Mana, Special Abilities)
- Ressourcen-Management
- Player-State/Unlock-Systeme
- Verschiedene Gegnertypen pro Fach

---

## 1. Core Gameplay Loop

### Run-Struktur
- **Format:** Pure Endless Mode - Spieler läuft bis zum Tod
- **Ziel:** Highscore = Anzahl geschaffter Räume
- **Schwierigkeitsskalierung:** Gegner werden mit jedem Raum stärker (mehr HP, mehr Schaden, schneller)
- **Raumtypen:** Nur Combat-Räume (keine Shops, Treasure, Bosse)

### Raumauswahl & Taktik
- Nach jedem Kampf: 2-3 Türen zur Auswahl
- Jede Tür zeigt visuell/textlich an, welcher Gegnertyp dahinter lauert
- Spieler wählt bewusst Risk-Level: Schwierigerer Gegner → besserer Loot

---

## 2. Combat-System (Vereinfacht)

### Kampfablauf
1. Spieler betritt Raum → Gegner erscheint
2. Multiple-Choice-Aufgabe wird angezeigt (4 Optionen)
3. **Einfache Logik:**
   - Spieler löst **richtig/schneller** als Gegner → Spieler macht Schaden
   - Spieler löst **falsch/langsamer** als Gegner → Gegner macht Schaden
4. Kampf läuft bis einer bei 0 HP ist

### Gegner-Verhalten
- Gegner hat eine **Lösungszeit** (z.B. 30 Sek)
- Gegner zeigt **visuell Fortschritt** (animierte Lösung, Fortschrittsbalken)
- Gegner löst immer korrekt (wenn Zeit ausläuft)

### Stats & Balancing (Startwerte)
- **Spieler:** 10 Basis-Schaden, 25 HP Start
- **Gegnertypen (Beispiele):**
  - Speedster: 6 HP, 7 Schaden, 20 Sek Lösungszeit
  - Tank: 15 HP, 10 Schaden, 40 Sek Lösungszeit
  - Balanced: 10 HP, 8 Schaden, 30 Sek Lösungszeit

---

## 3. Progression im Run

### XP & Level-System
- Gegner droppen XP bei Tod
- XP → Level-Ups
- Level-Ups schalten **Item-Slots** frei:
  - Start: 3 Item-Slots aktiv
  - Level 2: +1 Slot (4 total)
  - Level 4: +1 Slot (5 total)
  - etc.

### Item-System (Minimal)
- **5 verschiedene Items** mit einfachen Stat-Boosts:
  - +3 Damage
  - +10 HP
  - +5 HP Regeneration nach Kampf
  - -5 Sek Gegner-Lösungszeit (Gegner wird langsamer)
  - +2 Schaden pro Level (skaliert mit Run-Progression)
- Items droppen zufällig von Gegnern
- Spieler kann Items ausrüsten (begrenzt durch freigeschaltete Slots)
- Items sind **nur im Run aktiv** (kein permanentes Inventar)

---

## 4. Overworld & Content-Struktur

### Overworld-Map
- **2 aktive Fächer** (z.B. Mathe, Physik)
- **Weitere Fächer:** Angezeigt als "Coming Soon" (locked/grayed out)
- Visuelle Darstellung: Karte mit verschiedenen Gebieten

### Dungeons pro Fach
- Pro Fach: **1 spielbarer Dungeon**
- Pro Fach: **2 weitere Dungeons** als "Coming Soon" sichtbar
- Alle spielbaren Dungeons sind **sofort zugänglich** (kein Unlock-System)

### Gegnertypen
- **Identische Gegnertypen** in allen Dungeons
- Unterschied zwischen Fächern: **nur der Aufgaben-Content**
- Später: Fach-spezifische Gegner-Skins/Thematik (Stretch Goal)

---

## 5. AI-Content-System

### Aufgaben-Format
- **Multiple Choice mit 4 Optionen**
- Keine Texteingabe (würde Flow stören)
- Strukturiertes Format für AI-Generation

### Content-Generation-Strategie
1. **Pre-Generated Pool:**
   - Vor Spielstart: AI generiert einen Pool von Aufgaben pro Dungeon (z.B. 100 Aufgaben)
   - Aufgaben werden aus Pool gezogen (kein Live-API-Call im Spiel)
2. **Auto-Nachgenerierung (Optional für MVP):**
   - Wenn Pool unter Schwellwert fällt → Background-Job generiert neue Aufgaben nach
   - Kein Blocking des Spielflusses

### Content-Verwaltung
- JSON/Datenbank mit Aufgaben-Struktur:
  ```json
  {
    "subject": "Mathe",
    "dungeon": "Grundrechenarten",
    "difficulty": 5,
    "question": "Was ist 45 × 12?",
    "options": ["540", "450", "550", "640"],
    "correct_index": 0
  }
  ```
- Community-Driven-Content später möglich (User können Aufgaben einreichen)

---

## 6. Feature-Abgrenzung (Was kommt NACH dem MVP)

### Meta-Progression-System (Post-MVP)
- Permanente Items zwischen Runs
- Gold als Persistent Currency
- Permanentes Level-System pro Fach
- Shop im Hauptmenü

### Erweiterte Dungeon-Features (Post-MVP)
- Shop-Räume (kaufe Buffs mit Run-Gold)
- Treasure-Räume (Free Loot)
- Boss-Räume als Meilensteine
- Unlock-System für Dungeons (Progression-Gates)

### Erweiterte Combat-Features (Post-MVP)
- Komplexes Damage-System (beide greifen an, Timing beeinflusst Schaden-Ratio)
- Taktische Item-Effekte (Shields, Mana, Abilities)
- Ressourcen-Management (HP-Potions, Energy)
- Fach-spezifische Gegnertypen

### Content-Expansion (Post-MVP)
- Weitere Fächer (Deutsch, Englisch, Geschichte, etc.)
- Klassenstufen-System (1-12)
- Mehr Dungeons pro Fach (Unterkategorien)
- Live-Content-Generierung (Aufgaben während des Spiels generiert)

---

## 7. Erfolgs-Kriterien für den MVP

### Funktional
✅ Spieler kann einen Full-Run machen (Start → Tod)
✅ Combat-Loop fühlt sich gut an (Aufgabe lösen → Feedback → nächster Raum)
✅ Progression ist spürbar (Level-Ups, neue Item-Slots, stärkere Items)
✅ Schwierigkeit steigt merkbar (Gegner werden herausfordernder)
✅ Overworld-Navigation funktioniert (Fach wählen → Dungeon starten)

### User Experience
✅ "One more run"-Gefühl entsteht (Spieler will nach Tod nochmal starten)
✅ Taktische Entscheidungen sind relevant (Raumauswahl, Item-Management)
✅ Aufgaben fühlen sich wie "Combat" an, nicht wie "Lernen"

### Technisch
✅ AI-Content-Pipeline funktioniert (Aufgaben werden generiert und geladen)
✅ Balancing ist "gut genug" (kein Perfect-Balance, aber spielbar)
✅ Codebase ist erweiterbar (weitere Fächer/Features leicht hinzufügbar)

---

## 8. Offene Fragen für nächste Phase

- **Tech-Stack:** Web (React/Phaser)? Desktop (Unity/Godot)? Mobile?
- **Art-Style:** Pixel-Art? Low-Poly 3D? UI-fokussiert mit minimaler Animation?
- **Deployment:** Wo wird der MVP gehostet/getestet?
- **Testing:** Welche Zielgruppe testet den MVP? (Familie, Freunde, Schule?)
- **Metrics:** Was tracken wir? (Run-Länge, User-Retention, Aufgaben-Accuracy?)

---

## Status
🎯 **MVP-Scope definiert** - Bereit für Tech-Stack-Entscheidung und Implementation Planning
