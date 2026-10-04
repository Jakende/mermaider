# Erste fachliche Jev-Abnahme am 04.10.2026

Quelle: Nutzerbericht aus der Web-App, Modellbezeichnung `jev-1.13.0`.
Das erste Einzelprotokoll enthält sechs Fälle mit jeweils drei Fragen, nicht
drei Wiederholungsläufe pro Fall. Spätere Wiederholungen sind unten dokumentiert. Persönliche Schlüssel und vollständige
Providerantworten liegen der Arbeitsumgebung nicht vor.

Die Bezeichnung A/1 bedeutet Frage 1 von Fall A. Frage 1 ist Choice,
Frage 2 Score, Frage 3 Noul. Die Zahlen wurden im Nutzerprotokoll gemeinsam
in der Spalte „P(true) / Route“ eingetragen; sie haben unterschiedliche Bedeutungen.
Die ursprünglichen Werte bei Frage 2 wurden anhand des Prüfsatzes vorläufig als
Score, bei Frage 3 als P(true) eingeordnet. Für den neuesten F/2-Bericht hat der
Nutzer inzwischen ausdrücklich „Observed P(true): 0.04“ und „Suggested: Blockiert
· 96% option probability“ bestätigt. Dieses Ergebnis ist Noul, kein Score.
Welches Anzeigefeld die Zahlen bei Choice bezeichnen,
ist nicht bestätigt; sie werden weder als Optionswahrscheinlichkeit noch als
Konfidenz interpretiert.

## Korrigierte Ergebnisse

Antworttexte sind zur Vergleichbarkeit verkürzt; alle Zahlen entsprechen dem
Nutzerbericht. Die zuerst gemeldeten F-Werte waren laut Nutzer ein Versehen
und wurden durch die folgenden Ergebnisse ersetzt. Daraus wird kein nachgewiesener
Modell- oder Anzeigefehler abgeleitet. Eine weitere Nutzerkorrektur ersetzt die
Zahl bei F/2 von 0,92 durch 0,04. Anschließend wurde die aktuelle Anzeige als
Noul-Bewertung mit „Blockiert · 96% option probability“ bestätigt. Die zuvor
gemeldete F/2-Zuordnung „0,92 / Unklar, prüfen“ ist damit überholt.


| Fall | Choice: gemeldete Antwort | Choice: Zahl, Feld unbekannt | Score / Route | P(true) / Route | Vergleich mit Prüfkriterium |
| --- | --- | --- | --- | --- | --- |
| A: bestätigt | Budget ausdrücklich freigegeben | 1 | 2 / Freigegeben | 0,93 / Freigegeben | Erwartete positive Routen |
| B: blockiert | Budget abgelehnt | 1 | 0 / Blockiert | 0,01 / Blockiert | Erwartete negative Routen |
| C: offen | Budget offen oder widersprüchlich | 1 | 1 / Unklar, prüfen | 0,03 / Blockiert | Keine positive Freigabe; Score bleibt unklar |
| D: Widerspruch | Budget offen oder widersprüchlich | 0,01 | 1 / Unklar, prüfen | 0,03 / Blockiert | Keine positive Freigabe; Widerspruch führt bei Choice/Score zu Unklar |
| E: Negation | Budget ausdrücklich abgelehnt | 1 | 0 / Blockiert | 0,02 / Blockiert | Erwartete negative Routen bei Negation |
| F: irrelevant, korrigiert | Budget offen oder widersprüchlich | 0,02 | Kein eindeutig bestätigter Score; neuestes F/2 ist Noul | F/2: 0,04 / Blockiert, 96%; F/3: 0,05 / Blockiert | Keine positive Freigabe; Score-Frage F noch offen |

