# Desktop-Übergabe für Mermaider 1.8.7

Stand: 04.10.2026. Web ist bereitgestellt; Desktop-Kandidaten bleiben privat.
Quellen, CI-Läufe und aktuelle SHA-256: [Release-Abschluss](RELEASE_CLOSEOUT_1.8.7.md).

## Aktuelle Installer praktisch prüfen

Das datierte Prüfpaket verwenden und SHA-256 mit `SHA256SUMS.txt` vergleichen.
macOS benötigt Apple Silicon; Windows benötigt x64. Je Gerät Betriebssystem,
Architektur, Installer-Prüfsumme und Ergebnis notieren. Installation/ersten Start,
Diagrammbearbeitung und Fehlerkorrektur, Import sowie SVG/PNG/PDF-Export prüfen.
Anschließend Tabs/Chats und Entscheidungen nach vollständigem Neustart prüfen.
Persönliche Providerzugänge direkt in der App testen; gespeicherte Schlüssel nach
Neustart prüfen und wieder löschen. Keine Schlüssel in Testberichte aufnehmen.
Die Tabelle in [Release-Prüfplan](RELEASE_1.8.7.md) dient als Protokoll.

## Signierten macOS-Kandidaten herstellen

Apple-Developer-Zugang und Developer-ID-Zertifikat werden benötigt. Zertifikat,
Schlüssel und Notarisierungszugang über die geschützte CI-Secretverwaltung
bereitstellen; niemals ins Repository schreiben. Der aktuelle Desktop-Workflow
baut ausdrücklich mit `--no-sign`; er ist kein Nachweis einer Signierung.
Signierungs-/Notarisierungseinrichtung in einem separaten überprüfbaren Schritt
vornehmen, einen neuen Kandidaten bauen und Developer-ID-Signatur,
Notarisierung einschließlich Stapling sowie Installation auf einem weiteren
Mac prüfen. Für diese neuen Dateien eigene Prüfsummen erstellen.

## Windows und Veröffentlichung abschließen

Aktuellen Installer auf einem Windows-Gerät praktisch abnehmen. Die Entscheidung
zur Herausgebersignierung einschließlich Zertifikatszugang dokumentieren und
gegebenenfalls einen signierten Kandidaten erneut prüfen. Erst danach öffentlichen
Releaseumfang und Repository-Freigabe festlegen. MIT-Lizenz und Fremdattribution
bleiben erhalten. Der Tag-Workflow erstellt zunächst einen privaten Draft;
Release-Dateien nach dem Neubau erneut prüfen. Öffentliche Website-Downloads erst
auf die tatsächlich freigegebenen Dateien umstellen. Die Website bleibt bis dahin
auf `published: false` für Desktop-Downloads.
