# Signierte Installer einrichten

Die unsignierten Releases bleiben gültig. Noch keine Apple-/Windows-Zertifikate
vorhanden: Signierung ist vorbereitet, aber kein signierter Build wurde nachgewiesen.
`Build Signed Installers` ist ausschließlich manuell startbar und bricht ohne Secrets ab.
Es lädt Ergebnisse als Kandidaten hoch; bestehende Release-Dateien werden nicht ersetzt.

## Apple

1. Apple Developer Program einrichten und in Certificates eine **Developer ID Application**
   anlegen. Das Zertifikat einschließlich privatem Schlüssel auf deinem Mac als P12 exportieren.
2. Ein app-spezifisches Passwort für Notarisierung erzeugen und Team-ID ermitteln.
3. Unter GitHub → Settings → Secrets and variables → Actions diese Repository-Secrets setzen:

| Name | Inhalt |
| --- | --- |
| APPLE_CERTIFICATE | Base64 des P12-Exports |
| APPLE_CERTIFICATE_PASSWORD | P12-Passwort |
| APPLE_SIGNING_IDENTITY | Vollständiger Developer-ID-Application-Name |
| APPLE_ID | Apple-Konto für Notarisierung |
| APPLE_PASSWORD | App-spezifisches Passwort |
| APPLE_TEAM_ID | Developer-Team-ID |

Der Workflow importiert in eine temporäre Keychain. Tauri signiert und notarisiert;
Codesign, Gatekeeper und Stapling werden anschließend geprüft. Die Keychain wird entfernt.

## Windows

Ein Authenticode-Code-Signing-Zertifikat eines vertrauenswürdigen Anbieters benötigen.
Der vorbereitete Workflow unterstützt einen exportierbaren PFX einschließlich privatem
Schlüssel; aktuelle Anbieter können stattdessen Hardwaretoken oder Cloud-Signierung
verlangen. In diesem Fall muss der Signierschritt mit dem SDK des Anbieters eingerichtet
werden — ein nicht exportierbarer Schlüssel lässt sich nicht als PFX verwenden.

Secrets: `WINDOWS_CERTIFICATE` (Base64-PFX) und `WINDOWS_CERTIFICATE_PASSWORD`.
Das Zertifikat wird im isolierten Windows-Runner importiert; Tauri signiert mit SHA-256
und Zeitstempel. Der Workflow verlangt anschließend einen gültigen Authenticode-Status.

## Danach

Den Workflow mit dem geprüften Release-Tag als `source_ref` starten.
Signatur-/Notarisierungsprüfungen und praktische Installation auf Mac/Windows dokumentieren.
Signierte Dateien als neue Veröffentlichung mit eigenen Prüfsummen bereitstellen;
bereits veröffentlichte unsignierte Dateien nicht austauschen. Website-Status erst nach
anonymer Downloadprüfung und erfolgreicher Signaturprüfung auf `signed: true` ändern.
Kein Zertifikat, privater Schlüssel oder Passwort gehört ins Repository oder in den Chat.
