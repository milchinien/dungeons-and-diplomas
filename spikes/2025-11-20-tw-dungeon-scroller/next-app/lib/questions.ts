// Question database types - data now loaded from SQLite via API
export interface Question {
  id: number;
  question: string;
  answers: string[];
  correct: number;
}

export interface QuestionWithElo extends Question {
  elo: number | null;
  correctCount: number;
  wrongCount: number;
  timeoutCount: number;
}

export interface Subject {
  subject: string;
  questions: Question[];
}

export interface QuestionDatabase {
  [key: string]: Subject;
}

// Legacy Question type without ID (for backward compatibility)
interface LegacyQuestion {
  question: string;
  answers: string[];
  correct: number;
}

interface LegacySubject {
  subject: string;
  questions: LegacyQuestion[];
}

interface LegacyQuestionDatabase {
  [key: string]: LegacySubject;
}

// Legacy embedded database - keeping for reference but will be replaced by API
export const QUESTION_DATABASE_LEGACY: LegacyQuestionDatabase = {
  mathe: {
    subject: "Mathematik",
    questions: [
      {
        question: "Was ist die Lösung der Gleichung: 3x + 7 = 22?",
        answers: ["x = 5", "x = 7", "x = 3", "x = 15"],
        correct: 0
      },
      {
        question: "Wie viel ist 15% von 80?",
        answers: ["12", "10", "15", "18"],
        correct: 0
      },
      {
        question: "Was ist die Fläche eines Rechtecks mit den Seiten 8cm und 5cm?",
        answers: ["40 cm²", "26 cm²", "13 cm²", "80 cm²"],
        correct: 0
      },
      {
        question: "Welche Zahl ergibt 2³ × 2²?",
        answers: ["32", "16", "64", "8"],
        correct: 0
      },
      {
        question: "Was ist der Umfang eines Kreises mit Radius 7cm? (π ≈ 3,14)",
        answers: ["43,96 cm", "153,86 cm", "21,98 cm", "49 cm"],
        correct: 0
      },
      {
        question: "Wie lautet die Primfaktorzerlegung von 36?",
        answers: ["2² × 3²", "2 × 3³", "2³ × 3", "6²"],
        correct: 0
      },
      {
        question: "Was ist die Steigung einer Geraden durch die Punkte (2,3) und (6,11)?",
        answers: ["2", "4", "0,5", "8"],
        correct: 0
      },
      {
        question: "Welchen Wert hat x in der Gleichung: x² = 64?",
        answers: ["±8", "8", "32", "4"],
        correct: 0
      },
      {
        question: "Was ist der Median der Zahlenreihe: 3, 7, 9, 15, 21?",
        answers: ["9", "11", "7", "15"],
        correct: 0
      },
      {
        question: "Wie viele Diagonalen hat ein Sechseck?",
        answers: ["9", "6", "12", "15"],
        correct: 0
      }
    ]
  },
  chemie: {
    subject: "Chemie",
    questions: [
      {
        question: "Was ist die chemische Formel für Wasser?",
        answers: ["H₂O", "CO₂", "H₂O₂", "HO"],
        correct: 0
      },
      {
        question: "Wie viele Protonen hat ein Kohlenstoffatom?",
        answers: ["6", "12", "8", "4"],
        correct: 0
      },
      {
        question: "Was ist der pH-Wert einer neutralen Lösung?",
        answers: ["7", "0", "14", "10"],
        correct: 0
      },
      {
        question: "Welches Element hat das Symbol 'Au'?",
        answers: ["Gold", "Silber", "Aluminium", "Argon"],
        correct: 0
      },
      {
        question: "Was entsteht bei der Reaktion von Natrium mit Wasser?",
        answers: ["Natriumhydroxid und Wasserstoff", "Natriumoxid", "Natriumchlorid", "Nur Wasserstoff"],
        correct: 0
      },
      {
        question: "Wie viele Elektronen befinden sich in der äußersten Schale von Sauerstoff?",
        answers: ["6", "8", "2", "4"],
        correct: 0
      },
      {
        question: "Was ist die Summenformel von Kochsalz?",
        answers: ["NaCl", "KCl", "CaCl₂", "NaCl₂"],
        correct: 0
      },
      {
        question: "Welche Art von Bindung besteht zwischen H₂O-Molekülen?",
        answers: ["Wasserstoffbrückenbindung", "Ionenbindung", "Metallbindung", "Kovalente Bindung"],
        correct: 0
      },
      {
        question: "Was ist ein Katalysator?",
        answers: ["Stoff, der Reaktionen beschleunigt ohne verbraucht zu werden", "Stoff, der Reaktionen verlangsamt", "Endprodukt einer Reaktion", "Stoff, der sich vollständig auflöst"],
        correct: 0
      },
      {
        question: "Welche Masse hat ein Mol Kohlenstoff (C)?",
        answers: ["12 g", "6 g", "24 g", "1 g"],
        correct: 0
      }
    ]
  },
  physik: {
    subject: "Physik",
    questions: [
      {
        question: "Was ist die Einheit der Kraft im SI-System?",
        answers: ["Newton (N)", "Joule (J)", "Watt (W)", "Pascal (Pa)"],
        correct: 0
      },
      {
        question: "Wie schnell breitet sich Licht im Vakuum aus?",
        answers: ["300.000 km/s", "150.000 km/s", "500.000 km/s", "100.000 km/s"],
        correct: 0
      },
      {
        question: "Was besagt das erste Newtonsche Gesetz?",
        answers: ["Ein Körper bleibt in Ruhe oder gleichförmiger Bewegung, wenn keine Kraft wirkt", "Kraft = Masse × Beschleunigung", "Actio = Reactio", "Energie bleibt erhalten"],
        correct: 0
      },
      {
        question: "Was ist die Formel für die kinetische Energie?",
        answers: ["E = ½mv²", "E = mgh", "E = mc²", "E = Pt"],
        correct: 0
      },
      {
        question: "Wie groß ist die Erdbeschleunigung?",
        answers: ["9,81 m/s²", "10 m/s²", "8 m/s²", "12 m/s²"],
        correct: 0
      },
      {
        question: "Was ist ein Frequenz von 1 Hertz?",
        answers: ["1 Schwingung pro Sekunde", "1 Meter pro Sekunde", "1 Welle pro Minute", "1 Umdrehung pro Minute"],
        correct: 0
      },
      {
        question: "Welches Gesetz beschreibt den Zusammenhang zwischen Strom, Spannung und Widerstand?",
        answers: ["Ohmsches Gesetz", "Coulombsches Gesetz", "Kirchhoffsches Gesetz", "Faradaysches Gesetz"],
        correct: 0
      },
      {
        question: "Was passiert mit der Wellenlänge, wenn die Frequenz verdoppelt wird?",
        answers: ["Sie halbiert sich", "Sie verdoppelt sich", "Sie bleibt gleich", "Sie vervierfacht sich"],
        correct: 0
      },
      {
        question: "Was ist die Einheit der elektrischen Ladung?",
        answers: ["Coulomb (C)", "Ampere (A)", "Volt (V)", "Ohm (Ω)"],
        correct: 0
      },
      {
        question: "Welcher Aggregatzustand hat das höchste Volumen bei gleicher Masse?",
        answers: ["Gas", "Flüssigkeit", "Feststoff", "Alle gleich"],
        correct: 0
      }
    ]
  }
};
