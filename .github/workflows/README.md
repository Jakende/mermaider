# GitHub Actions

| Workflow | Trigger | Ergebnis |
| --- | --- | --- |
| `build-web.yml` | PR, Push auf `main`, manuell | Lint, Regressionstests, Chromium-Browsertests und typgeprüfter Webbuild als `mermaider-web-<sha>`, 14 Tage aufbewahrt |
| `deploy-appwrite.yml` | Push auf `main` / `feature/appwrite-sites`, manuell | Upload des fertigen `dist/` nach Appwrite; Aktivierung nach erfolgreichem Appwrite-Build |
| `build-desktop.yml` | PR, manuell | Unsignierte Apple-Silicon-/Windows-x64-Installer samt Prüfsummen, 14 Tage aufbewahrt |
| `release.yml` | Push eines `v*`-Tags | Native macOS-/Windows-Builds in einem Releaseentwurf |

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