Die Score-Grenzen im Prüfsatz sind 0,5 und 1,5; Noul verwendet 0,2 und 0,8.
Der zuletzt bestätigte F/2-Wert gehört ausdrücklich zu Noul: P(true) = 0,04
führt bei unveränderten Noul-Grenzen zu „Blockiert“ und zur Optionswahrscheinlichkeit
1 − 0,04 = 0,96. Diese Anzeige ist intern konsistent und stellt keinen
nachgewiesenen Routingfehler dar. Sie ersetzt jedoch keinen bestätigten Score
für die vorgesehene Score-Frage in F. Die Fall-/Fragebezeichnung allein belegt
nicht den tatsächlich verwendeten Bewertungstyp.

Die weiteren gemeldeten Werte bleiben als Nutzerbericht dokumentiert. Zum Zeitpunkt dieser Einzelwerte war der Score-Fall F noch offen. Die spätere
allgemeine Nutzerbestätigung der Wiederholungen ist im folgenden Abschnitt erfasst. Genauigkeit oder
Kalibrierung wurden nicht gemessen.


## Bedeutung für die Engine

- Der neueste F/2-Bericht bestätigt eine konsistente Noul-Anzeige. Ein
  Modell- oder Routing-Workaround ist daraus nicht begründet; die Score-Abnahme
  von Fall F war zum Zeitpunkt dieser Einzelwerte noch separat zu ergänzen.
- Die fachlichen Antwort-Routen des vorbereiteten Abnahmesatzes sind erstmals
  mit echten Nutzerzugängen nachvollziehbar berichtet worden.
- Noul bewertet die Wahrheit einer Aussage. „Nicht ausreichend belegt“ und
  „ausdrücklich abgelehnt“ sind fachlich verschiedene Zustände. Die niedrigen
  Werte in C, D und F erlauben keine Schlussfolgerung, dass eine Person die
  Veröffentlichung ausdrücklich abgelehnt hat. Das Label „Blockiert“ ist hier
  die konfigurierte Route, keine vom Modell nachgewiesene Ablehnung.
- Die Choice-Zahlen mit noch unbekannter Feldbezeichnung erlauben keine Aussage
  über Auto-Follow-Eignung oder Konfidenz. Provider-Konfidenz ersetzt ohnehin
  nicht die Wahrscheinlichkeit der gewählten Option.

## Spätere Nutzerbestätigung am selben Tag

Der Nutzer hat A–F erneut durchgeführt und bestätigt, dass die Ergebnisse passen.
Diese Rückmeldung schließt die zuvor angefragten Wiederholungen als qualitative
Nutzerabnahme; zusätzliche Einzelwerte und genaue Wiederholungszahlen wurden
nicht mitgesendet. Auch der Score-Fall F ist damit im Rahmen der allgemeinen
Erfolgsbestätigung erfasst, ohne dass ein neuer Rohwert dokumentiert wird.

Die OpenAI-Planungsprüfung wurde ebenfalls durchgeführt. Überarbeitung und
Zustandsübernahme funktionieren laut Nutzer; die Formulierung ist jedoch zu
lang und bündelt mehrere Voraussetzungen in einer Frage. Die konkrete
[Rückmeldung und Ableitung](PLANNING_ACCEPTANCE_RESULTS_2026-10-04.md) ist separat dokumentiert.

## Noch fehlende Nachweise

Die zusätzlichen Rohwerte und genaue Anzahl der nun bestätigten Wiederholungen,
Feldbezeichnung bzw. Verteilung der Choice-Ergebnisse, Laufzeiten und vollständige
Anfrage-/Antwort-Zuordnung sind nicht dokumentiert. Eine Zustandsfolge A → B → A im selben Tab ist
noch nicht einzeln bestätigt. Die verbesserten OpenAI-Formulierungen erhielten
anschließend positive qualitative Nutzer-Rückmeldung; eine neue Rohdatentabelle
liegt nicht vor. Laya, weitere individuelle Anwendungsfälle und statistische
Modellkalibrierung bleiben separat offen.

Diese Prüfung schließt die erste qualitative Rückmeldung zu Jev, nicht die komplette
fachliche Release-Abnahme. Die [Abnahmeanleitung](DECISION_ACCEPTANCE.md) bleibt maßgeblich.
