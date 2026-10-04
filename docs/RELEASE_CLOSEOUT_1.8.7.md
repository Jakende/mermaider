# Abschlussstand Mermaider 1.8.7

Stand: 05.10.2026. Die Webversion und die Produktwebsite sind bereitgestellt;
der vereinbarte Web-Abschluss ist erfolgt. Beide aktuellen Desktop-Installer
sind vom Nutzer praktisch abgenommen und zur unsignierten öffentlichen
Veröffentlichung freigegeben. Uploadstand: [Veröffentlichung](PUBLICATION_1.8.7.md).

- App: https://mermaider.appwrite.network/
- Website: https://mermaider.appwrite.network/website/
- Geprüfter Anwendungscode: `4108f4083e1e8311c37b7672d16f6426ac2bea48`.
- Web-/Desktop-Artefaktquelle: PR-Merge `0e3489953e42c2fd09b94881eed234b34289ccfc`.
- Beide Commits besitzen denselben Git-Dateibaum: `445fde549d19877cd783c3fb73b4dd34822301f2`.
  Die Zuordnung wurde über die GitHub-Commit- und Vergleichs-APIs geprüft.
  Spätere reine Dokumentationsänderungen ändern diesen Anwendungsstand nicht.

## Nachbesserung aus der Web-/Desktop-Abnahme

Untermenüs schließen nicht mehr bei einem vorübergehend fehlenden Fokusziel und
liegen auch über ausgekoppelten Fenstern. Die Diagrammübersicht ersetzt die lange
Tab-Leiste durch Suche in Namen und aktuellem Mermaid-Code, Codezeilen-Vorschau
und Tastaturnavigation. Vollbild blendet Editor und Werkzeugleisten aus; Chat und
Decisions schweben verschiebbar über dem Diagramm. Desktop nutzt das native
Tauri-Fenstervollbild, Browser die Fullscreen-API mit reduziertem App-Modus als
Fallback. Dialoge bleiben oben; Chat-Entwürfe überleben Auskoppeln, Vollbild und
Wechsel zu Decisions. Bedienung: [Oberfläche](WORKSPACE_UI.md).

Native Vollbildaufrufe sind per kontrolliertem IPC-Test geprüft; dies ersetzt
keinen praktischen Mac-/Windows-Test der neuen Installer.

## Abgeschlossen

| Prüfung | Nachweis |
| --- | --- |
| Releaseversion, Lint, TypeScript/Vite | Web CI `37209127554` erfolgreich |
| Logiktests | 54 erfolgreich |
| Browser-CI | 49 erfolgreich, 3 explizite Skips |
| Bereitgestellte App | 50 Live-Fälle erfolgreich, 2 WebKit-Protokoll-Skips; CI `37209125403` |
| macOS ARM64 / Windows x64 | Beide Builds in CI `37209127539` erfolgreich |
| Installer-Prüfsummen | Neu heruntergeladen; beide SHA-256 entsprechen den CI-Manifesten |
| Appwrite Site | `6ac262d4c945c1d52673` bereit und aktiv |
| Appwrite AI-Gateway | `6ac262bd99aca4704ffe`: Health 200, gesperrtes Ziel 403 |
| OpenAI, Jev, Embeddings | Funktionierende Zugänge vom Nutzer bestätigt |
| Jev `jev-1.13.0`, A–F | Wiederholungen qualitativ vom Nutzer bestätigt; Rohdaten und Grenzen separat dokumentiert |
| OpenAI `openai/gpt-6-luna` | Überarbeitung/Zustandsübernahme bestätigt; nach Kürzung der Planung positive Rückmeldung „das sieht gut aus“ |
| iPhone 16 Pro / Entscheidungsdatei | Mobile Bedienung und Import vom Nutzer bestätigt |
| Lizenz / Attribution | MIT festgelegt, Dario-Freigabe bestätigt; Fremdhinweise erhalten |

Die positive Planungsrückmeldung enthält keine neue vollständige Tabelle.
Sie bestätigt die Überarbeitung qualitativ, keine statistische Modellgüte.
Die Entscheidungs-Engine bleibt Preview; automatische Übernahme startet deaktiviert.

## Aktuelles privates Prüfpaket

| Datei | Bytes | SHA-256 |
| --- | --- | --- |
| `Mermaider_1.8.7_aarch64.dmg` | 6614439 | `495d57a39e63ec33051a3ff7f35f223b8523a799826827703d82c4f7143d844c` |
| `Mermaider_1.8.7_x64-setup.exe` | 4979329 | `5a91addd95246b6da604876d0b2c072ae3d9a6c9b4d26344cc2c88c76b9f3aa9` |

