-- Seed initial questions (30 questions: 10 Mathe, 10 Chemie, 10 Physik)
-- Only insert if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM questions LIMIT 1) THEN
    INSERT INTO questions (subject_key, subject_name, question, answers, correct_index, difficulty) VALUES
    -- Mathematik (10 questions)
    ('mathe', 'Mathematik', 'Was ist die Lösung der Gleichung: 3x + 7 = 22?', '["x = 5", "x = 7", "x = 3", "x = 15"]', 0, 5),
    ('mathe', 'Mathematik', 'Wie viel ist 15% von 80?', '["12", "10", "15", "18"]', 0, 5),
    ('mathe', 'Mathematik', 'Was ist die Fläche eines Rechtecks mit den Seiten 8cm und 5cm?', '["40 cm²", "26 cm²", "13 cm²", "80 cm²"]', 0, 5),
    ('mathe', 'Mathematik', 'Welche Zahl ergibt 2³ × 2²?', '["32", "16", "64", "8"]', 0, 5),
    ('mathe', 'Mathematik', 'Was ist der Umfang eines Kreises mit Radius 7cm? (π ≈ 3,14)', '["43,96 cm", "153,86 cm", "21,98 cm", "49 cm"]', 0, 5),
    ('mathe', 'Mathematik', 'Wie lautet die Primfaktorzerlegung von 36?', '["2² × 3²", "2 × 3³", "2³ × 3", "6²"]', 0, 5),
    ('mathe', 'Mathematik', 'Was ist die Steigung einer Geraden durch die Punkte (2,3) und (6,11)?', '["2", "4", "0,5", "8"]', 0, 5),
    ('mathe', 'Mathematik', 'Welchen Wert hat x in der Gleichung: x² = 64?', '["±8", "8", "32", "4"]', 0, 5),
    ('mathe', 'Mathematik', 'Was ist der Median der Zahlenreihe: 3, 7, 9, 15, 21?', '["9", "11", "7", "15"]', 0, 5),
    ('mathe', 'Mathematik', 'Wie viele Diagonalen hat ein Sechseck?', '["9", "6", "12", "15"]', 0, 5),
    -- Chemie (10 questions)
    ('chemie', 'Chemie', 'Was ist die chemische Formel für Wasser?', '["H₂O", "CO₂", "H₂O₂", "HO"]', 0, 5),
    ('chemie', 'Chemie', 'Wie viele Protonen hat ein Kohlenstoffatom?', '["6", "12", "8", "4"]', 0, 5),
    ('chemie', 'Chemie', 'Was ist der pH-Wert einer neutralen Lösung?', '["7", "0", "14", "10"]', 0, 5),
    ('chemie', 'Chemie', 'Welches Element hat das Symbol ''Au''?', '["Gold", "Silber", "Aluminium", "Argon"]', 0, 5),
    ('chemie', 'Chemie', 'Was entsteht bei der Reaktion von Natrium mit Wasser?', '["Natriumhydroxid und Wasserstoff", "Natriumoxid", "Natriumchlorid", "Nur Wasserstoff"]', 0, 5),
    ('chemie', 'Chemie', 'Wie viele Elektronen befinden sich in der äußersten Schale von Sauerstoff?', '["6", "8", "2", "4"]', 0, 5),
    ('chemie', 'Chemie', 'Was ist die Summenformel von Kochsalz?', '["NaCl", "KCl", "CaCl₂", "NaCl₂"]', 0, 5),
    ('chemie', 'Chemie', 'Welche Art von Bindung besteht zwischen H₂O-Molekülen?', '["Wasserstoffbrückenbindung", "Ionenbindung", "Metallbindung", "Kovalente Bindung"]', 0, 5),
    ('chemie', 'Chemie', 'Was ist ein Katalysator?', '["Stoff, der Reaktionen beschleunigt ohne verbraucht zu werden", "Stoff, der Reaktionen verlangsamt", "Endprodukt einer Reaktion", "Stoff, der sich vollständig auflöst"]', 0, 5),
    ('chemie', 'Chemie', 'Welche Masse hat ein Mol Kohlenstoff (C)?', '["12 g", "6 g", "24 g", "1 g"]', 0, 5),
    -- Physik (10 questions)
    ('physik', 'Physik', 'Was ist die Einheit der Kraft im SI-System?', '["Newton (N)", "Joule (J)", "Watt (W)", "Pascal (Pa)"]', 0, 5),
    ('physik', 'Physik', 'Wie schnell breitet sich Licht im Vakuum aus?', '["300.000 km/s", "150.000 km/s", "500.000 km/s", "100.000 km/s"]', 0, 5),
    ('physik', 'Physik', 'Was besagt das erste Newtonsche Gesetz?', '["Ein Körper bleibt in Ruhe oder gleichförmiger Bewegung, wenn keine Kraft wirkt", "Kraft = Masse × Beschleunigung", "Actio = Reactio", "Energie bleibt erhalten"]', 0, 5),
    ('physik', 'Physik', 'Was ist die Formel für die kinetische Energie?', '["E = ½mv²", "E = mgh", "E = mc²", "E = Pt"]', 0, 5),
    ('physik', 'Physik', 'Wie groß ist die Erdbeschleunigung?', '["9,81 m/s²", "10 m/s²", "8 m/s²", "12 m/s²"]', 0, 5),
    ('physik', 'Physik', 'Was ist ein Frequenz von 1 Hertz?', '["1 Schwingung pro Sekunde", "1 Meter pro Sekunde", "1 Welle pro Minute", "1 Umdrehung pro Minute"]', 0, 5),
    ('physik', 'Physik', 'Welches Gesetz beschreibt den Zusammenhang zwischen Strom, Spannung und Widerstand?', '["Ohmsches Gesetz", "Coulombsches Gesetz", "Kirchhoffsches Gesetz", "Faradaysches Gesetz"]', 0, 5),
    ('physik', 'Physik', 'Was passiert mit der Wellenlänge, wenn die Frequenz verdoppelt wird?', '["Sie halbiert sich", "Sie verdoppelt sich", "Sie bleibt gleich", "Sie vervierfacht sich"]', 0, 5),
    ('physik', 'Physik', 'Was ist die Einheit der elektrischen Ladung?', '["Coulomb (C)", "Ampere (A)", "Volt (V)", "Ohm (Ω)"]', 0, 5),
    ('physik', 'Physik', 'Welcher Aggregatzustand hat das höchste Volumen bei gleicher Masse?', '["Gas", "Flüssigkeit", "Feststoff", "Alle gleich"]', 0, 5);
  END IF;
END $$;
