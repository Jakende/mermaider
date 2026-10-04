# Fachliche Rückmeldung zur Frageplanung am 04.10.2026

Quelle: Nutzerbericht, Chat-Provider/Modell `openai/gpt-6-luna`. Die vom Nutzer
bezeichneten Fälle A, B und C werden unverändert übernommen; eine vollständige
Zuordnung zu den Zuständen des ursprünglichen Prüfplans liegt nicht vor.

Der Nutzer bestätigt, dass die Überarbeitung eines Ablaufs und die Übernahme
vorheriger Zustände funktionieren. Die Rückmeldung betrifft vor allem die
Formulierung und Aufteilung der vorgeschlagenen Fragen.

| Fall im Bericht | Frageauszug | Gemeldeter Befund |
| --- | --- | --- |
| A | „Sind alle drei Voraussetzungen ausdrücklich und widerspruchsfrei bestätigt: Das Budget ist freigegeben, alle Tests sind bestanden …?“ | Nur eine Frage, mehrere Voraussetzungen und Wiederholung des Zustands. „Erfand eine Freigabe?“ wurde hier mit Nein beantwortet. |
| B | „Sind Budgetfreigabe und ausdrückliche Veröffentlichungsfreigabe bestätigt? Laut aktuellem Update sind alle Tests bestanden.“ | Frage kombiniert Entscheidungen und übernimmt Fakten als zusätzlichen Aussagesatz. |
| C | „Ist die Release-Freigabe anhand der ausdrücklich genannten Fakten eindeutig bestätigt? Alle Tests sind bestanden, aber die Checkliste …“ | Lange Frage mit Zustandszusammenfassung und mehreren Widersprüchen. |

Die vorgeschlagenen Regeln sind Noul; Antwortoptionen beschreiben teilweise
lange zusammengesetzte Bedingungen. Die übrigen fachlichen Bewertungsfelder
im Nutzerprotokoll sind nicht ausgefüllt. Daraus wird keine generelle Behauptung
über erfundene Freigaben, Genauigkeit oder Kalibrierung abgeleitet.

## Ableitung

Eine einzelne Frage ist angemessen, wenn nur eine Entscheidung offen ist.
Mehrere unabhängige Voraussetzungen sollen getrennt behandelt werden, wenn sie
unterschiedliche Antworten oder Folgefragen benötigen. Die Engine soll weder
immer genau eine Frage noch immer drei Fragen erzeugen.

Planungsvorgaben verlangen kurze, neutrale, wiederverwendbare Fragen, keine
Wiederholung des Live-State und kurze Antwortoptionen. Als Richtwerte gelten
120 Zeichen pro Frage und 60 pro Antwort; sie sind keine harten Importgrenzen.
Neue Fragen sollen Choice verwenden. Bestehende numerische Regeln bleiben
verfügbar; eine zusammengesetzte Noul-Frage muss bei einer strukturellen
Überarbeitung nicht unverändert erhalten bleiben.

„Simplify wording“ überarbeitet nur den Text eines Entwurfs. IDs, Reihenfolge,
Startpunkt, Verbindungen, Bewertungsarten, Rubriken und Grenzen werden geprüft;
Änderungen daran werden abgelehnt und der alte Entwurf bleibt erhalten. Bedeutung
und sprachliche Qualität müssen weiterhin vom Nutzer beurteilt werden. Der aktive
Ablauf ändert sich erst nach „Apply draft“. Abbruch verwirft späte Antworten.

## Gezielte erneute Abnahme

Die drei berichteten Planungsfälle mit demselben Chat-Modell wiederholen:
Fragen sollen kurz sein, keine Fakten als Vorspann enthalten und unabhängig
klärbare Entscheidungen trennen. Bei bereits bekannten Fakten soll keine
unnötige Frage entstehen. Einen Entwurf anschließend über „Simplify wording“
vereinfachen und die Bedeutung prüfen. Eine Qualitätsverbesserung des echten
Modells wird erst nach dieser Rückmeldung bestätigt; technische Tests verwenden
kontrollierte Antworten und messen keine sprachliche Modellqualität.
