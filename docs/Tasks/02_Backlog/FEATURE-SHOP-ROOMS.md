# Feature: Shop-Räume

**Erstellt:** 2025-01-12
**Autor:** Michel Waggoner
**Status:** Backlog

---

## Übersicht

Shop-Räume sind ein neuer Raumtyp im Dungeon, in dem der Spieler Items (Ausrüstung) und Perks (permanente Boni) erwerben kann. Sie bieten eine sichere Ruhezone ohne Gegner und sind ein wichtiger strategischer Anlaufpunkt während der Dungeon-Erkundung.

---

## Aussehen des Shop-Raums

### Das Shop-Schild

Im oberen Bereich des Raumes hängt ein großes, auffälliges Schild mit der Aufschrift **"Shop"**. Das Schild ist stilistisch an das Dungeon-Design angepasst - es sieht aus wie ein altes Holzschild mit mittelalterlicher Schrift, passend zur Fantasy-Atmosphäre des Spiels. Das Schild ist zentriert platziert und sofort sichtbar, wenn der Spieler den Raum betritt.

### Die beiden Tresen

Unterhalb des Schildes befinden sich zwei Verkaufstresen nebeneinander:

**Linker Tresen - Items:**
Der linke Tresen ist für Ausrüstungsgegenstände reserviert. Er besteht aus massivem Holz oder Stein und hat eine breite Oberfläche. Über diesem Tresen schweben die angebotenen Items.

**Rechter Tresen - Perks:**
Der rechte Tresen ist für Perks (Boni/Verbesserungen) reserviert. Er ist optisch ähnlich gestaltet wie der linke Tresen, damit ein einheitliches Bild entsteht. Über diesem Tresen schweben die angebotenen Perks.

Beide Tresen sind solide Objekte - der Spieler kann nicht durch sie hindurchlaufen.

### Schwebende Waren

Über jedem Tresen schweben genau **3 Gegenstände** (also insgesamt 6 Waren pro Shop). Die Waren bewegen sich mit einer sanften, langsamen Auf- und Ab-Bewegung, als würden sie von Magie in der Luft gehalten. Diese Animation macht den Shop lebendig und zieht die Aufmerksamkeit des Spielers auf die Angebote.

Jeder schwebende Gegenstand hat eine farbige Aura, die seine Seltenheit anzeigt (siehe Seltenheitssystem weiter unten).

---

## Items (Linker Tresen)

### Verfügbare Item-Typen

Auf dem linken Tresen können verschiedene Ausrüstungsgegenstände erscheinen:

| Item | Beschreibung |
|------|--------------|
| **Schwert** | Eine Waffe, die den Schaden erhöht, den der Spieler bei korrekten Antworten verursacht |
| **Brustplatte** | Eine Rüstung, die den eingehenden Schaden bei falschen Antworten reduziert |
| **Helm** | Kopfschutz, der die maximalen HP des Spielers erhöht |
| **Schild** | Gibt dem Spieler eine Chance, Schaden komplett zu blocken |
| **Stiefel** | Erhöhen die Bewegungsgeschwindigkeit des Spielers im Dungeon |
| **Amulett** | Ein magisches Schmuckstück mit verschiedenen möglichen Effekten |

### Wie Items funktionieren

Wenn der Spieler ein Item erwirbt, wird es sofort ausgerüstet und der Bonus aktiv. Die genaue Stärke des Effekts hängt von der Seltenheit des Items ab - ein legendäres Schwert macht deutlich mehr Zusatzschaden als ein gewöhnliches graues Schwert.

Items bleiben für die Dauer des aktuellen Dungeon-Durchlaufs aktiv.

---

## Perks (Rechter Tresen)

### Verfügbare Perk-Typen

Auf dem rechten Tresen werden Perks angeboten - permanente Verbesserungen ähnlich wie beim bestehenden Schrein-System:

