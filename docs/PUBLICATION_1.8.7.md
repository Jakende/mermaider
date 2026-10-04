# Veröffentlichung von Mermaider 1.8.7

Stand: 05.10.2026. Der Nutzer hat beide aktuellen Installer auf Windows und macOS
abgenommen und die öffentliche Veröffentlichung von Repository und Installern
ausdrücklich autorisiert. MIT und bestehende Fremdhinweise bleiben erhalten.

Übergabe für neue Arbeitsumgebungen, einschließlich Wiederherstellung fehlender
lokaler Artefakte: [NEXT_SESSION_1.8.7.md](NEXT_SESSION_1.8.7.md).

Die öffentliche Veröffentlichung ist abgeschlossen. Repository und Release sind
anonym erreichbar; beide Installer wurden öffentlich heruntergeladen und erneut
mit den abgenommenen SHA-256-Werten verglichen. Alle sechs Release-Assets sind vorhanden.

- Repository: https://github.com/Jakende/mermaider
- Release: https://github.com/Jakende/mermaider/releases/tag/v1.8.7
- App: https://mermaider.appwrite.network/
- Website: https://mermaider.appwrite.network/website/
- macOS ARM64: https://github.com/Jakende/mermaider/releases/download/v1.8.7/Mermaider_1.8.7_aarch64.dmg
- Windows x64: https://github.com/Jakende/mermaider/releases/download/v1.8.7/Mermaider_1.8.7_x64-setup.exe

Release-ID: `403236834`. Tag `v1.8.7` verweist auf den abgenommenen Desktop-Commit
`4108f4083e1e8311c37b7672d16f6426ac2bea48`. Beide Installer bleiben unsigniert.
Der Nutzer hat die blockierten GitHub-Schritte lokal mit dem geprüften Paket
abgeschlossen; danach wurden alle externen Veröffentlichungsschritte verifiziert.
Die vorherigen Upload-/Sichtbarkeitsfehler sind für diesen Abschluss erledigt.

Appwrite-Deployment `6ac2d72bad273d52be1f` ist bereit und aktiv. HTML und referenzierte
JS-/CSS-Dateien von App und Website stimmen anonym bytegenau mit dem lokalen
Node-20-Build überein. Das Live-Downloadmanifest enthält die geprüften Release-URLs,
`published: true` und `signed: false`. Manifest-Commit:
`ccef7f1edb6d5352e54a74d84f21dff98f49121b`.

Der tatsächlich gebaute Webquellstand bleibt
`a362a57654c1817e76e2772907554787fe2718e5`; die Toolbar-Anpassung ist Web-only.
Releasechecks, ESLint, TypeScript/Vite, 54 Logiktests und sechs
Offline-Veröffentlichungstests bestehen. Das lokale `publication-state.json`
bestätigt `completed: true`, `repositoryPublic: true`, `releasePublished: true`
und `webDeployed: true`.

Sieben Repository-Workflows bleiben pausiert; es wurden keine neuen Actions-Builds
zur Veröffentlichung gestartet. Pausierte IDs: `371965644`, `371965645`, `373058894`,
`229726543`, `373053762`, `229726544`, `372034029`. GitHub-verwaltete Copilot-Einträge
sind ausgenommen, da die API deren Deaktivierung verweigert.

## Fertiges Veröffentlichungspaket

Der lokale Ordner `Mermaider_1.8.7_publication` enthält:

- Die unveränderten macOS-ARM64- und Windows-x64-Installer mit SHA256SUMS.txt.
- Release Notes, MIT-Lizenz, Attribution und BUILD_PROVENANCE.json mit getrennten
  Quellen für Desktop, Web und den finalisierten Repository-Stand.
- Den lokal gebauten statischen Webstand im Unterordner `web/`.
- `publish.py`, eine Kopie von `scripts/publish-reviewed-release.py`.

