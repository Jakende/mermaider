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
Knotenklicks und unverändertes SVG-Layout bei Auswahl. Providerantworten sind
kontrollierte Fixtures. Der Nutzer hat OpenAI-, Jev- und Embedding-Zugriff am
02.10.2026 bestätigt; die Qualität der neuen dynamischen Planung mit realen
Eingaben benötigt eine eigene Abnahme. Lokales Laya und dessen Browser-CORS
bleiben unbestätigt. Die interaktive Oberfläche verwendet Choice-Fragen;
Score/Noul bleiben im Transport verfügbar und benötigen für die Oberfläche
noch explizite Ablaufregeln.
