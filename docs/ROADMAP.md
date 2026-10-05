# Erweiterungs-Roadmap: Umsetzungsstand 1.9.1

Stand: 05.10.2026. Der Nutzer hat neue Builds und die gesamte Roadmap beauftragt.
Das frühere Actions-Budgetverbot ist aufgehoben. Die öffentlich abgenommenen
unsignierten 1.8.7-Dateien und ihr Tag bleiben unverändert erhalten.

| Erweiterung | Implementiert | Noch benötigter Nachweis |
| --- | --- | --- |
| Signierung/Notarisierung | Manueller Apple-/Windows-Workflow mit Secret-Vorprüfung, Signatur-/Stapling-Prüfungen und Kandidatenartefakten; [Einrichtung](SIGNING_SETUP.md). | Der Nutzer hat noch keine Zertifikate eingerichtet. Signierte Dateien und Geräteinstallation sind offen. |
| Laya lokal | Pinned echter Server, Loopback-Endpoint, Browser-CORS, Health-/Modelltest und [Mac-/Windows-Anleitung](LAYA_SETUP.md). | Nutzer richtet Laya ein; reale Inferenz und praktische Browser-/Desktop-Abnahme folgen dort. |
| Modellqualität | [Sechs DE/EN-Choice-Fälle](MODEL_BENCHMARK.md), je A → B → A und drei Wiederholungen; Export von Richtigkeit, Brier-Score, Konsistenz, Latenz und Fehlern. Dry-run validiert 54 geplante Anfragen. | Ohne realen Modellzugang keine neuen Qualitäts-/Kalibrierungsbehauptungen. Vorherige qualitative Jev-Abnahme bleibt historisch gültig. |
| Kombinierte Entscheidungen | All/any-Voraussetzungen, validierte vorgelagerte Antworten, Erkennung unmöglicher All-Kombinationen, Review-Sperren und Dateiformat v4. | Neue Unit-/Browser-Prüfungen bestehen; weitere Nutzung bleibt Preview. |
| Verlauf/Berichte | Volle retained Snapshots, Replay als neue Revision, Zustandsvergleich und teilbarer Bericht ohne Providerkonfiguration. | Höchstens 50 Ereignisse innerhalb eines 750.000-Zeichen-Budgets; ältere Versionen können Snapshots vermissen. |
| MCP/API-Ereignisse | Strenges v1-Envelope, Sitzungs-/Revisionsschutz, lokale tokenpflichtige Queue und sichtbare Übernahme; [Anleitung](EXTERNAL_UPDATES.md). | Keine automatische Übernahme oder öffentliche Mehrbenutzer-API. |
| Rendering/Bundle | Editor lokal gebündelt mit Worker, Editor/Mermaid lazy geladen, begrenzter SVG-LRU-Cache und [Referenzmessung](RENDERING_BENCHMARK.md). | Mermaid benötigt DOM-Messungen; Worker-Auslagerung wurde deshalb nicht als Verbesserung behauptet. Große Chunks bleiben sichtbar dokumentiert. |
| SSE/längere Anfragen | Optionaler lokaler Relay: echtes SSE, 180 Sekunden, Allowlist, Abbruch und Größenlimit; [Anleitung](STREAMING_TRANSPORT.md). | Standard-Appwrite bleibt 50 Sekunden/gepuffert. Keine Tokenanzeige im Chat und kein neuer gehosteter SSE-Dienst behauptet. |
| Intel-Mac/Linux | Eigener manueller Build mit Prüfsummen und getrennten Kandidatenartefakten. | Geräteabnahme offen; keine regulären Website-Downloads vor Abnahme. Beide 1.9.1-Builds erfolgreich; Quellen und Hashes in [Abschluss](RELEASE_CLOSEOUT_1.9.1.md). |
| Komfort/Zugänglichkeit | Drei importierbare Beispiele, Ex-/Import v1–v4, konfigurierbare Shortcuts, beschriftete Review-/Replay-Steuerelemente und Browser-Regressionsprüfung. | Kein formales WCAG-Audit behauptet. |

Automatisierte Tests prüfen Verträge und Bedienabläufe. Sie ersetzen keine
Zertifikatsausstellung, reale Modellmessung oder Installation auf Nutzergeräten.
Decisions bleibt Preview; automatische Auswahl ist opt-in. Die historischen
1.8.7-Nachweise stehen in [PUBLICATION_1.8.7.md](PUBLICATION_1.8.7.md).
