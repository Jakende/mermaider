# Produktwebsite

Die Produktseite liegt unter `/website/`, der Editor bleibt unter `/`.
Die Website verwendet direkt die Design-Tokens und Basis-Komponenten der App:
Monospace-Schrift, Schwarz/Weiß, eckige Konturen und schlichte Buttons. Hell/Dunkel
nutzt dieselbe gespeicherte `mermaider-theme`-Einstellung wie der Editor.

Beide HTML-Einstiegspunkte werden gemeinsam mit `npm run build` gebaut und
über den bestehenden Appwrite-Workflow ausgeliefert. Keine Migration von
Bookmarks oder Browser-Speicherdaten erforderlich. Die Website lädt weder
Monaco noch Mermaid, React oder einen KI-Anbieter. Zwei feste Diagrammbeispiele
zeigen passenden Mermaid-Code, ohne eine Modellentscheidung vorzutäuschen.

## Öffentliche Downloads

`public/website/release.json` ist die überprüfte Downloadkonfiguration. Solange
`published` false ist, erscheinen keine Downloadlinks. Nach Release-Abnahme
`published: true`, `notesUrl` und pro freigegebener Plattform `url` und
`signed` eintragen. Nur absolute HTTPS-URLs sind erlaubt. Version, Architektur
und Signierungsstatus müssen zu den tatsächlich veröffentlichten Artefakten
passen; Release Notes müssen Installationshinweise und Prüfsummen enthalten.
macOS unterstützt derzeit Apple Silicon, Windows x64. Kein Intel-Mac-Download.
Keine privaten GitHub-Tokens, CI-Artefakt-URLs oder zeitlich begrenzten URLs
in diese öffentliche Datei aufnehmen. Ein nicht erreichbares Manifest lässt
die vorhandenen Hinweise stehen.

## Vor öffentlicher Quellcodefreigabe

Nutzervorgabe vom 02.10.2026: Repository bis zur Bereinigung und Prüfung der
Urheberzuordnung privat lassen. Die Website weist beim GitHub-Link darauf hin.
Eine MIT-Lizenz ist keine automatische Zustimmung zur Veröffentlichung.

Die erste Herkunftssichtung und konkrete historische Lizenzwechsel sind in
[SOURCE_PROVENANCE.md](SOURCE_PROVENANCE.md) dokumentiert. Eine alleinige
Urheberschaft wird nicht behauptet. Die MIT-Freigabe der übernommenen Dario-
Beiträge wurde vom Projektverantwortlichen am 02.10.2026 bestätigt.

Stand nach der Bereinigung vom 02.10.2026:

- `.test-compile/` und ungenutzte Konfiguration entfernt; Dateiherkunft erfasst.
- Erreichbare Git-Historie auf definierte Credential-Muster geprüft, ohne Treffer.
  Umfang und Grenzen sind im Herkunftsbericht dokumentiert.
- Jakob Endemann und Dario Novoa Vergara in den Autorenangaben genannt;
  Fremdhinweise erhalten. Die MIT-Freigabe der Dario-Beiträge ist bestätigt.
- [Attribution](../ATTRIBUTION.md), [Dateiherkunft](SOURCE_FILE_ORIGINS.md) und
  [Abhängigkeitslizenzen](DEPENDENCY_LICENSES.md) dokumentieren die Zuordnung.
- Repository bleibt privat. Öffentliche Downloads benötigen weiterhin Release-
  Abnahme und eine öffentliche Quelle. Erst dann Downloadmanifest aktivieren
  und Privathinweis anpassen.

Jev und Laya werden als Planung beschrieben; die Website behauptet keine
bereits verfügbare Entscheidungsintegration. Domainwechsel und ein späterer
Umzug der Website auf `/` sind separate Schritte.

## Prüfung am 02.10.2026

TypeScript/Vite-Build, ESLint, Release-Versionsprüfung und alle 19 bestehenden
Regressionstests bestanden. Alle fünf Chromium-Browsertests bestanden: drei
Editorprüfungen sowie Website-Demo/Responsive-Verhalten und die Freigabe gültiger
HTTPS-Downloads. Desktop- und Mobilansicht visuell geprüft; keine horizontalen
Überläufe bei 1440, 390 und 320 Pixeln, auch bei vergrößerter Schrift
auf Mobilgeräten. Hell/Dunkel-Umschaltung und Wiederherstellung geprüft. Produktseite lädt nur eigenen JS-/CSS-Code,
Favicon und Releasekonfiguration, keine Editor- oder Modellbibliotheken.
Veraltete CC-Metadaten, alte Repository-URLs, unbestätigte Domain-/Bildlinks und
unbelegte Bewertungen aus dem App-HTML entfernt; Contribution-Lizenz auf MIT
abgestimmt. Dies ersetzt keine Herkunfts- oder Historienprüfung des Repositorys.
