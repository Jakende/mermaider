# Mermaider bereitstellen

Aktueller Abschluss vom 04.10.2026: App und Website sind bereitgestellt; der
letzte Web-Patch und die öffentliche Distribution verwenden die
[budgetfreie Veröffentlichung](PUBLICATION_1.8.7.md). Der abgenommene native
Quellstand ist `4108f40`; aktive Site `6ac262d4c945c1d52673`, Gateway
`6ac262bd99aca4704ffe`. Beide Installer sind praktisch abgenommen und unsigniert.
Die folgenden historischen Angaben dokumentieren die Einrichtung ab 30.09.2026.

Historischer Ausgangsstand: Commit `b0a673d` wurde nach einem frischen `npm ci` mit
Node 20.20.2 erfolgreich gebaut. Die Anwendung ist eine statische React-SPA;
Editor und Vorschau benötigen kein Backend. AI benötigt einen erreichbaren Provider.

## Webbuild prüfen und übergeben

```bash
# Node 20 verwenden, siehe .nvmrc
npm ci
npm run build
npm run preview -- --host 0.0.0.0 --port 5173
```

Den gesamten Inhalt von `dist/` einschließlich `assets/` und `diagram-docs/`
auf einen statischen HTTPS-Host übertragen. Vite verwendet `base: '/'`;
Hosting unter einem Unterpfad erfordert eine angepasste Basis und die Prüfung
der absoluten Dokumentationspfade. `file://` ist keine unterstützte Startmethode.

Der neue [Build-Web-Workflow](../.github/workflows/build-web.yml) erzeugt bei PRs,
Pushes auf `main` und manuellem Start ein `mermaider-web-<commit>`-Artefakt aus
`dist/`, aufbewahrt für 14 Tage. Er benötigt keine Appwrite-Secrets. Das Budget ist seit 05.10.2026 wieder verfügbar. Neue Builds und das Deployment
von 1.9.1 sind beauftragt; Nachweise stehen im aktuellen Release-Abschluss.

## Appwrite Sites

