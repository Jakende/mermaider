# Mermaider 1.8.7

Releasekandidat für macOS Apple Silicon und Windows x64. Die Web-App ist unter
https://mermaider.appwrite.network/ verfügbar; die Produktwebsite liegt unter
https://mermaider.appwrite.network/website/.

## Änderungen

- Schnellere Mermaid-Vorschau mit verworfenen überholten Renderaufträgen und
  direktem SVG-Pan/Zoom. Verbesserter Visual Editor erhält Inline-Knoten und parallele Kanten.
- Dynamische Fragen, Antworten und Folgefragen neben dem Diagramm. KI-Strukturentwürfe
  bleiben überprüfbar; manuelle Auswahl, Live-Vorschläge und optionales Auto-Follow sind verfügbar.
- Choice, Score und Noul mit expliziten Regeln, Unsicherheitsbereich, Verlauf,
  Undo/Redo und versioniertem JSON-Import/-Export. Score erfordert immer Übernahme.
- Konsistente Entscheidungen bei geänderten Zuständen und zusammenlaufenden Zweigen.
  Providerwechsel, Fehler und Abbruch können keine veralteten Vorschläge übernehmen.
- OpenAI und Jev über den gehosteten Appwrite-Transport; lokale Ollama-/Laya-Verbindungen
  bleiben lokal. Persönliche API-Schlüssel werden nicht in Entscheidungsdateien exportiert.
- Minimalistische File-/View-Menüs, getrennte Settings-Bereiche und unabhängig wählbare Embeddings.
  Persönlicher Blob mit optionaler Animation und Unterstützung für reduzierte Bewegung.
- Mobile Formulare ohne üblichen iOS-Fokuszoom, anpassbares Tastatur-Layout und
  Ein-/Zwei-Finger-Pan sowie Pinch-Zoom in der Diagrammvorschau.
- Wiederherstellung gespeicherter Tabs/Chats und native Systemschlüsselspeicher.
  MIT-Metadaten vereinheitlicht; bestehende Urheber- und Lizenzhinweise erhalten.

## Installer und Integrität

| System | Datei | Status |
| --- | --- | --- |
| macOS Apple Silicon / ARM64 | `Mermaider_1.8.7_aarch64.dmg` | Kandidat ohne Developer-ID-Signierung / Notarisierung |
| Windows x64 | `Mermaider_1.8.7_x64-setup.exe` | Unsignierter Kandidat; praktischer Windows-Test offen |

Kein Intel-Mac-Installer. Die Installationsdateien nur aus der geprüften Quelle
beziehen und vor Installation mit der mitgelieferten `SHA256SUMS.txt` vergleichen:

macOS: `shasum -a 256 Mermaider_1.8.7_aarch64.dmg`

Windows PowerShell: `Get-FileHash .\Mermaider_1.8.7_x64-setup.exe -Algorithm SHA256`

Prüfsummen bestätigen Dateiintegrität, nicht Entwickleridentität oder Notarisierung.
Bei macOS- oder Windows-Hinweisen auf einen unbekannten Herausgeber zuerst Herkunft
und Prüfsumme prüfen. Ein signierter öffentlicher Release wird erst nach Einrichtung
und Prüfung der jeweiligen Signierung bereitgestellt.

## Grenzen dieses Kandidaten

Die Bedienung, Providerzugänge OpenAI/Jev/Embeddings, mobile iPhone-Bedienung und
Entscheidungsdatei-Import wurden vom Nutzer bestätigt. Automatisierte Ablaufprüfungen
verwenden kontrollierte Modellantworten. Die fachliche Qualität der sechs deutschen
Jev-/Laya-Abnahmefälle ist noch nicht separat bestätigt. Die 80-%-Grenze ist eine
Produktregel und keine gemessene Zuverlässigkeitsgarantie. Automatik startet deaktiviert.

Lokales Laya und dessen Browser-CORS bleiben separat abzunehmen. Auch Ollama benötigt
im Browser Origin-Freigabe und lokale Netzwerkberechtigung. ChatGPT/Codex-Kontoanmeldung
ist im Web durch OpenAI-API-Zugang ersetzt; die native Anmeldung bleibt vorhanden.
Der gehostete Transport puffert SSE, begrenzt Anfragen auf 50 Sekunden und 512 KB.

Windows-Praxistest, Developer-ID-Signierung/Notarisierung und öffentliche
Repository-/Downloadfreigabe stehen noch aus. Dieser Stand ist ein privates
Prüfpaket und kein veröffentlichter signierter Release.
