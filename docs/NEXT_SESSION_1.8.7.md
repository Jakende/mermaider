# Übergabe: öffentliche Veröffentlichung von Mermaider 1.8.7

Stand: 05.10.2026. Diese Datei liegt im Repository, damit eine neue
Arbeitsumgebung sie ohne Zugriff auf frühere lokale Ordner laden kann.

## Neue Freigabe nach Abschluss von 1.8.7 (05.10.2026)

Der Nutzer hat das Actions-Budget angepasst und Builds sowie die gesamte Erweiterungs-
Roadmap ausdrücklich beauftragt. Das frühere Build-Verbot unten ist historisch und
gilt nicht mehr. Die bestehende 1.8.7-Veröffentlichung und ihr Tag bleiben unverändert.
Neue Erweiterungen werden als 1.9.1 gebaut; aktueller Status: [Roadmap](ROADMAP.md).
Apple-/Windows-Signierung ist noch nicht eingerichtet. Laya richtet der Nutzer selbst
ein; Endpoint und Anleitung werden vorbereitet.

## Auftrag und bestehende Freigaben (historischer 1.8.7-Auftrag)

Der Nutzer möchte Website, Veröffentlichung und Repository abschließen.
Er bestätigt: „auf Windows und auf Mac läuft alles perfekt“ und autorisiert
ausdrücklich: „Repository und abgenommene Installer öffentlich veröffentlichen“.
MIT und vorhandene Fremdattribution bleiben erhalten. Die Freigabe für Darios
übernommene Beiträge ist vom Projektverantwortlichen bestätigt. Keine alleinige
Urheberschaft behaupten und keine erneute Veröffentlichungsfreigabe verlangen.

Das GitHub-Actions-Budget ist ausgeschöpft. Keine neuen Actions-Läufe und keine
neuen Desktop-Installer erzeugen. Commit-/Merge-Nachrichten verwenden `[skip ci]`.
Vor Tag-/Release-Aktionen aktive Workflows wie im Veröffentlichungsskript
pausieren. Lokale Webbuilds sind autorisiert.

## Code und Abnahme

- Repository: `Jakende/mermaider`, Standardbranch `main`.
- PR #2 wurde mit `[skip ci]` zusammengeführt. Codeabschluss:
  `88c44a634ab4f8411654ace21ffe85e6ef11f590`; spätere Übergabeänderungen sind Dokumentation.
- Abgenommener Desktop-Anwendungscode:
  `4108f4083e1e8311c37b7672d16f6426ac2bea48`.
- Native Artefaktquelle: PR-Merge `0e3489953e42c2fd09b94881eed234b34289ccfc`.
  Beide Quellen haben den Git-Dateibaum `445fde549d19877cd783c3fb73b4dd34822301f2`.
- Web-Toolbar-Anpassung: `e3c8d9bdd841ec3f4cabf7c5e3a192a4878d8ddf`, in `main` enthalten.
  Die Diagrammbibliothek sitzt in der oberen Toolbar. Diese Änderung bleibt Web-only,
  bis später wieder ein nativer Build vorgesehen ist.
- Beide Installer sind unsigniert; sie sollen mit klaren Installationshinweisen
  unverändert veröffentlicht werden. Das Tag `v1.8.7` muss zum Desktop-Quellstand
  `4108f4083e1e8311c37b7672d16f6426ac2bea48` gehören.

Der abgenommene Code bestand Releasechecks, Lint, TypeScript/Vite, 54 Node-Tests,
Web-/Native-CI, 49 Browserfälle vor Deployment (3 Skips) und 50 Live-Fälle (2 Skips).
Die Toolbar-/Website-Anpassung bestand lokale Build-/Lint- und betroffene Chromium-
Prüfungen. Vier Offline-Prüfungen des Veröffentlichungsskripts bestehen.
Jev A–F und OpenAI-Planung wurden qualitativ vom Nutzer bestätigt; Decisions bleibt
Preview. Laya-Abnahme und weitere Erweiterungen stehen in `docs/ROADMAP.md`.

