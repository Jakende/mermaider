# Abschluss und Abnahmegrenzen: Mermaider 1.9.1 Preview

Stand: 05.10.2026. Die Roadmap-Erweiterungen sind implementiert, geprüft und in der
Web-App aktiv. Neue unsignierte macOS-ARM64-/Windows-x64-Installer sind als
[öffentliche Vorabversion](https://github.com/Jakende/mermaider/releases/tag/v1.9.1)
verfügbar. Die akzeptierte stabile Veröffentlichung 1.8.7 bleibt unverändert;
Website-Downloadmanifest und GitHub-Latest-Stable zeigen weiterhin auf sie.

## Quellen und Ausführung

- Unveränderter Source-Tag `v1.9.1`:
  `3881c60dc41e8097b2a18b8586e32ca04b02b2ff`.
- [Release-CI 37319367489](https://github.com/Jakende/mermaider/actions/runs/37319367489):
  Webprüfung, beide nativen Builds, Lockfile-Prüfung und Draft-Finalisierung erfolgreich.
- [Zusätzliche Plattformen 37319754064](https://github.com/Jakende/mermaider/actions/runs/37319754064):
  Intel-Mac und Linux AppImage/DEB erfolgreich, exakt derselbe Source-Tag.
- [Deployment 37319412449](https://github.com/Jakende/mermaider/actions/runs/37319412449):
  Webprüfung, Gateway, aktive Site und Live-Browserprüfung erfolgreich.
- Site-Deployment `6ac3ab70a54e0e49d1ac`, Gateway `6ac3ab5e76d1cb6228ce`.
- Release-ID `403763117`, `prerelease: true`, `draft: false`.

## Tatsächliche Prüfungen

- Release-Manifeste, Lint, TypeScript/Vite und 62 Node-Tests bestehen.
- Vor Deployment: 53 Browserfälle bestanden, 3 übersprungen.
- Auf der aktiven Site: 54 Browserfälle bestanden, 2 übersprungen.
- Alle 87 öffentlichen Dateien stimmen bytegenau mit CI-Webartefakt `11349228708`
  überein; `_redirects` ist Serverkonfiguration. Beide Sprachen und lazy Chunks geprüft.
- Beide öffentlichen Installer anonym heruntergeladen und per SHA-256 geprüft.
  Lizenz und Attribution sind beigefügt; der Quellnachweis entspricht dem Tag.
- Intel-Mac/Linux-Artefakte heruntergeladen, Quellen, Prüfsummen und Lizenznotizen geprüft.
  Diese Prüfung ist keine Installation auf einem Nutzergerät.
- Rendering: neun frische/cache-basierte Messpaare auf dem Cloud-Referenzsystem.
  Modellbenchmark: Dry-run validiert 54 geplante Choice-Anfragen; keine neue reale Inferenz.

Maschinenlesbare Nachweise: [Release](fixtures/public-release-verification-1.9.1.json),
[Webdateien](fixtures/web-verification-1.9.1.json),
[zusätzliche Plattformen](fixtures/platform-verification-1.9.1.json).

| Datei | Bytes | SHA-256 |
| --- | ---: | --- |
| Mermaider_1.9.1_aarch64.dmg | 7328805 | `27904b023cc3242c0eb3600c97faf7dc1eac8e36760a7446ecf6fab89ef95bec` |
| Mermaider_1.9.1_x64-setup.exe | 5717596 | `579d875be346feca2ebb1b82f622f2b1ed7273036664b4c24da771a3a780cf14` |

Intel-Mac-Artefakt `11349772324`, Linux-Artefakt `11349686597`; 30 Tage Aufbewahrung.
Sie bleiben getrennte Kandidaten und werden nicht als akzeptierte Website-Downloads angeboten.

## Noch extern zu erledigen

Der Nutzer hat keine Signierungszugänge eingerichtet und übernimmt die Laya-Einrichtung.
Deshalb sind Zertifikate, echte Signierung/Notarisierung, reale Laya-/Modellmessungen
und praktische Geräteabnahmen offen. Sie werden nicht durch CI-Tests ersetzt.
[Signierung](SIGNING_SETUP.md), [Laya](LAYA_SETUP.md), [Modellprüfung](MODEL_BENCHMARK.md).

Der neue optionale lokale Relay unterstützt SSE und 180 Sekunden. Der öffentliche
Appwrite-Standardtransport bleibt 50 Sekunden/gepuffert. Ein zusätzlicher öffentlicher
SSE-Dienst und tokenweise Chatdarstellung sind nicht als umgesetzt ausgewiesen.
Details und übrige Grenzen stehen in der [Roadmap](ROADMAP.md).

Der erfolgreiche 1.8.8-Draft bleibt als Zwischenkandidat erhalten und wird durch
1.9.1 supersediert. Tag `v1.9.0` wurde nicht verschoben: seine Releaseprüfung zeigte
einen Reload-Test vor Oberflächenbereitschaft; 1.9.1 wartet auf den geladenen Editor
und erhält zudem Shift-Slash-Shortcuts. 1.9.0 wurde nicht öffentlich released.