Artefakt-IDs: macOS `11305986662`; Windows `11306395863`; Web `11305054111`.
Das aktuelle Prüfpaket `Mermaider_1.8.7_workspace_4108f40_private-candidate.zip`
enthält beide Installer, das gemeinsame Prüfsummenmanifest,
Release Notes, Attribution und die Quellen-/CI-Zuordnung. Der Web-Build wird
separat als ZIP bereitgestellt. Ältere Prüfpakete werden nicht überschrieben.
Ein späterer Tag-Build erhält eigene Prüfsummen.

## Praktische Abnahme und öffentliche Freigabe

Am 04.10.2026 bestätigt der Nutzer: „auf Windows und auf Mac läuft alles perfekt“.
Diese qualitative Abnahme gilt für die hier aufgeführten Installer. OS-Versionen
und einzelne neue Testprotokolle wurden nicht mitgesendet. Die zuvor offene
aktuelle Mac-/Windows-Abnahme ist damit abgeschlossen.

Der Nutzer autorisiert anschließend ausdrücklich: „Repository und abgenommene
Installer öffentlich veröffentlichen“. MIT und vorhandene Fremdattribution
bleiben erhalten. Die Dateien werden unverändert als unsignierte Version
veröffentlicht; öffentliche Signierung/Notarisierung ist eine spätere Erweiterung.

Die Diagrammbibliothek wird danach in die obere Toolbar verschoben. Diese
kleine Änderung wird lokal für Web gebaut und geprüft; sie ist nicht in den
abgenommenen Desktop-Dateien enthalten. Wegen des ausgeschöpften Actions-Budgets
wird kein neuer nativer Build ausgelöst. Die Veröffentlichung verwendet dieselben
Installer und dieselben Prüfsummen.

Der lokale Toolbar-/Website-Abschluss besteht ESLint und den TypeScript-/Vite-
Produktionsbuild. Die betroffenen Bedienungsfälle (Diagrammsuche, Fokus/Vollbild,
Menüs und mobile Darstellung) und beide Websitefälle bestehen in Chromium.
Die Website wurde nach einer Korrektur auch bei 320 Pixeln und 200 % Schrift
erneut geprüft. Vier Offline-Prüfungen des Veröffentlichungswegs bestätigen
Dateiintegrität, Abbruch bei geändertem Hauptbranch vor Schreibzugriffen und
Credential-Entfernung bei Redirects auf andere Hosts. Der externe Upload selbst
ist durch diese lokalen Prüfungen nicht nachgewiesen.

Lokales Laya/CORS, weitere Modellfälle, Kalibrierung, Signierung und zusätzliche
Plattformen stehen in der [Roadmap](ROADMAP.md). Tatsächliche externe
Upload-/Sichtbarkeitsaktionen und die budgetfreie Übergabe:
[Veröffentlichung](PUBLICATION_1.8.7.md).

## Öffentliche Veröffentlichung am 05.10.2026 abgeschlossen

Repository https://github.com/Jakende/mermaider und Release
https://github.com/Jakende/mermaider/releases/tag/v1.8.7 sind öffentlich.
Beide unveränderten, unsignierten Installer sind anonym heruntergeladen und SHA-256-geprüft.
Tag `v1.8.7` zeigt auf `4108f4083e1e8311c37b7672d16f6426ac2bea48`.
Alle sechs Release-Assets sind vorhanden. Das Downloadmanifest wurde erst nach
Integritätsprüfung veröffentlicht (Commit `ccef7f1edb6d5352e54a74d84f21dff98f49121b`).

Appwrite-Deployment `6ac2d72bad273d52be1f` ist bereit und aktiv. App-/Website-HTML
und referenzierte JS-/CSS-Dateien stimmen bytegenau mit dem geprüften Webbuild überein.
Die Website bietet die echten macOS-/Windows-Downloads mit unsigniertem Status.
Das Veröffentlichungsprotokoll bestätigt `completed: true`.

54 Logiktests, Releasechecks, Lint, TypeScript/Vite und sechs Veröffentlichungstests
bestehen. Keine neuen Actions-Builds; sieben Repository-Workflows bleiben pausiert.
Die zuvor dokumentierten Upload-/Sichtbarkeitsblockaden wurden durch den lokalen
GitHub-Abschluss des Nutzers überwunden. Nachweise und URLs:
[Veröffentlichung](PUBLICATION_1.8.7.md).
