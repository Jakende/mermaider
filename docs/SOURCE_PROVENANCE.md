# Herkunftsprüfung und Bereinigung

Stand: 02.10.2026. Die technische Bereinigung und historische Bestandsaufnahme
sind durchgeführt. Das Repository bleibt privat; kein Release ist veröffentlicht.
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

## Durchgeführte Bereinigung

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

## Noch ausstehende Freigabeschritte

Die bestätigte MIT-Erlaubnis löst die zuvor offene Frage für Darios übernommene
Beiträge. Abhängigkeiten behalten ihre eigenen Lizenzen. Für einen öffentlichen
Release bleiben die Zielsystem-Abnahme, Signierungs-/Installationshinweise und
öffentliche Distribution gemäß [Releasecheckliste](RELEASE_1.8.7.md) offen.
Repository-Sichtbarkeit und Downloadmanifest wurden nicht freigegeben.

## Technische Prüfung

Release-Versionsprüfung, ESLint, alle 19 Regressionstests und der TypeScript-/
Vite-Produktionsbuild bestanden. Alle fünf Chromium-Tests für Editor und Website
bestanden, einschließlich Erreichbarkeit der Herkunftshinweise. Cargo-Metadaten
ließen sich mit `--locked --offline --no-deps` prüfen und nennen die korrigierten
Autoren bei unveränderter Version 1.8.7. Diese Metadatenprüfung ersetzt keinen
nativen Build oder Windows-Praxistest.
