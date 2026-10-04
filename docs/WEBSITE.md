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

## Öffentliche Freigabe und Herkunft

Der Nutzer hat am 04.10.2026 die Veröffentlichung von Repository und abgenommenen
Installern autorisiert. Bereinigung, historische Lizenzwechsel und Grenzen der
Credential-Mustersuche stehen in [SOURCE_PROVENANCE.md](SOURCE_PROVENANCE.md).
Die MIT-Freigabe der übernommenen Dario-Beiträge wurde bestätigt; eine alleinige
Urheberschaft wird nicht behauptet. [Attribution](../ATTRIBUTION.md),
[Dateiherkunft](SOURCE_FILE_ORIGINS.md) und [Abhängigkeitslizenzen](DEPENDENCY_LICENSES.md)
bleiben erhalten. Der veraltete Privathinweis am GitHub-Link ist entfernt.

Die Downloadkonfiguration wird erst nach tatsächlicher Veröffentlichung und
anonymer Datei-/Prüfsummenprüfung aktiviert. Ausführung und Zugangsvoraussetzungen:
[PUBLICATION_1.8.7.md](PUBLICATION_1.8.7.md). Der aktuelle Abschluss verwendet
einen lokal geprüften statischen Webbuild und löst keine neuen Actions-Builds aus.

Jev und Laya werden als interaktive Preview beschrieben. Jev und OpenAI wurden
qualitativ vom Nutzer geprüft; lokale Laya-Abnahme und breitere Modellgüte stehen
in der Roadmap. Domainwechsel und ein späterer Umzug der Website auf `/` sind
separate Schritte.

## Aktuelle lokale Prüfung am 04.10.2026

Der Webbuild und ESLint bestehen. Die Websiteprüfungen bestätigen mobile/Desktop-
Darstellung, Demo, Theme und die Freigabe ausschließlich gültiger veröffentlichter
HTTPS-Downloads. Die Preview-Beschriftung passt auch bei 320 Pixeln und auf 200 %
vergrößerter Schrift. Die Seite lädt weiterhin keine Editor-/Modellbibliotheken.

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

Aktueller Release- und Downloadstatus: [Release-Abschluss](RELEASE_CLOSEOUT_1.8.7.md).
