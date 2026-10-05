# Neue Builds ab 1.9.1

Das Actions-Budget ist wieder verfügbar. Der Nutzer hat neue Builds und die
Erweiterungs-Roadmap beauftragt. Die historische Übergabe unten beschreibt 1.8.7;
deren Dateien bleiben unverändert. Neue CI-geprüfte Installer enthalten Toolbar,
bilinguale Website und die 1.9.1-Erweiterungen. Eine neue Geräteabnahme wird nicht
behauptet. Installation: [Anleitung](DESKTOP_INSTALL.md). Signierung:
[Einrichtung](SIGNING_SETUP.md). Intel-Mac/Linux werden separat gebaut.

# Desktop-Übergabe Mermaider 1.8.7

Die aktuellen macOS-/Windows-Installer wurden am 04.10.2026 vom Nutzer praktisch
abgenommen und zur öffentlichen unsignierten Veröffentlichung freigegeben.
Sie werden unverändert wiederverwendet; kein neuer nativer Build ist erforderlich.
Quelle, CI und SHA-256: [Abschlussbericht](RELEASE_CLOSEOUT_1.8.7.md).

Die Toolbar-Layoutänderung ist ausschließlich im neu vorbereiteten Web-Build.
Release Notes und Provenienz nennen diese Grenze. Die tatsächlichen Schritte
für Repository, Release-Dateien und Website ohne neue GitHub Actions stehen in
[Veröffentlichung](PUBLICATION_1.8.7.md).

Für spätere signierte Builds werden Apple-Developer-Zugang, Developer-ID-
Zertifikat und Notarisierungszugang sowie ein Windows-Signierungszertifikat
benötigt. Danach Signatur, Stapling und Installation praktisch prüfen und neue
Prüfsummen erstellen. Keine Schlüssel oder Zertifikatsgeheimnisse ins Repository
oder in Entscheidungsdateien schreiben. Weitere Erweiterungen: [Roadmap](ROADMAP.md).
