# Veröffentlichung von Mermaider 1.8.7

Stand: 04.10.2026. Der Nutzer hat beide aktuellen Installer auf Windows und macOS
abgenommen und die öffentliche Veröffentlichung von Repository und Installern
ausdrücklich autorisiert. MIT und bestehende Fremdhinweise bleiben erhalten.

Übergabe für neue Arbeitsumgebungen, einschließlich Wiederherstellung fehlender
lokaler Artefakte: [NEXT_SESSION_1.8.7.md](NEXT_SESSION_1.8.7.md).

Die öffentliche Freigabe und das neue Webdeployment sind noch nicht ausgeführt:
Die Arbeitsumgebung meldet keine konfigurierten Secrets und erlaubt die benötigten
API-Hosts derzeit nicht. Die schon bereitgestellte App und Website bleiben unter
https://mermaider.appwrite.network/ und `/website/` erreichbar. Der lokale neue
Webbuild verschiebt die Diagrammbibliothek in die obere Toolbar. Diese Änderung
gehört nicht zu den bereits abgenommenen Desktop-Dateien.

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
