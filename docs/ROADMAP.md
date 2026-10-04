# Roadmap nach dem Abschluss von Mermaider 1.8.7

Stand: 04.10.2026. Web-App, Website, Diagrammbearbeitung, Hosted-Provider,
Diagrammsuche und Vollbild-Arbeitsbereich sind implementiert. Der Nutzer hat die
aktuellen macOS- und Windows-Installer praktisch abgenommen und Repository sowie
Installer zur öffentlichen MIT-Veröffentlichung freigegeben. Verteilung und
aktueller Uploadstand: [Veröffentlichung](PUBLICATION_1.8.7.md).

Die folgenden Punkte sind Erweiterungen. Sie sind keine ausstehenden Abnahmen
für die bereits geprüften unsignierten Installer.

| Priorität | Erweiterung | Konkretes nächstes Ergebnis |
| --- | --- | --- |
| 1 | Signierung und Notarisierung | Developer-ID-/Apple-Notarisierung und Windows-Herausgebersignierung einrichten, danach neue signierte Dateien prüfen. |
| 1 | Lokales Laya | Reproduzierbarer lokaler Server, macOS-/Windows- und Browser-CORS-Abnahme sowie reale Fälle A–F mit Laya dokumentieren. |
| 1 | Breitere Entscheidungsqualität | Deutsche und englische Praxisfälle, mehrfache Läufe, Zustandsfolge A → B → A, Latenz und Fehlerrouten messen; keine Kalibrierung aus Einzelwerten ableiten. |
| 2 | Komplexere Entscheidungen | Kombinierte Bedingungen und nachvollziehbare Abhängigkeiten mit einer weiterhin einfachen Decide-Ansicht. |
| 2 | Verlauf und Kommunikation | Vollständige Wiedergabe eines Entscheidungsverlaufs, Vergleiche und teilbare Zustandsberichte ohne Schlüssel. |
| 2 | Ereignisse über MCP/API | Externe Zustandsupdates in versionierte Entscheidungssitzungen übernehmen; sichtbare Review-Schritte erhalten. |
| 2 | Rendering und Bundle | Kleine/mittlere/große Diagramme auf einem Referenzgerät messen; schwere Diagrammtypen bedarfsgerecht laden und Cache-/Worker-Möglichkeiten prüfen. |
| 3 | Gehosteter Transport | SSE-Streaming und längere Anfragen nach Messung ergänzen; derzeit 50 Sekunden/512 KB und gepufferte SSE. |
| 3 | Weitere Plattformen | Intel-Mac und Linux erst nach eigenen Builds und Geräteabnahme anbieten. |
| 3 | Weitere Komfortfunktionen | Nutzbare Import-/Exportvorlagen, konfigurierbare Shortcuts und zusätzliche Zugänglichkeitsprüfungen. |

Jev, OpenAI und Embeddings wurden mit echten persönlichen Zugängen geprüft.
Wiederholte Jev-Fälle A–F und die vereinfachte Planung sind qualitativ bestätigt.
Die Entscheidungs-Engine bleibt Preview; automatische Übernahme ist opt-in.
Details: [Modellabnahme](DECISION_ACCEPTANCE.md), [Entscheidungsarchitektur](DYNAMIC_DECISIONS.md).

GitHub Actions werden für diesen Abschluss nicht erneut ausgeführt. Die
abgenommenen Installer werden unverändert weiterverwendet. Die kleine
Toolbar-Anpassung wird als lokal geprüfter Web-Build übergeben; sie ist erst in
einem späteren nativen Build enthalten.
