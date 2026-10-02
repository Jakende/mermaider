# Mermaider 1.8.7 – Releasekandidat

Status: Native MIT-Kandidaten und Appwrite-Liveprüfung sind erfolgreich;
Ein erfolgreicher macOS-Praxistest ist vom Nutzer bestätigt; Windows-Abnahme,
Signierung und Releaseveröffentlichung stehen aus. Der Kandidat ist nicht veröffentlicht. Manifestversionen sind auf
1.8.7 abgestimmt. Eine erste Jev-/Laya-Entscheidungsansicht ist als Preview enthalten; Qualitätsabnahme und Laya-Web-CORS bleiben offen.

## Vorgesehene Release Notes

- Schnellere Vorschau mit koordinierter Rendering-Warteschlange und kürzerer
  Eingabeverzögerung. Überholte Ergebnisse werden verworfen, Syntaxfehler
  abgefangen, unnötige Layoutberechnungen bei Zoom und Pan vermieden.
- Verbesserte visuelle Bearbeitung für Inline-Knoten, Kantenketten und parallele
  Kanten. Umbenennen und Löschen erhalten andere Knoten und unterstützte Formen.
- Gespeicherte Diagramme und ältere Chat-Historien werden vor dem ersten
  Speicherzugriff wiederhergestellt.
- Native API-Schlüssel verwenden auf macOS und Windows den Systemschlüsselspeicher.
- Korrigierte MCP-Eingabeschemas und transparente Prüfung des Diagramm-Einstiegs.
- Aktualisierte Abhängigkeiten und automatisierte Web-/Desktop-Releaseprüfungen.
- MIT-Lizenz in LICENSE, README und Manifesten abgestimmt; bestehende Fremd-
  Copyright-Hinweise bleiben erhalten.

## Gemeinsamer Bereitstellungsablauf

1. PR mit diesem Stand erstellen. `Build Web` und `Build Desktop Candidates`
   müssen erfolgreich sein. Native Kandidaten sind ausdrücklich unsigniert,
   nach Architektur benannt und enthalten SHA256SUMS.txt.
2. Kandidaten aus den Workflow-Artefakten laden; untenstehende Abnahme auf
   macOS Apple Silicon und Windows x64 durchführen. Prüfresultate festhalten.
3. Appwrite-Projekt/Site prüfen und das Actions-Secret `APPWRITE_API_KEY`
   hinterlegen. Endpoint sowie Projekt-/Site-ID sind im Deploymentjob konfiguriert.
   API-Schlüssel direkt in GitHub eintragen; nicht im Chat oder Repository.
   Die früheren ungenutzten `VITE_APPWRITE_*`-Platzhalter wurden entfernt.
4. Nach bestandenen Prüfungen PR mergen. Deploymentworkflow auf main läuft
   nach erfolgreicher Webprüfung. Aktive Appwrite-Deployment-ID und Live-URL
   prüfen; Browser-Abnahme auf dieser HTTPS-URL wiederholen.
5. Signierung für macOS/Windows festlegen. Unsignierte Kandidaten sind kein
   Nachweis für eine signierte Distribution. Für den finalen Release Signierung
   einrichten oder unsignierten Status eindeutig in den Release Notes angeben.
6. Erst nach Abnahme Tag `v1.8.7` auf den geprüften Commit setzen. Der Release-
   Workflow baut Apple-Silicon-DMG und Windows-x64-NSIS in einen gemeinsamen Draft.
   Installer-Prüfsummen, Release Notes und Signierungsstatus ergänzen, dann
   veröffentlichen. Öffentliche Downloads benötigen eine öffentliche Quelle.

## Native Abnahme – je Zielsystem ausfüllen

Am 02.10.2026 meldete der Nutzer zum zuvor angefragten Installations-,
Schlüssel-Neustart- und SVG-/PNG-/PDF-Exporttest: „Es scheint alles funktioniert
zu haben. Betriebssystem: MacOs“. Dies ist eine positive macOS-Praxisrückmeldung.
Einzelresultate, genaue OS-Version, Architektur und verwendeter Installer wurden
nicht separat angegeben. Die detaillierten Prüfungen unten bleiben daher bis
zur jeweiligen Einzelbestätigung offen; insbesondere Providerverbindungen,
Schlüssellöschung und Signierung sind durch diese Rückmeldung nicht geprüft.

| Prüfung | macOS Apple Silicon | Windows x64 |
| --- | --- | --- |
| Installation und erster Start | offen | offen |
| Textänderung, Visual Edit und Syntaxfehler-Recovery | offen | offen |
| Import, SVG-, PNG- und PDF-Export | offen | offen |
| Tabs und Chat nach vollständigem Neustart | offen | offen |
| Schlüssel speichern, Neustart, wiederherstellen und löschen | offen | offen |
| OpenAI-Verbindung mit eigenem Schlüssel | offen | offen |
| Ollama-Verbindung zum lokalen Server | offen | offen |
| Signierung und Installationshinweise | offen | offen |

