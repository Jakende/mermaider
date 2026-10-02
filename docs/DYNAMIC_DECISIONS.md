# Dynamische Entscheidungen

Stand: 02.10.2026. Die Entscheidungssitzung verbindet drei kleine Schichten:

| Schicht | Aufgabe | Umsetzung |
| --- | --- | --- |
| Planung | Aus Ziel, aktuellem Zustand und Diagramm Fragen, Antworten und Folgefragen vorschlagen | `planner.ts`, generativer Chatprovider aus Settings (OpenAI/Ollama) |
| Auswertung | Vorgegebene Antwortmöglichkeiten anhand des Zustands bewerten | `service.ts`, unabhängig gewählter Jev-/Laya-Provider |
| Ablauf und Darstellung | Auswahl, Verzweigungen, Revisionen und Rückgängig steuern | `flow.ts`, `DecisionWorkspace.tsx`, `overlay.ts` |

## Bedienung

DECISIONS öffnet die Seitenleiste neben dem Diagramm. Ein Klick auf einen
Verzweigungsknoten eines unterstützten freien Flowcharts öffnet sie ebenfalls;
„Use this node as a question“ übernimmt diesen einzelnen Knoten und seine
Antwortmöglichkeiten in einen neuen Tab. Das ist kein vollständiger Mermaid-Import.

Ziel und aktuellen Zustand eingeben, „Generate flow with AI“ wählen, den Entwurf
prüfen und mit „Apply draft“ übernehmen. Alternativ Fragen manuell anlegen.
Fragen, Antworten und Folgefragen lassen sich direkt bearbeiten. Auswahl ist
auch durch Klick auf Antwortknoten im Diagramm möglich. Neue Flows öffnen eigene
Tabs; bestehende freie Diagramme bleiben erhalten.

„Suggest question updates automatically“ erzeugt nach Eingabepausen einen neuen
Entwurf aus Ziel und Zustand. Auch automatisch erzeugte Strukturänderungen
werden vor der Übernahme angezeigt. „Suggest next steps“ berücksichtigt die
gewählte Frage beim Vorschlag weiterer Schritte.

Drei Antwortmodi halten die Oberfläche überschaubar:

- **Manual:** selbst auswählen oder eine Frage ausdrücklich auswerten.
- **Live suggestions:** den aktuellen Schritt nach Änderungen auswerten;
  jede vorgeschlagene Antwort bewusst übernehmen.
- **Auto follow:** eine vorgeschlagene Antwort bei mindestens 80 %
  Optionswahrscheinlichkeit übernehmen und die nächste erreichbare Frage auswerten.
  Andere Antworten bleiben Vorschläge. Maximal 20 Fragen begrenzen einen Ablauf.

Die 80-%-Schwelle ist ein Produktstandard für dieses Preview, keine gemessene
Zuverlässigkeitsgarantie. Sie verwendet die Wahrscheinlichkeit der gewählten
Option, nicht unterschiedlich definierte Provider-Konfidenzfelder. Automatik
startet nach Öffnen der Sitzung immer deaktiviert. Strukturplanung und
Antwortautomatik sind unabhängig und können zusätzliche Modellaufrufe erzeugen.

## Panel, Wiederholen und Dateiaustausch

Der Ziehgriff am linken Panelrand passt die Breite mit Maus, Touch oder Stift an.
Mit fokussiertem Griff vergrößert Pfeil links das Panel, Pfeil rechts verkleinert
es; Home/End wählen die Grenzen. Doppelklick setzt die Breite auf den Standard.
Die gewünschte Breite bleibt lokal gespeichert; kleine Fenster begrenzen sie
vorübergehend. Editor und Vorschau teilen den verbleibenden Platz.

Undo und Redo stellen den gesamten Zustand einschließlich Fragen, Ziel, Update
und Antwortpfad wieder her. Die Revision bleibt aufsteigend; laufende Ergebnisse
werden dadurch ungültig. Beide Aktionen pausieren die Automatik, damit diese die
wiederhergestellte Entscheidung nicht sofort überschreibt. Eine neue Änderung
verwirft den Redo-Zweig. Beide Stapel bleiben nach Reload erhalten (je zehn Schritte).

