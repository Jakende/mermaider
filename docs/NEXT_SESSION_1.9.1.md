# Nächste Sitzung: Mermaider 1.9.1

Die Web-App, DE-/EN-Website und öffentliche 1.9.1-Vorabversion sind aktiv und geprüft.
Der Nutzer hat das Actions-Budget angepasst und die gesamte Roadmap beauftragt.
Das historische Build-Verbot in der 1.8.7-Übergabe gilt nicht mehr.
Main enthält die Implementierung und Abschlussdokumentation; neue Tags bleiben unverändert.

Quellstand für Desktop/Web: `3881c60dc41e8097b2a18b8586e32ca04b02b2ff`, Tag `v1.9.1`.
Release: https://github.com/Jakende/mermaider/releases/tag/v1.9.1
App: https://mermaider.appwrite.network/
EN-Website: https://mermaider.appwrite.network/website/en/
DE-Website: https://mermaider.appwrite.network/website/
Vollständige Run-/Artefakt-IDs und Prüfgrenzen: [Abschluss](RELEASE_CLOSEOUT_1.9.1.md).

## Für den Nutzer vorbereitet

1. [Laya einrichten](LAYA_SETUP.md): echter lokaler Server auf `http://127.0.0.1:8000`,
   Version 0.3.22, Browser-CORS und Verbindungstest. Nutzer richtet den Server selbst ein.
2. [Modelle messen](MODEL_BENCHMARK.md): DE/EN-Choice-Fälle, A/B/A und Wiederholungen;
   noch keine neuen realen Ergebnisse. Keine Schlüssel im Chat anfordern oder ausgeben.
3. [Signierung einrichten](SIGNING_SETUP.md): noch keine Apple-/Windows-Zugänge vorhanden.
   Manuelle Workflows brechen ohne erforderliche Secrets ab. Kein signierter Build behauptet.
4. Neue Installer auf echten Geräten prüfen. Intel-Mac/Linux-Kandidaten aus Run
   `37319754064` sind 30 Tage verfügbar; Hashes stehen im Abschlussbericht.

## Veröffentlichung später fortsetzen

1.9.1 ist eine öffentliche Vorabversion. Die akzeptierte stabile Version 1.8.7
und ihre Installer wurden nicht ersetzt. Erst nach bestätigter neuer Geräteabnahme
1.9.1 zur stabilen Version machen und `public/website/release.json` umstellen.
Vorher `python3 scripts/verify-public-release.py v1.9.1` ausführen; keine bereits
veröffentlichten Assets ersetzen. Website nach Manifeständerung neu bauen/deployen
und das tatsächliche aktive Deployment prüfen.

Das alte `publish-reviewed-release.py` ist speziell für 1.8.7 und pausiert Workflows;
es ist kein Werkzeug für neue Versionen. Signierte Builds später als neue Version
mit passenden Manifesten, Tag, Signaturnachweisen und neuen Prüfsummen veröffentlichen.
Bestehende öffentliche Tags und unsignierte Dateien nicht überschreiben.

Optionales SSE ist ein lokaler Relay (`npm run gateway:local`, Port 8003).
Appwrite bleibt gepuffert. Ein zusätzlicher öffentlich gehosteter SSE-Dienst benötigt
einen geeigneten Runtime-Host; den lokalen Adapter nicht öffentlich exponieren.
Verlauf, API, Vorlagen, Shortcuts und Rendering sind beschrieben in [Roadmap](ROADMAP.md).
