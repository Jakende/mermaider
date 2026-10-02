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
Urheberschaft und eine vollständige MIT-Freigabe aller übernommenen Teile sind
noch nicht belegt.

Vor einer Freigabe separat prüfen:

- Aktive Quellen, historische Kopien wie `.test-compile/`, Hilfsskripte und
  Dokumentation unterscheiden; entbehrliche Altdateien gezielt entfernen.
- Git-Historie und aktuellen Stand auf sensible Inhalte prüfen, ohne Werte in
  Berichte zu kopieren. Gefundene Geheimnisse vor Veröffentlichung rotieren.
- Herkunft und Rechte von Code, Icons, Vorlagen und Dokumentation nachvollziehen.
  Git-Autorangaben allein beweisen keine alleinige Urheberschaft.
- Eigene Beiträge Jakob Endemann korrekt zuordnen; zutreffende Fremd-Copyright-
  und Lizenzhinweise erhalten. Insbesondere den bestehenden Appwrite-Hinweis
  anhand der Herkunft prüfen, nicht pauschal löschen.
- Nach der Prüfung die öffentliche Quelle und Releaseartefakte freigeben,
  dann Downloadkonfiguration und Privathinweis aktualisieren.

Jev und Laya werden als Planung beschrieben; die Website behauptet keine
bereits verfügbare Entscheidungsintegration. Domainwechsel und ein späterer
Umzug der Website auf `/` sind separate Schritte.

## Prüfung am 02.10.2026

TypeScript/Vite-Build, ESLint, Release-Versionsprüfung und alle 19 bestehenden
Regressionstests bestanden. Alle fünf Chromium-Browsertests bestanden: drei
Editorprüfungen sowie Website-Demo/Responsive-Verhalten und die Freigabe gültiger
HTTPS-Downloads. Desktop- und Mobilansicht visuell geprüft; keine horizontalen
Überläufe bei 1440, 390 und 320 Pixeln. Produktseite lädt nur eigenen JS-/CSS-Code,
Favicon und Releasekonfiguration, keine Editor- oder Modellbibliotheken.
Veraltete CC-Metadaten, alte Repository-URLs, unbestätigte Domain-/Bildlinks und
unbelegte Bewertungen aus dem App-HTML entfernt; Contribution-Lizenz auf MIT
abgestimmt. Dies ersetzt keine Herkunfts- oder Historienprüfung des Repositorys.
