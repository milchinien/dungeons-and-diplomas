## Core Teaching Idea

Die Kernidee für unseren Lernalgorithmus ist, dass wir für jede Frage, die wir uns im Katalog für das Fach haben, einen Schwierigkeitsgrad in Bezug auf den Spieler abspeichern wollen.

Jede Frage hat einen initialen Schwierigkeitsgrad, der vorgegeben ist und den wir im Prinzip anpassen können, indem wir zum Beispiel in regelmäßigen Abständen Durchschnittswerte der Schwierigkeitsgrade der einzelnen Spieler für diese Frage abspeichern. 

Die Schwierigkeitsgrade sollen von 1 bis 10 gehen, wobei 10 das Schwerste ist und 1 das Einfachste ist. 

Und der Algorithmus ist folgender:

Wenn ein Spieler eine Frage falsch beantwortet, dann ist der neue Schwierigkeitsgrad höher, jeweils:

NeuerGrad = AlterGrad + (10-AlterGrad)/2

Umgekehrt bei richtige Beantwortung:

NeuerGrad = AlterGrad - (AlterGrad-1)/2

Aufgerundet und Clamp(1,10)

D.h. wir brauchen eine Mini User Verwaltung (das ist nur ein Spike, Nothing fancy) und dann einen Index für die Fragen.

Ich möchte nicht nur den neuen Schwierigkeitsgrad berechnen sondern auch gleich einen vollständiges Tracking einfügen:

SessionId (zufällige GUID beim Start erstellt), Username, TimeStamp, QuestionId, Answer, Correct? yes/no