Pro Ergebnis OS-Version, Architektur, Commit, Installername und Prüfsumme notieren.
Kein Test benötigt Schlüssel in einem Prüfbericht. Bei Fehlern Logs ohne Secrets
festhalten und den Kandidaten korrigieren; keine fehlgeschlagene Abnahme abhaken.

## Appwrite-Abnahme

- Statische Site und korrekter regionaler Endpoint; Projekt-ID und Site-ID
  gehören zusammen. Deployment-Key hat die benötigten Site-/Deployment-Rechte.
- Genau ein Deployment-Weg aktiv: Actions lädt fertiges dist hoch. Install/Build
  sind `true`, Output ist `.`. Parallele Git-Autodeployments entsprechend abstimmen.
- Uploadstatus, fertiger Build und tatsächlich aktive Deployment-ID prüfen.
- Live-URL: Editor/Monaco, Diagrammänderung, Fehler-Recovery, Reload-Persistenz,
  SVG/PNG/PDF-Download, Diagrammhilfe und Providerverbindung prüfen.
- Eigene Domain/DNS/HTTPS separat bestätigen. Eine angenommene Live-Domain
  oder ein angenommener Endpoint wird nicht als geprüft gewertet.

## Noch benötigte externe Angaben

Appwrite-Endpoint, IDs und API-Key sind konfiguriert und im echten Deployment
bestätigt. Die macOS-Praxisrückmeldung liegt vor. Noch benötigt werden Windows-Testresultate
und die verbleibenden Einzelprüfungen sowie eine Entscheidung über Signierung
und öffentliche Downloadquelle.

## Bestätigte Bereitstellung

Öffentliche App: https://mermaider.appwrite.network/

Deployment `6abe36b399fd937b46ec` ist fertig und aktiv. Alle drei Live-
Browsertests bestanden am 01.10.2026. Native MIT-Kandidaten für Apple Silicon
und Windows x64 wurden erfolgreich gebaut und ihre Prüfsummen kontrolliert.
Das ersetzt keine Installations-, Credential- und Providerprüfung auf Zielsystemen.

## Quellcode-Bereinigung und Attribution vom 02.10.2026

Die ungenutzte historische Kopie und Konfigurationshelfer wurden entfernt.
Jakob Endemann und Dario Novoa Vergara sind als Autoren genannt; vorhandene
Fremdhinweise bleiben erhalten. Der Projektverantwortliche bestätigte eine
MIT-Freigabe für die übernommenen Dario-Beiträge. Lizenzgrundlage und Prüf-
umfang sind in [SOURCE_PROVENANCE.md](SOURCE_PROVENANCE.md) dokumentiert.
Das Repository bleibt privat; Release und Downloads sind nicht veröffentlicht.

## Web- und Entscheidungsprovider vom 02.10.2026

Lokale Hilfsdateien wurden entfernt. Ollama wird direkt angesprochen; die
Einstellungen erklären macOS-Originfreigabe und Browser-Netzberechtigung.
OpenAI-API-Zugriff und Jev laufen im Web über die auf Appwrite bereitgestellte
Funktion. Web-Kontoanmeldung über den Codex-Client ist deaktiviert; native
Anmeldung und Systemschlüsselspeicher bleiben erhalten.

Die dynamische Entscheidungs-Preview unterstützt bearbeitbare Fragen und
Antworten, Folgefragen, KI-Strukturentwürfe, Live-Vorschläge und optionales
Auto-Follow. Sitzungen und Undo sind lokal pro Tab persistent. Auswahl wird per
SVG-Overlay ohne neues Mermaid-Layout dargestellt. Ein lokaler Blobatar-Avatar
bleibt pro Browserprofil stabil. Details: [DYNAMIC_DECISIONS.md](DYNAMIC_DECISIONS.md).

OpenAI-, Jev- und Embedding-Zugriff sind vom Nutzer bestätigt. Qualität der neuen
Planung und Laya-Web-CORS sind keine erledigten Release-Abnahmen. Tests und
Live-Befunde werden im PR mit der geprüften Commit-ID dokumentiert.
Betriebs-/Streaminggrenzen: [BROWSER_AI.md](BROWSER_AI.md).

## Visuelle Überarbeitung vom 02.10.2026

File-/View-Menüs, vier getrennte Einstellungsbereiche, bewegte persönliche
Blobs, Tastatur-/Dialogfokus und ein angepasster mobiler Arbeitsbereich sind
umgesetzt. Die bestehenden KI-, Export- und Entscheidungsfunktionen bleiben
vorhanden. Diagrammbeschriftungen passen ihren Kontrast an das Farbschema an.
Bedienung und Speicherverhalten: [WORKSPACE_UI.md](WORKSPACE_UI.md).

Release-Konsistenz, ESLint, TypeScript/Vite, 43 Logiktests und 19 lokale
Chromiumfälle sind geprüft; ein zusätzlicher echter Gateway-Healthtest läuft
nur nach der Bereitstellung. Die vier neuen Browserfälle prüfen insbesondere
320-Pixel-Layout, vollständige Menüs, unabhängige Embeddings, Fokusführung,
Blob-Bewegung/Identität und Diagrammkontrast. Echte Modellqualität bleibt Teil
der laufenden Nutzerabnahme.