## Zugänge und letzter beobachteter Zustand

Der Nutzer hat `GH_TOKEN`, `APPWRITE_API_KEY` und Netzfreigaben in der
Codex-Cloud-Konfiguration veröffentlicht. Die frühere laufende Instanz erhielt
sie jedoch nicht: `APPWRITE_API_KEY` fehlte und der Proxy blockierte API-Verbindungen
mit `403 Forbidden`. Die alte lokale Instanz hat keine öffentliche Veröffentlichung
ausgeführt. Neue Instanzen müssen ihren eigenen Zustand prüfen.

Aktuelle Secret-Bereitschaft und Netzfreigaben über den Cloud-Environment-Status
prüfen, SDK-/CLI-Fehler sachlich diagnostizieren und niemals Secret-Werte ausgeben.
Erforderliche Hosts: `api.github.com`, `uploads.github.com`, `github.com`,
`release-assets.githubusercontent.com`, `fra.cloud.appwrite.io`,
`mermaider.appwrite.network`. Weitere Hosts für signierte Artefakt-Downloadredirects
gegebenenfalls anhand der tatsächlich benötigten Zielhosts freigeben lassen;
Proxy und TLS-Prüfung beibehalten.

Appwrite-Ziel: Endpoint `https://fra.cloud.appwrite.io/v1`, Projekt
`6abe2e810023326f2b87`, Site `6abe2ff1000fd13c6ca6`.
App: https://mermaider.appwrite.network/; Website: `/website/`.
Zuletzt verifizierte aktive Site: `6ac262d4c945c1d52673`; AI-Gateway:
`6ac262bd99aca4704ffe`. Der Toolbar-Patch benötigt keine Änderung am AI-Gateway.

## Dateien zwischen Umgebungen

Frühere absolute Pfade unter `/workspace/mermaider-artifacts/` sind in einer neuen
Instanz nicht automatisch vorhanden. Das gilt für Übergabe, Veröffentlichungspaket,
Installer und den lokal gebauten Webstand. Nicht lediglich nach solchen Pfaden suchen.

Wenn das vollständige `Mermaider_1.8.7_publication.zip` angehängt ist, herunterladen
und entpacken. Falls es fehlt, die vorhandenen abgenommenen Installer über die
GitHub-Actions-Artefakte herunterladen und die SHA-256-Werte prüfen:

| Plattform | Artefakt-ID | Datei | Bytes | SHA-256 |
| --- | --- | --- | --- | --- |
| macOS ARM64 | `11305986662` | `Mermaider_1.8.7_aarch64.dmg` | 6614439 | `495d57a39e63ec33051a3ff7f35f223b8523a799826827703d82c4f7143d844c` |
| Windows x64 | `11306395863` | `Mermaider_1.8.7_x64-setup.exe` | 4979329 | `5a91addd95246b6da604876d0b2c072ae3d9a6c9b4d26344cc2c88c76b9f3aa9` |

Native Workflow-Run-ID: `37209127539`. REST-Downloadpfad:
`GET /repos/Jakende/mermaider/actions/artifacts/{artifact_id}/zip`.
Bei Redirects Credentials nicht an fremde Hosts weitergeben. Wenn die Artefakte
abgelaufen oder nicht verfügbar sind, das vorhandene abgenommene ZIP bzw. diese
Installer vom Nutzer übernehmen; kein neuer nativer Build als Ersatz.

Der Webstand lässt sich mit Node 20, `npm ci` und `npm run build` lokal aus dem
aktuellen geprüften Repository rekonstruieren. Den gesamten `dist/`-Inhalt als
`web/` in einen Veröffentlichungsordner kopieren. `LICENSE`, `ATTRIBUTION.md`,
Release Notes und `scripts/publish-reviewed-release.py` als `publish.py` ergänzen.
Die Release-Notes-Links für den GitHub-Release-Body auf absolute Repository-URLs
umstellen. `SHA256SUMS.txt` enthält die zwei obigen Dateien in der Reihenfolge
macOS, Windows, jeweils `SHA256`, zwei Leerzeichen, Dateiname, Zeilenumbruch.