| Perk | Beschreibung |
|------|--------------|
| **+HP (flach)** | Erhöht die maximalen HP um einen festen Wert (z.B. +10 HP, +20 HP) |
| **+HP (prozentual)** | Erhöht die maximalen HP um einen Prozentsatz (z.B. +10% HP) |
| **+Schaden (flach)** | Erhöht den Basis-Schaden um einen festen Wert |
| **+Schaden (prozentual)** | Erhöht den Schaden um einen Prozentsatz |
| **Regeneration** | Der Spieler regeneriert langsam HP über Zeit |
| **Kritischer Treffer** | Chance, bei korrekter Antwort doppelten Schaden zu verursachen |
| **Zeitbonus** | Gibt dem Spieler zusätzliche Sekunden bei Quiz-Fragen |
| **Extra Leben** | Der Spieler kann einmal bei 0 HP weiterleben und wird wiederbelebt |
| **ELO-Boost** | Verbessert die ELO-Werte des Spielers in allen Fächern |

### Wie Perks funktionieren

Perks werden sofort nach dem Erwerb aktiv und bleiben für den Rest des Dungeon-Durchlaufs bestehen. Im Gegensatz zu Items, die einen bestimmten Ausrüstungsslot belegen, können Perks gestapelt werden - der Spieler kann mehrere Perks gleichzeitig besitzen.

---

## Das Seltenheitssystem

Sowohl Items als auch Perks haben eine von fünf Seltenheitsstufen. Die Seltenheit bestimmt zwei Dinge:
1. **Wie stark der Effekt ist** - seltene Gegenstände sind mächtiger
2. **Wie wahrscheinlich es ist, dass der Gegenstand erscheint** - seltene Gegenstände tauchen viel seltener auf

### Die fünf Seltenheitsstufen

| Stufe | Farbe/Aura | Erscheinungshäufigkeit | Effektstärke |
|-------|------------|------------------------|--------------|
| **Common** | Grau, kein Leuchten | Sehr häufig (~50%) | Schwacher Bonus |
| **Uncommon** | Leichter grüner Schimmer | Häufig (~25%) | Moderater Bonus |
| **Rare** | Deutlicher blauer Glow | Selten (~15%) | Starker Bonus |
| **Epic** | Intensiver violetter Glow | Sehr selten (~8%) | Sehr starker Bonus |
| **Legendary** | Goldener, pulsierender Glow | Extrem selten (~2%) | Extrem starker Bonus |

### Beispiel: HP-Perk nach Seltenheit

Um die Unterschiede zu verdeutlichen, hier ein Beispiel für den "+HP (flach)" Perk:

- **Common (grau):** +5 HP
- **Uncommon (grün):** +10 HP
- **Rare (blau):** +20 HP
- **Epic (lila):** +35 HP
- **Legendary (gold):** +50 HP

Das gleiche Prinzip gilt für alle anderen Items und Perks - die Seltenheit multipliziert den Grundeffekt.

### Visuelle Darstellung der Seltenheit

Die Seltenheit ist sofort erkennbar an der Aura, die den schwebenden Gegenstand umgibt:

- **Common:** Keine Aura, der Gegenstand sieht normal aus
- **Uncommon:** Ein dezentes grünes Leuchten umgibt den Gegenstand
- **Rare:** Ein klares blaues Leuchten, gut sichtbar
- **Epic:** Ein kräftiges violettes/lila Leuchten, sehr auffällig
- **Legendary:** Ein goldenes Leuchten, das sanft pulsiert - unübersehbar

---

## Zugang zum Shop-Raum

### Die verschlossene Shop-Tür

Shop-Räume haben eine besondere Tür, die sich vom normalen Dungeon-Eingang unterscheidet. Diese Tür ist zunächst **verschlossen** und kann nicht passiert werden.

Wenn der Spieler versucht, einen Shop zu betreten, während die Tür noch verschlossen ist:
- Der Spieler prallt an der Tür ab und kann nicht hindurch
- Ein Hinweistext erscheint: "Besiege alle Gegner, um den Shop zu betreten"

### Voraussetzung: Aufgeräumter Raum

Um die Shop-Tür zu öffnen, muss der Spieler den **Raum, aus dem er kommt, vollständig aufräumen**. Das bedeutet:
- Alle Gegner in diesem Raum müssen besiegt sein
- Es dürfen keine lebenden Feinde mehr im vorherigen Raum sein

Sobald diese Bedingung erfüllt ist:
- Die Shop-Tür öffnet sich (eventuell mit einer Animation oder einem Sound)
- Der Spieler kann den Shop frei betreten

