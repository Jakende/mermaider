# Webdeployment: Eckgriff für schwebende Decisions

Stand: 06.10.2026. Der Nutzer hat den Webrollout ausdrücklich beauftragt.

Schwebende Decisions-Fenster verwenden wie der Chat den nativen Griff unten
rechts für Breite und Höhe. Das gilt auch im Vollbild. Angedockt bleibt der
seitliche Griff verfügbar. Beim Andocken werden die normale Breite und volle
Arbeitsbereichshöhe wiederhergestellt; Entscheidungszustände bleiben erhalten.

| Nachweis | Ergebnis |
| --- | --- |
| Implementierung | `cc2eba4d0e30b4a1884241771d056613762d2c89` in `main` |
| Deployment-Commit | `1711ee4f6b1a66d989b8ab427d286dbb1acd4223` auf `feature/appwrite-sites`; identischer Dateibaum, nur zusätzlicher Deployment-Marker |
| GitHub-Pipeline | [37523075218](https://github.com/Jakende/mermaider/actions/runs/37523075218), erfolgreich |
| Aktives Appwrite-Deployment | `6ac5544014dbc849be51`, bereit und aktiv |
| Öffentliche App | https://mermaider.appwrite.network/, HTTP 200, erwartete JS-Assets bestätigt |
| Browserprüfung vor Deployment | 53 bestanden, 3 vorgesehene Skips |
| Live-Browserprüfung | 54 bestanden, 2 vorgesehene Skips |

Lokal bestanden ESLint, TypeScript/Vite, die drei vorhandenen Vollbildfälle und
eine direkte Chromium-Bedienungsprüfung des Eckgriffs: 380 × 700 auf 330 × 640
Pixel. Bearbeiten erhält die Größe; Andocken stellt Breite und Höhe wieder her
und erhält den Entscheidungskontext. Die Live-Browserprüfung ersetzt keine neue
native Geräteabnahme.

Der Rollout nutzte die bestehende GitHub-Deploymentpipeline mit ihrem
Repository-Secret, da der alten lokalen Sitzung weiterhin der direkte
Appwrite-Zugang fehlte. Die Pipeline prüfte Webbuild, Gateway und Aktivierung
vor den Live-Tests. Für diese Änderung wurden keine nativen Installer gebaut,
keine Release-Assets ersetzt und keine veröffentlichten Tags verschoben.

Dies ist ein Webupdate nach dem ursprünglichen 1.9.1-Stand. Die Quellzuordnung
und Abnahme der vorhandenen Desktop-Dateien bleiben im
[1.9.1-Abschlussbericht](RELEASE_CLOSEOUT_1.9.1.md) dokumentiert.
