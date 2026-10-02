# Abschlussstand Mermaider 1.8.7

Stand: 02.10.2026 (Europe/Berlin). App und Website sind bereitgestellt.
Geprüfter Anwendungscode: `446cabe769169f4f261501bdceff03be06d45141`.
Der native PR-Build verwendete `dd5fef90bb671f52c55e913c3bc0bca504c5dea3`;
der Dateibaum ist mit dem geprüften Anwendungscode identisch (`git diff` leer).

## Abgeschlossen

| Prüfung | Nachweis |
| --- | --- |
| Releaseversion, Lint, TypeScript/Vite | Web CI `37063774853` erfolgreich |
| Logiktests | 47 erfolgreich |
| Chromium / mobiles WebKit | 29 erfolgreich, 3 explizite lokale Skips |
| Bereitgestellte App | 30 Live-Fälle erfolgreich, 2 WebKit-Protokoll-Skips; CI `37063770321` |
| macOS ARM64 und Windows x64 gebaut | Beide Jobs in CI `37063775047` erfolgreich |
| Installer-Prüfsummen | Beide heruntergeladenen Dateien entsprechen den CI-Prüfsummen |
| Appwrite Site | `6ac01d7fab398d4ddad3` bereit und aktiv |
| Appwrite AI-Gateway | `6ac01d7073ce30a8d6f9`: Health 200, Loopback-Ziel 403 |
| OpenAI, Jev, Embeddings | Nutzer bestätigt funktionierende Zugänge |
| macOS-Praxisrückmeldung | Nutzer bestätigt früheren Kandidaten; keine neue Installationsabnahme behauptet |
| iPhone 16 Pro | Nutzer bestätigt behobene Bedienungsprobleme |
| Entscheidungsdatei | Nutzer bestätigt Import und funktionierende Bedienung |
| Lizenz / Attribution | MIT festgelegt, Dario-Freigabe bestätigt; Fremdhinweise erhalten |

## Geprüfte Installationsdateien

| Datei | Bytes | SHA-256 |
| --- | --- | --- |
| `Mermaider_1.8.7_aarch64.dmg` | 6614712 | `d9758d20b6b2e21d0212b0c6af538b3db815f8352979e5b13c4b1c37a9e25330` |
| `Mermaider_1.8.7_x64-setup.exe` | 4974159 | `168bf747a418dda04db8aec8ffdd5fea0504d22621394b8418dce56fe9adb0cc` |

Die Dateien stammen aus dem privaten Kandidatenlauf. Die zukünftige Tag-Pipeline
baut erneut; deren Dateien erhalten neue, erneut berechnete Prüfsummen. Es werden
keine Prüfsummen eines früheren Builds als Nachweis für spätere Dateien verwendet.

## Tatsächlich verbleibend

1. Echte Modellqualität: Die Importbestätigung bestätigt nicht automatisch die
   fachlichen Ergebnisse aller sechs Fälle. Prüfsatz: [Entscheidungsabnahme](DECISION_ACCEPTANCE.md).
2. Windows-Praxisabnahme auf einem Windows-Gerät. Ein erfolgreicher CI-Build
   ersetzt Installation, Start, Neustart und Provider-/Schlüsselspeicherprüfung nicht.
3. Developer-ID-Signierung und Apple-Notarisierung, gegebenenfalls Windows-Signierung.
   Ohne diese Einrichtung sind die aktuellen Artefakte nur unsignierte Kandidaten.
4. Öffentliche Distribution: Die frühere Vorgabe verlangt bereinigten Code und
   klare Herkunft. Beiträge anderer Autoren bleiben im Projekt; alleinige
   Urheberschaft wird nicht behauptet. Repository und Downloads bleiben privat,
   bis die Veröffentlichung mit erhaltener Attribution ausdrücklich geklärt ist.
5. Lokales Laya/CORS: als Preview separat offen; nicht als geprüftes Feature bewerben.

## Vorbereiteter Abschluss

[Release Notes](RELEASE_NOTES_1.8.7.md), gemeinsames Prüfsummenmanifest und
privates Paket mit beiden Installern sind vorbereitet. Der Tag-Workflow hält
seinen Release als Draft, prüft beide Installer, berechnet gemeinsame Prüfsummen
und fügt sie mit den Release Notes hinzu. Es wurden keine alten Tags oder
historischen Releases verändert. Öffentliche Downloadlinks bleiben deaktiviert.