„Save / load flow“ exportiert eine `.decision.json` mit Ziel, aktuellem Zustand,
Fragen, Antwortmöglichkeiten, Verknüpfungen und ausgewählten Antworten. Keys,
Provider-Einstellungen, Avatar, Ereignisprotokoll und Undo/Redo-Inhalte sind nicht enthalten.
Übernommene Modellantworten enthalten ihre Auswertungsmetadaten.
Das Format trägt `format: mermaider-decision`: Choice-Dateien bleiben Version 1;
Dateien mit Score-/Noul-Regeln verwenden Version 2. Ältere Apps lehnen sie ab,
anstatt numerische Regeln als Choice zu interpretieren. Beide Versionen sind importierbar.

Import öffnet einen neuen Tab mit neuer Sitzungs-ID und deaktivierter Automatik.
Ungültige JSON-Dateien, fremde Versionen, Dateien über 1 MB, beschädigte Graphen
oder unerreichbare Antwortauswahlen werden mit Fehlermeldung zurückgewiesen.
Bestehende Tabs bleiben erhalten. Ändert sich der Zustand während des Dateilesens
oder wird der Tab geschlossen, wird das späte Importergebnis verworfen.

## Daten und Konsistenz

Jeder Tab speichert eine versionierte Sitzung: Ziel, Zustand, Fragen mit stabilen
IDs, Antwortoptionen, Folgefragen und Auswahl einschließlich Herkunft
(manuell/Modell). Bis zu zehn Änderungsschritte unterstützen Undo und werden
zusammen mit der Sitzung lokal gespeichert. Fortlaufendes Tippen bildet einen
Undo-Schritt. Schlüssel gehören nicht in die Sitzung.

Die Struktur ist ein gerichteter Graph ohne Schleifen, mit 1–20 Fragen und
2–12 Optionen je Frage. IDs und Knoten müssen eindeutig sein; Folgefragen müssen
existieren. KI-Entwürfe dürfen keine unerreichbaren Fragen enthalten. Manuell
angelegte Fragen können bis zur Verknüpfung als Folgefragen bereitliegen.

Änderungen einer Antwort verwerfen nicht mehr erreichbare Folgeentscheidungen.
Geänderte Fragen/Antworttexte verwerfen ihre bisherige Auswahl. Neuer Zustand
oder neues Ziel verwirft Modellentscheidungen, erhält menschliche Entscheidungen.
Laufende Ergebnisse sind an die Revision gebunden: Eingabe-, Provider- und
Tabwechsel sowie Schließen verwerfen veraltete Ergebnisse. Browser-Abbruch
beendet das lokale Warten; eine bereits gestartete gehostete Ausführung kann
serverseitig bis zum Timeout weiterlaufen.

Mermaid zeigt die Struktur. Eine Auswahl ändert nur das SVG-Overlay; dasselbe
Diagramm erhält kein neues Layout. Änderungen der Fragenstruktur erzeugen neuen
Mermaid-Code. Freies Bearbeiten dieses Codes löst die verwaltete Verbindung;
die Sitzung kann anschließend wieder in einem eigenen Tab geöffnet werden.

## Persönlicher Blob

Die gewünschte Blobatar-Registry ist über
`npx shadcn@latest registry add @blobatar=https://blobatar.dev/r/{name}.json`
registriert. Die offiziellen MIT-Pakete `blobatar` und `@blobatar/react` sind auf
2.7.0 fixiert. Der React-Adapter benötigt keine zusätzliche UI-Bibliothek.

Ein anonymes lokales Profil erhält eine zufällige ID und einen stabilen Avatar-
Seed. Der Blob wird lokal gerendert und erscheint in Toolbar, Entscheidungspanel
und eigenen Chatnachrichten. Im selben Browserprofil bleibt er über Reloads
identisch. Es gibt noch keine Anmeldung oder Synchronisierung zwischen Geräten;
Löschen des lokalen Speichers erzeugt ein neues Profil. Ohne verfügbaren Speicher
bleibt der Blob während der laufenden App stabil. Lizenzhinweise stehen in
ATTRIBUTION.md und den Website-Credits.

## Abnahme

