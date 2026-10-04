# Abschlussstand Mermaider 1.8.7

Stand: 04.10.2026. Die Webversion und die Produktwebsite sind bereitgestellt;
der vereinbarte Web-Abschluss ist erfolgt. Desktop bleibt ein privater Kandidat.

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

## Verbleibende externe Voraussetzungen

- Aktuelle native Kandidaten praktisch auf macOS und Windows prüfen. Die positive
  Rückmeldung zum früheren Mac-Kandidaten ersetzt keine neue Installationsabnahme;
  ein Windows-Test wurde bisher ausdrücklich verneint.
- Developer-ID-Signierung und Apple-Notarisierung einrichten. Der Nutzer hat noch
  keinen Apple-Developer-Zugang. Windows-Signierung ebenfalls vor öffentlicher
  Distribution klären. Erfolgreiche Builds und Prüfsummen ersetzen diese Nachweise nicht.
- Repository und öffentliche Desktop-Downloads bleiben privat/deaktiviert.
  Herkunft und bestehende Attribution bleiben erhalten; alleinige Urheberschaft
  wird nicht behauptet. Keine Tags, Zusammenführung oder Veröffentlichung erfolgen hier.

Konkrete Übergabe: [Desktop-Abschluss](DESKTOP_RELEASE_HANDOFF.md).
Lokales Laya/CORS, zusätzliche Modellfälle und Kalibrierung bleiben separate
Preview-Arbeit; sie blockieren nicht den vereinbarten gehosteten Web-Abschluss.
[Modellabnahme](DECISION_ACCEPTANCE.md), [Release Notes](RELEASE_NOTES_1.8.7.md).