Die ursprüngliche Pipeline scheiterte vor Checkout und Build, weil
`appwrite/setup-for-appwrite@v2` nicht als Tag existiert. Nachweis:
[Lauf 30946848188](https://github.com/Jakende/mermaider/actions/runs/30946848188),
Job `92118845076`, Log vom 04.08.2026.

Der lokal korrigierte [Deployment-Workflow](../.github/workflows/deploy-appwrite.yml)
installiert `appwrite-cli@28.1.0`. Auch `appwrite deploy sites` wurde ersetzt:
Die installierte CLI hat kein `deploy`-Kommando. Die neuen Befehle und Optionen
wurden gegen die Hilfe der tatsächlich installierten Version geprüft.

Konkretes Ziel (vom Projektinhaber am 01.10.2026 bereitgestellt):

| Konfiguration | Wert |
| --- | --- |
| Endpoint | `https://fra.cloud.appwrite.io/v1` |
| Projekt-ID | `6abe2e810023326f2b87` |
| Site-ID | `6abe2ff1000fd13c6ca6` |
| GitHub Secret `APPWRITE_API_KEY` | Direkt in GitHub hinterlegen; nicht im Repository |

Endpoint und IDs sind im Deploymentjob konfiguriert. Nur der API-Schlüssel
wird als Actions-Secret benötigt. Site, Deployment-Rechte und Live-Zustand wurden in den erfolgreichen
Deployment-Läufen bestätigt. Neue Secrets in der aktuellen Arbeitsumgebung
sind davon unabhängig und für den direkten Veröffentlichungsupload nötig.

Die Ziel-Site muss statisches Hosting verwenden. Hochgeladen wird der
**bereits gebaute** Inhalt von `dist/`; Appwrite-Installations- und Buildkommando
sind deshalb `true`, das Ausgabeverzeichnis ist `.`. Ein erneuter npm-Build
auf diesem Paket wäre falsch, weil es keine Quellen oder `package.json` enthält.

Bei bereits gesetzten Variablen entsprechen die lokalen Befehle dem Workflow:

```bash
npm install --global appwrite-cli@28.1.0
appwrite client \
  --endpoint "$APPWRITE_ENDPOINT" \
  --project-id "$APPWRITE_PROJECT_ID" \
  --key "$APPWRITE_API_KEY"
appwrite sites create-deployment \
  --site-id "$APPWRITE_SITE_ID" \
  --code dist \
  --install-command "true" \
  --build-command "true" \
  --output-directory "." \
  --activate
```

Ein akzeptierter Upload bestätigt noch keine erfolgreiche Aktivierung.
In Appwrite den fertigen Build, die aktive Deployment-ID und die Live-URL prüfen.
Am 01.10.2026 wurde der Kandidat tatsächlich hochgeladen und aktiviert:
Deployment `6abe36b399fd937b46ec`, Adapter `static`. Die öffentliche Anwendung
ist unter **https://mermaider.appwrite.network/** erreichbar (HTTP 200).
Drei Chromium-Browsertests auf der Live-URL bestanden: Editor/Änderungen,
Persistenz und Fehler-Recovery, SVG-Download, alle 17 Diagrammvorlagen und
Visual Edit mit parallelen Kanten. Nachweis:
[Liveprüfung 36849491182](https://github.com/Jakende/mermaider/actions/runs/36849491182).

Automatische Commit-/Branch-Previewdomains verlangen Appwrite-Anmeldung
(`preview_signin`, HTTP 401). Sie sind keine öffentlichen Produktlinks.
Die vorhandene VCS-Anbindung erzeugt weiterhin solche Previews. Der Verifier
prüft deshalb das aktive bzw. ausdrücklich hochgeladene Deployment und dessen
manuelle Produktionsdomains, statt die neueste Preview als Produktion anzunehmen.
Die neue Deploypipeline bestätigt Erfolg erst nach Build, Aktivierung und
Live-Browsertests. Dieser vollständige Ablauf wurde im verlinkten Lauf
erfolgreich geprüft. Der Live-Zustand von `mermaider.com` wurde nicht bestätigt.

Alternativ direkt aus Git bauen: `npm ci`, `npm run build`, Output `dist`,
statischer Adapter. Einen primären Deployment-Weg verwenden, damit Git-Integration
und Actions einander nicht ungeplant überschreiben.

## Browser und AI

Für den Editor ist keine `.env` erforderlich. Provider und Benutzerzugangsdaten
werden in der Anwendung eingestellt. Alle `VITE_*`-Werte sind öffentlich im
Browserbuild sichtbar; keine API-Schlüssel als `VITE_OPENAI_API_KEY` einbauen.

Die alte Anleitung nannte Appname, Version, Analytics und Featureflags.
Die ungenutzten Hilfsfunktionen in `src/utils/env.ts` und die alten Appwrite-
Platzhalter wurden bei der Bereinigung am 02.10.2026 entfernt. `.env.example`
beschreibt jetzt ausschließlich die Trennung von Browser- und Deploymentdaten.

Im Browser läuft Ollama auf dem Rechner des Besuchers, nicht auf dem Hostingserver.
CORS, HTTPS/HTTP-Regeln und Browserberechtigungen für lokale Verbindungen für
die Zielumgebung prüfen. OpenAI, Jev und Embeddings wurden vom Nutzer mit echten Zugängen geprüft.
Monaco wird derzeit über jsDelivr geladen, Fonts über Google; der Webbuild
ist deshalb keine vollständige Offline-Garantie.

## Desktop und öffentliche Downloads

`npm run tauri:build` benötigt Rust/Cargo und die Werkzeuge des jeweiligen OS.
Die abgenommenen v1.8.7-Artefakte sind Apple-Silicon-DMG und Windows-x64-NSIS;
Intel-macOS und Linux sind keine bestätigten Releaseziele.

Die öffentliche Veröffentlichung von Repository und abgenommenen Installern
ist autorisiert. Downloadbuttons werden erst nach erfolgreichem Upload und
anonymer Integritätsprüfung aktiviert. Der tatsächliche Status steht im
Veröffentlichungsprotokoll; alte Draft-Releases bleiben unverändert.

Für 1.8.7 keine neuen Tags/Builds über den Helper auslösen. Die budgetfreie
Übergabe pausiert Actions vor dem Tag-/Release-Schritt und verwendet die
bestehenden Dateien.

Für spätere Versionen: Der [Release-Helper](../.agents/skills/auto-release/scripts/release.cjs) verändert
Versionen, verlangt einen sauberen Arbeitsbaum, prüft Build und Tests, erstellt
Commit und Tag und pusht beides. Er ist kein lokaler Buildcheck. Vorher Änderungen prüfen und die
Voraussetzungen aus [ROADMAP.md](ROADMAP.md) abarbeiten.

Auf der echten Live-URL Editor, Änderungen, Persistenz, Import/Export,
Providerverbindung und öffentliche Downloadlinks prüfen.

## Gehostete AI-Funktion und direkte lokale Provider

Der Webbuild verteilt keine Hilfsdatei. Die Deploymentpipeline prüft den Webbuild,
bereitstellt und verifiziert anschließend `mermaider-ai-gateway`, bevor die neue
Website aktiviert wird. `scripts/deploy-ai-gateway.mjs` erstellt/aktualisiert nur
diese Funktion (Node 22, 60 Sekunden, keine dynamischen Projektscopes, Logging aus),
lädt den Code hoch und prüft die aktivierte Deployment-ID, Browser-Origin,
öffentliche Gesundheitsroute und Ablehnung lokaler Ziele.

Der bestehende `APPWRITE_API_KEY` in GitHub Actions konnte die Funktion erfolgreich
bereitstellen. Kein zusätzliches Providersecret wird benötigt: Nutzer geben ihre
persönlichen API-Keys in der App ein. Öffentliche IDs in browserTransport.ts sind
keine Secrets. API-Schlüssel niemals als VITE-Variablen oder in den Webbuild schreiben.
Eine geänderte Website-Domain braucht eine passende Appwrite-Web-Plattform-Origin
und neue lokale Ollama-CORS-Freigabe.

Der eigenständige Workflow `deploy-ai-gateway.yml` ermöglicht Änderungen am
Funktionscode vor dem Webdeployment. Produktionsdeployments sollten seriell
laufen; keine parallelen unabhängigen Funktions-/Site-Rollouts starten. Details,
Datentransport, Timeout-/Streaminggrenzen und reale Abnahme: [BROWSER_AI.md](BROWSER_AI.md).
