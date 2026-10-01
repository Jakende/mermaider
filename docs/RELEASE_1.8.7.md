# Mermaider 1.8.7 – Releasekandidat

Status: lokal vorbereitet; native CI, Zielsystem-Abnahme und Appwrite-Liveprüfung
stehen aus. Der Kandidat ist nicht veröffentlicht. Manifestversionen sind auf
1.8.7 abgestimmt. Keine Jev-/Laya-Integration in diesem Release.

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

## Gemeinsamer Bereitstellungsablauf

1. PR mit diesem Stand erstellen. `Build Web` und `Build Desktop Candidates`
   müssen erfolgreich sein. Native Kandidaten sind ausdrücklich unsigniert,
   nach Architektur benannt und enthalten SHA256SUMS.txt.
2. Kandidaten aus den Workflow-Artefakten laden; untenstehende Abnahme auf
   macOS Apple Silicon und Windows x64 durchführen. Prüfresultate festhalten.
3. Appwrite-Projekt/Site prüfen und vier Actions-Secrets hinterlegen:
   `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_SITE_ID`, `APPWRITE_API_KEY`.
   API-Schlüssel direkt in GitHub eintragen; nicht im Chat oder Repository.
   Die veralteten `VITE_APPWRITE_*`-Platzhalter konfigurieren kein Deployment.
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

Appwrite-Endpoint, Projekt-/Site-ID und direkt gesetzter GitHub-Secret-Key;
Zielsystem-Testresultate; Entscheidung über Signierung und öffentliche Downloadquelle.