Die SHA-256-Werte und die Herkunft der Desktop-Dateien stehen in
[RELEASE_CLOSEOUT_1.8.7.md](RELEASE_CLOSEOUT_1.8.7.md). Es wird kein neuer nativer
Build ausgelöst. Das Release-Tag `v1.8.7` verweist auf den abgenommenen
Desktop-Quellstand `4108f4083e1e8311c37b7672d16f6426ac2bea48`.

## Zugangskonfiguration der Arbeitsumgebung

Secrets über die Konfiguration der Arbeitsumgebung bereitstellen, nicht im Chat:

| Variable | Benötigter Zugriff |
| --- | --- |
| GH_TOKEN | Jakende/mermaider: Administration für öffentliche Sichtbarkeit, Contents für Releases/Dateien, Actions zum Pausieren der Workflows |
| APPWRITE_API_KEY | Projekt 6abe2e810023326f2b87: Lesen der Site und Lesen/Erstellen ihrer Deployments |

Für API-Aufrufe, Uploads, anonyme Downloadprüfung und Liveprüfung müssen folgende
Hosts in der Netzwerkfreigabe stehen: `api.github.com`, `uploads.github.com`,
`github.com`, `release-assets.githubusercontent.com`, `fra.cloud.appwrite.io` und
`mermaider.appwrite.network`. Credentials werden weder ausgegeben noch im Paket
gespeichert. Eine konfigurierte und als bereit beobachtete Umgebung ist erforderlich.

## Ablauf ohne GitHub-Actions-Builds

Im vorbereiteten Ordner prüft `python3 publish.py` nur die lokalen Dateien.
`python3 publish.py --publish` führt die bereits autorisierte Veröffentlichung aus:

1. Installer, Webdateien, Hauptbranch und API-Zugriffe prüfen.
2. Aktive Actions-Workflows pausieren und ihre IDs in `publication-state.json`
   festhalten, bevor ein Tag oder Release entsteht.
3. Ein Draft-Release anlegen und die bestehenden Installer, Prüfsummen und
   Herkunfts-/Lizenzdateien hochladen. Abweichende vorhandene Assets werden
   nicht überschrieben; ein abweichendes bestehendes Tag wird nicht umgebogen.
4. Repository öffentlich machen, Release veröffentlichen und beide Installer
   anonym herunterladen sowie erneut per SHA-256 prüfen.
5. Erst dann die echten Download-URLs in das Website-Manifest schreiben, mit
   `[skip ci]` im Hauptbranch hinterlegen und den vorhandenen statischen Webbuild
   direkt in Appwrite Sites hochladen.
6. Aktives Appwrite-Deployment, App-Build und öffentliches Downloadmanifest prüfen.

Ein Erfolg wird erst bei `completed: true` im lokalen Protokoll gemeldet.
Bei Teilfehlern beschreibt dieses Protokoll bereits ausgeführte Schritte.
Das unveränderte Paket kann erneut verwendet werden; zwischenzeitliche Änderungen
am Hauptbranch erfordern eine erneute Prüfung. Nach erfolgreicher Veröffentlichung
wird dieser Dokumentationsstand mit Release-URL und Deployment-ID ergänzt.

Die vier Offline-Prüfungen lassen sich im Repository mit
`python3 scripts/test-reviewed-publication.py` ausführen. Sie verwenden keine
echten Zugangsdaten und ersetzen keine externe API-/Liveprüfung.

Die Workflows bleiben wegen des ausgeschöpften Budgets pausiert. Wenn wieder
Budget verfügbar ist, können nur die tatsächlich deaktivierten IDs aus
`pausedWorkflows` mit `disabled: true` in GitHub Actions wieder aktiviert werden.
Das geschieht nicht automatisch im Veröffentlichungslauf.

## Spätere Erweiterungen

Signierte Installer, lokale Laya-Abnahme, Modellkalibrierung und weitere
Entscheidungs-/Performance-Funktionen stehen in der [Roadmap](ROADMAP.md).
Sie sind keine erneuten Abnahmeschritte für die vom Nutzer freigegebenen Dateien.
