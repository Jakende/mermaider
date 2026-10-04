# Abnahme der Entscheidungs-Engine

Stand: 04.10.2026. Automatisierte Ablaufprüfung und echte Modellqualität sind
getrennte Ergebnisse. Die Tests verwenden kontrollierte Providerantworten;
sie messen keine Jev-/Laya-Genauigkeit. Persönliche Schlüssel sind in der
Arbeitsumgebung nicht verfügbar. Die echte Qualitätsabnahme bleibt offen.

## Echte deutsche Modellabnahme

Die [vorbereitete Entscheidungsdatei](fixtures/decision-acceptance.de.decision.json)
über Decisions → Save / load flow → Import decision JSON laden. Sie öffnet einen
neuen Tab und enthält Choice, Score und Noul mit deutschen Texten. In Manual
bleiben. Den tatsächlich verwendeten Provider und Modellnamen im Verlauf notieren.
Für jede Zeile den Zustand ersetzen und alle drei Fragen einzeln auswerten.
Für die nächste Frage die vorherige Antwort bewusst übernehmen; die erste Frage
bewertet das Budget, die anderen bewerten die technische und menschliche Freigabe.

| Fall | Live state / update | Erwartetes Budget | Erwartete Freigabe |
| --- | --- | --- | --- |
| A: bestätigt | Das Budget ist freigegeben. Alle Tests sind bestanden. Die verantwortliche Person hat die Veröffentlichung ausdrücklich freigegeben. | Freigegeben | Score High, Noul High |
| B: blockiert | Das Budget wurde abgelehnt. Zwei Tests sind fehlgeschlagen. Die verantwortliche Person hat die Veröffentlichung ausdrücklich abgelehnt. | Abgelehnt | Score Low, Noul Low |
| C: offen | Über das Budget ist noch nichts entschieden. Alle Tests sind bestanden. Die ausdrückliche Veröffentlichungsfreigabe steht aus. | Unklar | Score Unclear; Noul darf keine positive Freigabe behaupten |
| D: Widerspruch | Die Checkliste nennt das Budget freigegeben; die Finanzverantwortliche erklärt es für nicht freigegeben. Alle Tests sind bestanden. Die Checkliste sagt Veröffentlichung freigegeben; die verantwortliche Person sagt Freigabe steht aus. | Unklar | Score Unclear; keine automatische positive Freigabe |
| E: Negation | Das Budget ist nicht freigegeben, sondern ausdrücklich abgelehnt. Es stimmt nicht, dass alle Tests bestanden sind. Die Veröffentlichung wurde nicht freigegeben. | Abgelehnt | Score Low, Noul Low |
| F: irrelevant | Der Entwurf ist blau und enthält fünf Diagrammknoten. | Unklar | Keine erfundene positive Freigabe; Ergebnis von Hand prüfen |

Noul bewertet eine Aussage, keine Freigabeentscheidung. Fehlende Fakten können
je nach Modell auch eine niedrige P(true) ergeben; die Bandgrenzen allein lösen
fehlendes Wissen nicht. Bei offenem oder widersprüchlichem Zustand keine
automatische Freigabe aktivieren. Drei Läufe pro Fall und Modell festhalten:
Rohwert, geroutete Antwort, Verteilung, Provider/Modell und Dauer stehen im Verlauf.
Ein hoher Konfidenzwert ersetzt keine fachliche Prüfung. Das Verhalten bei
Negation, Widerspruch und fehlenden Fakten ist ein Release-Kriterium, keine
bereits bestätigte Fähigkeit.

Zum Schluss Fall A → B → A im selben Tab durchführen. Modellentscheidungen
müssen bei jedem Zustandswechsel verworfen und neu bewertet werden. Manuelle
Entscheidungen bleiben als Referenz erhalten und werden zur erneuten Prüfung markiert.
Fragen in Pfadreihenfolge auswerten und die passende Antwort übernehmen; keine alte
Antwort bestätigen, ohne sie gegen den neuen Zustand zu prüfen. Danach eine Antwort ändern, Undo/Redo ausführen und die Datei exportieren,
neu importieren und auf identische Regeln prüfen.

Ergebnisprotokoll je Provider/Modell:

| Fall / Lauf | Datum | Provider / Modell | Choice | Score / Route | P(true) / Route | Fachlich plausibel? | Dauer / Bemerkung |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | |

## Automatisiert geprüft

- Choice/Score/Noul behalten ihre unterschiedlichen Bedeutungen. Die 80-%-Grenze
  verwendet die gewählte Optionswahrscheinlichkeit; Provider-Konfidenz ist kein Ersatz.
- Score bleibt immer zur Übernahme stehen. Unklares Noul wird nicht automatisch übernommen.
- Branchwechsel entfernen unerreichbare Antworten. Zusammenlaufende Zweige
  verwerfen Modellantworten, wenn sich der vorherige Antwortpfad geändert hat.
- Erneutes Bewerten sendet nur Antworten vor der Zielfrage: kein Selbstbeleg durch
  die alte Antwort, keine nachfolgenden Antworten als Begründung.
- Provider-/Modell-/Endpoint-/Key-/Moduswechsel verwerfen aktuelle Vorschläge.
  Bereits übernommene Entscheidungen und ihr Verlauf bleiben erhalten.
- Ein erneuter Auswertungsversuch entfernt seinen bisherigen Vorschlag sofort.
  Fehlerhafte Antworten und HTTP-Fehler verändern keine Auswahl; erneutes Auswerten
  bleibt möglich. Schnelle Doppelklicks erzeugen keinen zweiten aktiven Aufruf.
- Score und Verteilung müssen bis auf Rundung übereinstimmen. Ungültige Verteilungen,
  fremde Optionen, fehlende Antworten und ungültige Modellmetadaten werden abgelehnt.
- Zustandsänderung und Abbruch verhindern die Übernahme später Modellantworten.
  Auswahl verändert das SVG-Overlay ohne erneutes Mermaid-Layout.

## Verbesserungen aus technisch belegbaren Schwächen

Die Arbeitsumgebung besitzt weiterhin keine persönlichen Modellzugänge; echte Ergebnisse
für A–F sind vom Nutzer angefragt. Es wurden keine realen Modellantworten simuliert oder
als Qualitätsnachweis ausgegeben. Unabhängig davon werden erhaltene manuelle Antworten
nach Ziel-/Zustands- oder vorherigen Pfadänderungen sichtbar zur Prüfung markiert.
Nachfolgende Bewertungen und automatische Übernahmen warten auf diese Prüfung.
Prüfstatus überlebt lokale Wiederherstellung und portable Version-3-Dateien; ältere
Dateiversionen bleiben für Abläufe ohne Prüfmarkierungen verfügbar. Entwürfe zeigen
Strukturänderungen vor der Übernahme; Antwortkarten zeigen ihre Folgefrage.
Die Planungsvorgaben verlangen konkrete Klärungsfragen bei fehlenden oder widersprüchlichen
Fakten. Ob die realen Modelle diesen Vorgaben zuverlässig folgen, bleibt Teil von A–F.

## Noch offen

Echte Jev-/Laya-Modellqualität, Modellkalibrierung, repräsentative individuelle
Anwendungsfälle und Laya-Browser-CORS bleiben separat abzunehmen. Automatische
Übernahme ist opt-in und startet nach Öffnen einer Sitzung deaktiviert. Das
Prüfpaket ist ein erster Release-Abnahmesatz, kein statistischer Qualitätsnachweis.