`BUILD_PROVENANCE.json` muss getrennte Quellen festhalten. Vom Prüfer benötigte Felder:

```json
{
  "version": "1.8.7",
  "desktopCommit": "4108f4083e1e8311c37b7672d16f6426ac2bea48",
  "repositoryCommit": "<geprüfter aktueller main-Commit, volle SHA>",
  "webSourceCommit": "<tatsächlich lokal gebauter Quellstand>",
  "webFiles": {"<relativer Pfad jeder Datei in web/>": "<SHA-256>"}
}
```

Zusätzlich Artefaktquelle, Desktop-Dateibaum, Run-/Artefakt-IDs, unsignierten Status,
Nutzerabnahme vom 04.10.2026, lokale Prüfungen und Lizenz erfassen. Tatsächliche
Quellen eintragen. Änderungen seit dem Codeabschluss prüfen, nicht blind eine
neue Main-SHA in ein fremdes/älteres Paket schreiben. Reine Dokumentations-
änderungen können nach Prüfung zugeordnet werden; bei Codeänderungen neu prüfen.

## Veröffentlichung abschließen

1. Aktuelle Repository-Sichtbarkeit, Main, Tag, Release, Assets und Websitezustand
   prüfen. Teilweise bereits ausgeführte Schritte berücksichtigen; nichts überschreiben.
2. `python3 scripts/test-reviewed-publication.py` ausführen und das konkrete Paket
   mit `python3 publish.py` prüfen. Das ist ohne externe Schreibzugriffe möglich.
3. Bei bereitstehenden Zugängen `python3 publish.py --publish` ausführen. Das Skript
   prüft Main, pausiert Actions vor Tag-/Release-Aktionen, lädt die abgenommenen
   Dateien hoch und veröffentlicht Repository und Release. Es prüft beide Installer
   anonym per SHA-256, aktiviert erst danach die echten Download-URLs mit `[skip ci]`
   und lädt den fertigen statischen Webstand direkt zu Appwrite hoch.
4. `publication-state.json` dokumentiert Teilschritte. Ein Skripterfolg erfordert
   `completed: true`. Abweichende bestehende Assets oder Tags nicht ersetzen.
5. Aktiven Webbuild, Website-Downloadmanifest, Release und öffentliche Dateien
   verifizieren. `docs/PUBLICATION_1.8.7.md` und die Abschlussdokumentation mit den
   tatsächlichen URLs und Deployment-Nachweisen aktualisieren, mit `[skip ci]`.
6. Dem Nutzer App-/Website-/Release-Links und den tatsächlichen Abschlussstatus
   nennen. Die vorhandene Roadmap weiterverwenden; keine erneute Geräteabnahme fordern.

Weitere Details: [Veröffentlichungsablauf](PUBLICATION_1.8.7.md),
[Abschlussnachweise](RELEASE_CLOSEOUT_1.8.7.md), [Roadmap](ROADMAP.md).

## Neuester Stand: Veröffentlichung abgeschlossen (05.10.2026)

Repository und Release sind öffentlich. Beide Installer wurden anonym heruntergeladen
und mit den dokumentierten SHA-256-Werten geprüft. Tag `v1.8.7` zeigt auf den
abgenommenen Desktop-Commit. Downloadmanifest ist veröffentlicht; Appwrite-Deployment
`6ac2d72bad273d52be1f` ist bereit und aktiv. App-/Website-HTML und referenzierte
JS-/CSS-Dateien entsprechen bytegenau dem geprüften Webstand.
`publication-state.json` bestätigt `completed: true`. Die früheren Blockaden wurden
durch den lokalen GitHub-Abschluss des Nutzers überwunden. Keine neuen Actions-Builds;
sieben Repository-Workflows bleiben pausiert. Details:
[PUBLICATION_1.8.7.md](PUBLICATION_1.8.7.md). Keine Wiederholung der Veröffentlichung nötig.