Automatisierte Tests prüfen Branch-Wechsel, Undo, Persistenz, ungültige Graphen,
veraltete Antworten, Vorschlags-/Automatikmodi, automatische Strukturentwürfe,
Knotenklicks, Panel-Resize/Persistenz, Redo, Datei-Roundtrip, abgelehnte Importe
und unverändertes SVG-Layout bei Auswahl. Providerantworten sind
kontrollierte Fixtures. Der Nutzer hat OpenAI-, Jev- und Embedding-Zugriff am
02.10.2026 bestätigt; die Qualität der neuen dynamischen Planung mit realen
Eingaben benötigt eine eigene Abnahme. Lokales Laya und dessen Browser-CORS
bleiben unbestätigt. Die interaktive Oberfläche verwendet Choice-Fragen;
Score/Noul sind mit expliziten Ablaufregeln in der Oberfläche verfügbar.
Die Qualität dieser numerischen Auswertungen mit echten Providern ist gesondert abzunehmen.

## Score-/Noul-Regeln und Verlauf

Jede Frage bietet „Evaluation type“. Choice verwendet die vorhandenen Optionen.
Score ergänzt eine geordnete Rubrik (erste Stufe = Index 0); Noul bewertet die
Frage als Aussage und liefert P(true). Beide numerischen Varianten brauchen drei
verschiedene Zielantworten: Low, High und Unclear. Die Zuordnungen und Grenzwerte
stehen direkt an der Frage; Rubrik, Grenzwerte und Zuordnungen lassen sich
unter „Rule settings“ bearbeiten. Ein Austausch der Zielantwort
vertauscht nötigenfalls die bisherige Zuordnung, damit die drei Ziele eindeutig bleiben.

Die Regel ist deterministisch: Wert ≤ Low aktiviert Low, Wert ≥ High aktiviert
High, Werte dazwischen aktivieren Unclear. Low muss kleiner als High sein;
Score-Grenzen liegen innerhalb der Rubrik, Noul-Grenzen zwischen 0 und 1.
Entfernte Rubrikstufen passen die Grenzen an die verkürzte Skala an. Änderungen
an Typ, Rubrik oder Regel verwerfen bisherige Auswahlen der betroffenen Frage.

Beispiel: Rubrik 0 = Blocked, 1 = Needs review, 2 = Ready. Mit Low 0,5 und High
1,5 führt Score 1,25 zu Unclear; 1,75 schlägt Ready vor. Der Score ist ein
Erwartungswert, keine Wahrscheinlichkeit. Score-Vorschläge benötigen immer
Übernahme durch den Nutzer, auch im Auto-Follow-Modus.

Für Noul führen die Standardgrenzen 0,2/0,8 zu drei Bereichen. Im Auto-Follow-
Modus benötigen positive Antworten zusätzlich P(true) ≥ 0,8 und negative
Antworten 1 − P(true) ≥ 0,8. Der Zwischenbereich wird niemals automatisch
übernommen. Provider-Konfidenzfelder werden dafür nicht als Ersatz verwendet.
Konfigurierte Grenzen und die Mindestwahrscheinlichkeit wirken gemeinsam.

„Decision history“ zeigt bis zu 50 lokale Ereignisse, neueste zuerst: Zeitpunkt,
Revision, Änderungen, manuelle Auswahl, Modellbewertung, Übernahme und Undo/Redo.
Bei Modellbewertungen bleiben Rohwert, angewandte Regel, Provider/Modell,
Verteilung, originale Konfidenzfelder und Dauer sichtbar. Ziel und Zustand
stehen als Auszüge bis 1.000 Zeichen dabei. Fortlaufendes Tippen wird zusammengefasst;
veraltete oder abgebrochene Modellantworten erscheinen nicht als erfolgreiche Bewertung.

Der Verlauf bleibt nach Reload erhalten und wird durch Undo/Redo nicht gelöscht.
Er ist eine lokale Erläuterung, kein manipulationssicheres Audit und keine vollständige
Wiedergabe früherer Diagrammstrukturen. Ein importierter Ablauf startet mit leerem Verlauf.
Die Dateien teilen den aktuellen Ablauf; das Ereignisprotokoll wird nicht mitexportiert.
