# Mermaider bereitstellen

Stand: 30.09.2026. Commit `b0a673d` wurde nach einem frischen `npm ci` mit
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
`dist/`, aufbewahrt für 14 Tage. Er benötigt keine Appwrite-Secrets. Ein GitHub-Lauf
dieser lokal vorbereiteten Änderung steht noch aus.

## Appwrite Sites

Die bisherige Pipeline scheitert vor Checkout und Build, weil
`appwrite/setup-for-appwrite@v2` nicht als Tag existiert. Nachweis:
[Lauf 30946848188](https://github.com/Jakende/mermaider/actions/runs/30946848188),
Job `92118845076`, Log vom 04.08.2026.

Der lokal korrigierte [Deployment-Workflow](../.github/workflows/deploy-appwrite.yml)
installiert `appwrite-cli@28.1.0`. Auch `appwrite deploy sites` wurde ersetzt:
Die installierte CLI hat kein `deploy`-Kommando. Die neuen Befehle und Optionen
wurden gegen die Hilfe der tatsächlich installierten Version geprüft.

| GitHub Secret | Bedeutung |
| --- | --- |
| `APPWRITE_API_KEY` | Schlüssel mit Berechtigungen für die Site und ihre Deployments |
| `APPWRITE_PROJECT_ID` | Projekt, zu dem die Site gehört |
| `APPWRITE_SITE_ID` | Vorhandene Ziel-Site |
| `APPWRITE_ENDPOINT` | Erforderlich: tatsächlicher projektspezifischer/regionaler Endpoint |

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
Der korrigierte Workflow wurde noch nicht gegen eine Ziel-Site ausgeführt:
Appwrite-Zugang und Site-Konfiguration fehlen in dieser Arbeitsumgebung.
Der Live-Zustand von `mermaider.com` wurde nicht bestätigt.

Alternativ direkt aus Git bauen: `npm ci`, `npm run build`, Output `dist`,
statischer Adapter. Einen primären Deployment-Weg verwenden, damit Git-Integration
und Actions einander nicht ungeplant überschreiben.

## Browser und AI

Für den Editor ist keine `.env` erforderlich. Provider und Benutzerzugangsdaten
werden in der Anwendung eingestellt. Alle `VITE_*`-Werte sind öffentlich im
Browserbuild sichtbar; keine API-Schlüssel als `VITE_OPENAI_API_KEY` einbauen.

Die alte Anleitung nannte Appname, Version, Analytics und Featureflags.
Die Hilfsfunktionen in `src/utils/env.ts` haben derzeit keine aktiven Aufrufer.
Auch die Appwrite-Platzhalter in `.env.example` werden nicht verwendet.

Im Browser läuft Ollama auf dem Rechner des Besuchers, nicht auf dem Hostingserver.
CORS, HTTPS/HTTP-Regeln und Browserberechtigungen für lokale Verbindungen für
die Zielumgebung prüfen. AI-Provider wurden hier nicht live getestet.
Monaco wird derzeit über jsDelivr geladen, Fonts über Google; der Webbuild
ist deshalb keine vollständige Offline-Garantie.

## Desktop und öffentliche Downloads

`npm run tauri:build` benötigt Rust/Cargo und die Werkzeuge des jeweiligen OS.
Die bestätigten v1.8.6-Artefakte sind Apple-Silicon-DMG und Windows-x64-NSIS;
Intel-macOS und Linux sind keine bestätigten Releaseziele.

Das Repository ist privat und alle 16 erfassten Releases sind Entwürfe.
Öffentliche Downloadbuttons benötigen eine öffentliche Downloadquelle und
einen veröffentlichten, geprüften Release. Das kann auch ein separates
öffentliches Distributionsrepository bei weiterhin privaten Quellen sein.

Der [Release-Helper](../.agents/skills/auto-release/scripts/release.cjs) verändert
Versionen, verlangt einen sauberen Arbeitsbaum, prüft Build und Tests, erstellt
Commit und Tag und pusht beides. Er ist kein lokaler Buildcheck. Vorher Änderungen prüfen und die
Voraussetzungen aus [ROADMAP.md](ROADMAP.md) abarbeiten.

Auf der echten Live-URL Editor, Änderungen, Persistenz, Import/Export,
Providerverbindung und öffentliche Downloadlinks prüfen.
