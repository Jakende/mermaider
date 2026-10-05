# GitHub Actions

Stand 05.10.2026: Das Budget ist angepasst; der Nutzer hat Builds und die gesamte
Roadmap beauftragt. Aktuelle Workflows sind wieder aktiv. Signierung ist mangels
Zertifikaten vorbereitet, wird aber nicht ohne Secrets ausgeführt.

Historischer Ablauf für 1.8.7: Das Actions-Budget war ausgeschöpft. Neue Commits
und der Merge verwenden `[skip ci]`; vor der öffentlichen Tag-/Release-Aktion
pausiert der direkte Veröffentlichungsweg die aktiven Workflows. Die bereits
abgenommenen Installer werden unverändert verwendet. Ablauf und späteres
Wiederaktivieren: [Veröffentlichung](../../docs/PUBLICATION_1.8.7.md).

| Workflow | Trigger | Ergebnis |
| --- | --- | --- |
| `build-web.yml` | PR, Push auf `main`, manuell | Lint, Regressionstests, Chromium-Browsertests und typgeprüfter Webbuild als `mermaider-web-<sha>`, 14 Tage aufbewahrt |
| `deploy-appwrite.yml` | Push auf `main` / `feature/appwrite-sites`, manuell | Upload des fertigen `dist/` nach Appwrite; Aktivierung nach erfolgreichem Appwrite-Build |
| `build-desktop.yml` | PR, manuell | Unsignierte Apple-Silicon-/Windows-x64-Installer samt Prüfsummen, 14 Tage aufbewahrt |
| `release.yml` | Push eines `v*`-Tags oder manuell mit vorhandenem `release_tag` | Native macOS-/Windows-Builds in einem Releaseentwurf |

Zusätzliche manuelle Workflows:
- `build-additional-platforms.yml`: Intel-Mac und Linux AppImage/DEB, getrennte
  Kandidaten mit Prüfsummen, Quellnachweis und Lizenzattribution (30 Tage).
- `build-signed.yml`: Apple-Signierung/Notarisierung und Windows-PFX-Signierung,
  mit Secret-Vorprüfung und Signaturprüfungen (30 Tage).

Der nicht mehr im Repository vorhandene Legacy-Prüfworkflow bleibt deaktiviert.
Die Release-Dateien werden nicht automatisch veröffentlicht. Öffentliche Vorab-
versionen und akzeptierte stabile Downloads werden getrennt gehalten.

Alle Workflows verwenden Node 20 aus `.nvmrc` und `npm ci`.
Der Releaseworkflow prüft zuerst den Webbuild inklusive Browsertests. Ein
zentraler Vorbereitungsschritt erstellt oder verwendet genau einen Draft;
macOS und Windows laden in dessen Release-ID hoch. Veröffentlichten Releases
wird nicht nachträglich hinzugefügt. Versionsabweichungen und falsche Tags
stoppen den Lauf. Native Bundles werden pro Plattform ausgewählt.

Deployment benötigt das Secret `APPWRITE_API_KEY`; der Frankfurt-Endpoint
und die bereitgestellten Projekt-/Site-IDs sind im Deploymentjob konfiguriert. Der Webbuild benötigt keine Deployment-Secrets.
Der Desktopworkflow verwendet `GITHUB_TOKEN`.

Die alte `appwrite/setup-for-appwrite@v2`-Referenz führte zu einem Fehler vor
Checkout und Build. Der lokale Fix installiert CLI 28.1.0 und verwendet
`sites create-deployment`. Ein realer Upload und die Liveprüfung auf mermaider.appwrite.network sind
erfolgreich. Die ergänzte Prüfung unterscheidet Produktionsdomains von
geschützten Previewdomains.

Build und Upload bestätigen keine Live-Aktivierung. Appwrite-Status prüfen;
Desktop-Releases werden weiterhin als Entwürfe erstellt.

Siehe [Bereitstellung](../../docs/DEPLOYMENT.md),
[Projektstand](../../docs/PROJECT_OVERVIEW.md) und [Roadmap](../../docs/ROADMAP.md).

Gemeinsamer Kandidat und Abnahmeliste: [Release 1.8.7](../../docs/RELEASE_1.8.7.md).

`verify-appwrite.yml` prüft das aktive Deployment und die öffentliche App
mit Chromium. Der Deployjob prüft zusätzlich genau die neu hochgeladene ID.
