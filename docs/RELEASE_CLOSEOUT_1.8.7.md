# Abschlussstand Mermaider 1.8.7

Stand: 04.10.2026. Die Webversion und die Produktwebsite sind bereitgestellt;
der vereinbarte Web-Abschluss ist erfolgt. Desktop bleibt ein privater Kandidat.

- App: https://mermaider.appwrite.network/
- Website: https://mermaider.appwrite.network/website/
- Geprüfter Anwendungscode: `a5f92fb78129a518c241098b1d3429db1cce264e`.
- Web-/Desktop-Artefaktquelle: PR-Merge `badc326bbb0abcfd67289d88768c8f9064ce7902`.
- Beide Commits besitzen denselben Git-Dateibaum: `1a74607a9ae4ce453305bfda49badd3faaa04e5f`.
  Die Zuordnung wurde über die GitHub-Commit- und Vergleichs-APIs geprüft.
  Spätere reine Dokumentationsänderungen ändern diesen Anwendungsstand nicht.

## Abgeschlossen

| Prüfung | Nachweis |
| --- | --- |
| Releaseversion, Lint, TypeScript/Vite | Web CI `37198389213` erfolgreich |
| Logiktests | 54 erfolgreich |
| Browser-CI | 42 erfolgreich, 3 explizite Skips |
| Bereitgestellte App | 43 Live-Fälle erfolgreich, 2 WebKit-Protokoll-Skips; CI `37198387877` |
| macOS ARM64 / Windows x64 | Beide Builds in CI `37198389214` erfolgreich |
| Installer-Prüfsummen | Neu heruntergeladen; beide SHA-256 entsprechen den CI-Manifesten |
| Appwrite Site | `6ac237cf27a3d079b3f2` bereit und aktiv |
| Appwrite AI-Gateway | `6ac237b7dc5f48365d60`: Health 200, gesperrtes Ziel 403 |
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
| `Mermaider_1.8.7_aarch64.dmg` | 6615540 | `176085b207d1f19d205935161e7415b3a68d60ec40e89691d1574191c448ea7d` |
| `Mermaider_1.8.7_x64-setup.exe` | 4973838 | `c1058738d6f96e72772e02d89d103733c746264192195a0eec8e3998c787183f` |

Artefakt-IDs: macOS `11301916703`, Windows `11301757190`, Web `11301722288`.
Das datierte Prüfpaket enthält beide Installer, das gemeinsame Prüfsummenmanifest,
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
