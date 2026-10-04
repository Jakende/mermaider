# Erste fachliche Jev-Abnahme am 04.10.2026

Quelle: Nutzerbericht aus der Web-App, Modellbezeichnung `jev-1.13.0`.
Es handelt sich um sechs Fälle mit jeweils drei Fragen, nicht um drei
Wiederholungsläufe pro Fall. Persönliche Schlüssel und vollständige
Providerantworten liegen der Arbeitsumgebung nicht vor.

Die Bezeichnung A/1 bedeutet Frage 1 von Fall A. Frage 1 ist Choice,
Frage 2 Score, Frage 3 Noul. Die Zahlen wurden im Nutzerprotokoll gemeinsam
in der Spalte „P(true) / Route“ eingetragen; sie haben unterschiedliche Bedeutungen.
Die Werte bei Frage 2 werden anhand des Prüfsatzes als Score, bei Frage 3 als
P(true) eingeordnet. Welches Anzeigefeld die Zahlen bei Choice bezeichnen,
ist nicht bestätigt; sie werden weder als Optionswahrscheinlichkeit noch als
Konfidenz interpretiert.

## Korrigierte Ergebnisse

Antworttexte sind zur Vergleichbarkeit verkürzt; alle Zahlen entsprechen dem
Nutzerbericht. Die zuerst gemeldeten F-Werte waren laut Nutzer ein Versehen
und wurden durch die folgenden Ergebnisse ersetzt. Daraus wird kein nachgewiesener
Modell- oder Anzeigefehler abgeleitet.

| Fall | Choice: gemeldete Antwort | Choice: Zahl, Feld unbekannt | Score / Route | P(true) / Route | Vergleich mit Prüfkriterium |
| --- | --- | --- | --- | --- | --- |
| A: bestätigt | Budget ausdrücklich freigegeben | 1 | 2 / Freigegeben | 0,93 / Freigegeben | Erwartete positive Routen |
| B: blockiert | Budget abgelehnt | 1 | 0 / Blockiert | 0,01 / Blockiert | Erwartete negative Routen |
| C: offen | Budget offen oder widersprüchlich | 1 | 1 / Unklar, prüfen | 0,03 / Blockiert | Keine positive Freigabe; Score bleibt unklar |
| D: Widerspruch | Budget offen oder widersprüchlich | 0,01 | 1 / Unklar, prüfen | 0,03 / Blockiert | Keine positive Freigabe; Widerspruch führt bei Choice/Score zu Unklar |
| E: Negation | Budget ausdrücklich abgelehnt | 1 | 0 / Blockiert | 0,02 / Blockiert | Erwartete negative Routen bei Negation |
| F: irrelevant, korrigiert | Budget offen oder widersprüchlich | 0,02 | 0,92 / Unklar, prüfen | 0,05 / Blockiert | Keine erfundene positive Freigabe |

Die Score-Grenzen im Prüfsatz sind 0,5 und 1,5. Score 0,92 liegt dazwischen
und führt korrekt zu „Unklar / prüfen“. Noul verwendet 0,2 und 0,8; die gemeldeten
Werte entsprechen den angezeigten Routen. Dies bestätigt die Plausibilität dieses
berichteten Durchlaufs, keine allgemeine Genauigkeit oder Kalibrierung.

## Bedeutung für die Engine

- Für diesen Durchlauf ist kein zusätzlicher Modell-Workaround aus Fall F begründet.
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

## Noch fehlende Nachweise

Zwei weitere vollständige Wiederholungen pro Fall und Modell, genaue Feldbezeichnung
bzw. Verteilung der Choice-Ergebnisse, Laufzeiten und vollständige Anfrage-/Antwort-
Zuordnung sind nicht dokumentiert. Eine Zustandsfolge A → B → A im selben Tab ist
noch nicht bestätigt. Die OpenAI-Planungsprüfung, Laya, weitere individuelle
Anwendungsfälle und statistische Modellkalibrierung bleiben separat offen.

Diese Prüfung schließt die erste qualitative Rückmeldung zu Jev, nicht die komplette
fachliche Release-Abnahme. Die [Abnahmeanleitung](DECISION_ACCEPTANCE.md) bleibt maßgeblich.
