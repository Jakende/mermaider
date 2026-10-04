# Herkunftsprüfung und Bereinigung

Stand: 04.10.2026. Die technische Bereinigung und historische Bestandsaufnahme
sind durchgeführt. Die öffentliche Veröffentlichung wurde vom Nutzer bestätigt;
der tatsächliche Uploadstand steht in [PUBLICATION_1.8.7.md](PUBLICATION_1.8.7.md).
Eine ausschließliche Urheberschaft von Jakob Endemann wird nicht behauptet.

## Herkunft und Lizenzgrundlage

- Die Git-Historie enthält Beiträge von Jakob Endemann, Dario Novoa, Appwrite
  und Dependabot. Autor-Metadaten weisen auf Beiträge hin, beweisen jedoch keine
  alleinigen Rechte an sämtlichen Inhalten.
- `ca436da`: ursprüngliche Mermalaid-React/Tauri-Anwendung von Dario Novoa,
  31.10.2025. `c391d01` fügte an diesem Tag CC BY-NC-SA 4.0 hinzu und änderte
  Lizenzangaben in README und Manifesten.
- `a5cbe7e`: Appwrite fügte am 02.11.2025 eine separate JSX-Starter-App hinzu
  und ersetzte LICENSE durch MIT mit `Copyright (c) 2024 Appwrite`. Die frühere
  TypeScript-Anwendung blieb dabei im Baum. `b1a5c0c` entfernte die Appwrite-
  Starter-Dateien wieder. Der LICENSE-Austausch allein war kein eindeutiger
  Beleg einer MIT-Freigabe aller übernommenen Anwendungsbeiträge.
- `4d46bfb`: Dario ergänzte am 05.11.2025 den visuellen Editor. LICENSE enthielt
  zu diesem Zeitpunkt MIT, package.json jedoch weiterhin CC BY-NC-SA 4.0.
  Die damaligen Angaben waren somit widersprüchlich.
- Jakob Endemann entwickelte Mermaider ab 2026 weiter, unter anderem mit
  plattformübergreifender Konfiguration, eigenem Designsystem, Provider-
  Integration, Workspace-Verwaltung, Diagrammbearbeitung und Release-/Website-
  Arbeiten. Beispiele und Zuordnung: [ATTRIBUTION.md](../ATTRIBUTION.md).

**Bestätigung des Projektverantwortlichen vom 02.10.2026:** Auf die konkrete
Frage, ob eine ausdrückliche MIT-Freigabe oder Übertragung der Nutzungsrechte für
Darios übernommene Beiträge vorliegt, antwortete er: „Ja, eine Freigabe liegt vor“.
Diese Bestätigung wird als Grundlage der vorgesehenen MIT-Distribution erfasst.
Das zugrunde liegende Freigabedokument wurde hier nicht unabhängig eingesehen;
eine exklusive Rechteübertragung oder alleinige Urheberschaft wird nicht daraus
abgeleitet. Vorhandene Fremdhinweise bleiben erhalten.

## Frühere Bereinigung und damaliger Stand

- Die nicht aktive `.test-compile/`-Kopie mit 150 Dateien aus dem aktuellen Baum
  entfernt und ihre erneute Aufnahme in `.gitignore` ausgeschlossen.
- `src/utils/env.ts` entfernt: kein aktiver Import/Aufrufer, veraltete Version
  und ungenutzte Analytics-/Featureflags. `.env.example` enthält jetzt Hinweise
  zur tatsächlichen Konfiguration, keine ungenutzten Appwrite-Clientvariablen.
- Cargo-Autoren um Jakob Endemann ergänzt; Dario Novoa Vergara bleibt genannt.
  Beschreibung nennt die tatsächlich unterstützten macOS-/Windows-Ziele.
- README, robots.txt und Sitemap auf geprüfte Appwrite-URLs korrigiert; erfundene
  Sitemap-Zeitangabe entfernt. README behauptet keinen bereits öffentlichen
  Quellcode oder veröffentlichten Installer.
- Attribution und Dateiherkunft dokumentiert. Die Website verweist auf
  verständliche Lizenz-/Herkunftshinweise; öffentliche Downloads bleiben aus.
- Git-Historie und Fremd-Copyright-Hinweise unverändert erhalten. Keine Secrets
  entfernt/rotiert und keine Historie umgeschrieben, da die Mustersuche keine
  passenden Treffer ergab.

## Prüfung auf sensible Inhalte

Alle vorhandenen Remote-Branches und Tags wurden vor der Prüfung geladen.
Die Prüfung vor diesem Bereinigungscommit erfasste 137 erreichbare Commits, 558 eindeutige Git-Blobs, davon 488 Text-
und 70 Binärversionen. Die Textinhalte wurden auf private Schlüssel, typische
GitHub-/OpenAI-/AWS-/Google-Schlüsselformate und lange, zufällig wirkende
Credential-Zuweisungen geprüft. Ergebnis: **keine passenden Treffer**.
Es wurden keine Credential-Werte in Berichte geschrieben.

Dies ist eine dokumentierte Mustersuche, keine Garantie für das Fehlen beliebiger
oder verschleierter Geheimnisse. Binärdateien wurden als solche erfasst, nicht
auf eingebettete Geheimnisse untersucht. Nicht erreichbare Serverobjekte,
GitHub-Secrets, CI-Logs und externe Artefakte gehören nicht zu dieser Prüfung.

Die [Dateiherkunft](SOURCE_FILE_ORIGINS.md) erfasst die nach der Bereinigung
verbleibenden versionierten Dateien mittels `git log --follow`. Erstautor und
letzter Autor sind Provenienzhinweise, keine vollständige Zeilen-/Rechteanalyse;
Icons, Vorlagen und Bibliotheken können weitere externe Ursprünge haben.

## Aktuelle Freigabe

Die bestätigte MIT-Erlaubnis löst die zuvor offene Frage für Darios übernommene
Beiträge. Abhängigkeiten behalten ihre eigenen Lizenzen.
Am 04.10.2026 bestätigte der Nutzer die praktische Abnahme beider aktueller
Installer und die öffentliche MIT-Veröffentlichung mit bestehender Attribution.
Installationshinweise für die unsignierten Dateien sind dokumentiert.
Signierung/Notarisierung ist für spätere signierte Builds vorgesehen. Die
tatsächliche öffentliche Distribution wird im Veröffentlichungsprotokoll erfasst.

## Technische Prüfung der früheren Bereinigung

Release-Versionsprüfung, ESLint, alle 19 Regressionstests und der TypeScript-/
Vite-Produktionsbuild bestanden. Alle fünf Chromium-Tests für Editor und Website
bestanden, einschließlich Erreichbarkeit der Herkunftshinweise. Cargo-Metadaten
ließen sich mit `--locked --offline --no-deps` prüfen und nennen die korrigierten
Autoren bei unveränderter Version 1.8.7. Diese Metadatenprüfung ersetzt keinen
nativen Build oder Windows-Praxistest.

## Erneute Mustersuche vor der Veröffentlichung

Am 04.10.2026 wurden alle Remote-Branches und Tags explizit geladen. Die erneute
Suche vor dem letzten Toolbar-/Dokumentationscommit erfasst 166 erreichbare
Commits, 809 eindeutige Blobs (739 Text, 70 binär). Ergebnis: keine Treffer für
die oben beschriebenen Schlüssel-/Credential-Muster. Die Einschränkungen der
heuristischen Mustersuche bleiben gültig; keine fremden Copyright-Hinweise oder
Historie wurden entfernt.