### Warum diese Einschränkung?

Diese Mechanik dient mehreren Zwecken:
- Der Spieler kann nicht vor Gegnern in den Shop flüchten
- Es belohnt den Spieler für das Besiegen von Gegnern
- Es schafft einen klaren Gameplay-Loop: Kämpfen → Belohnung im Shop

---

## Der Shop als sichere Zone

### Keine Gegner im Shop

Shop-Räume sind vollständig feindfreie Zonen:

- **Kein Spawning:** Bei der Dungeon-Generierung werden niemals Gegner in Shop-Räumen platziert
- **Kein Betreten:** Gegner, die dem Spieler folgen, stoppen an der Shop-Tür und können nicht eintreten
- **Aggro-Reset:** Wenn ein Gegner den Spieler bis zur Shop-Tür verfolgt hat, verliert er seine Aggression und kehrt in seinen Raum zurück

### Zeit zum Nachdenken

Im Shop hat der Spieler alle Zeit der Welt:
- Er kann die angebotenen Waren in Ruhe betrachten
- Er kann überlegen, welches Item oder welchen Perk er wählen möchte
- Es gibt keinen Zeitdruck und keine Gefahr

Dies ist besonders wichtig nach schwierigen Kämpfen - der Shop bietet eine Verschnaufpause.

---

## Spawn-Verhalten der Shop-Räume

### Häufigkeit

Shop-Räume erscheinen mit einer Wahrscheinlichkeit von etwa **5-10%** anstelle anderer Raumtypen. Das bedeutet:
- In einem durchschnittlichen Dungeon mit 15-20 Räumen gibt es etwa 1-2 Shops
- Shops sind selten genug, um sich besonders anzufühlen
- Aber häufig genug, um im Spielverlauf relevant zu sein

### Einschränkungen

- Der **Startraum** des Spielers ist niemals ein Shop
- Shop-Räume benötigen eine **Mindestgröße**, um Platz für das Layout (Schild, Tresen, Waren) zu haben
- Wenn ein generierter Raum zu klein wäre, wird er kein Shop

### Verteilung im Dungeon

Shops können überall im Dungeon erscheinen - am Anfang, in der Mitte oder am Ende. Die Position ist zufällig und hängt von der Dungeon-Generierung ab.

---

## Interaktion mit dem Shop

### Waren ansehen

Wenn der Spieler sich einem schwebenden Gegenstand nähert, wird dessen Beschreibung angezeigt:
- Name des Items/Perks
- Effekt (was es bewirkt)
- Seltenheit (farblich markiert)

### Waren erwerben

Der Spieler kann eine Ware auswählen, indem er:
- Sich direkt darunter stellt
- Eine Interaktionstaste drückt (z.B. "E" oder "Enter")

Nach dem Erwerb:
- Der Gegenstand verschwindet vom Tresen
- Der Effekt wird sofort auf den Spieler angewendet
- Eine Bestätigung wird angezeigt

### Einmaliger Kauf

Jeder Gegenstand im Shop kann nur einmal erworben werden. Sobald ein Item oder Perk gekauft wurde, ist er weg und der Platz über dem Tresen bleibt leer.

---

## Shop-Inventar

### Generierung der Waren

Wenn ein Shop-Raum erstellt wird, werden seine 6 Waren (3 Items, 3 Perks) zufällig generiert:
- Jedes Item/Perk wird zufällig aus dem Pool möglicher Typen gewählt
- Die Seltenheit wird basierend auf den Wahrscheinlichkeiten bestimmt
- Ein Shop kann also z.B. 2 graue Items und 1 blaues haben

### Persistenz

Das Inventar eines Shops bleibt gleich:
- Wenn der Spieler den Shop verlässt und später zurückkehrt, sind die gleichen Waren noch da
- Nur gekaufte Waren verschwinden dauerhaft

---

## Hinweise zur Umsetzung

- Falls neue Grafiken für Schild, Tresen oder Waren benötigt werden, kann der **Tiled Editor** verwendet werden
- Das Seltenheitssystem orientiert sich an klassischen RPG-Konventionen (wie in Diablo, World of Warcraft, etc.)
- Die Perk-Mechanik kann auf dem bestehenden Schrein-System aufbauen
