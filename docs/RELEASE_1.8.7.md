# Mermaider 1.8.7 – Abnahme und Veröffentlichung

Stand: 04.10.2026. Die Webversion ist bereitgestellt. macOS Apple Silicon und
Windows x64 wurden vom Nutzer praktisch abgenommen; Repository und unsignierte
Installer sind ausdrücklich zur öffentlichen Veröffentlichung freigegeben.
Aktueller tatsächlicher Uploadstand: [Veröffentlichung](PUBLICATION_1.8.7.md).

## Nachweise

- Anwendungscode `4108f4083e1e8311c37b7672d16f6426ac2bea48`, Artefakt-Merge
  `0e3489953e42c2fd09b94881eed234b34289ccfc`: identischer Dateibaum.
- 54 Logiktests, 49 CI-Browserfälle und 50 Live-Browserfälle erfolgreich;
  drei CI-Skips beziehungsweise zwei dokumentierte Live-WebKit-Protokoll-Skips.
- Web CI `37209127554`, Desktop CI `37209127539`, Produktion `37209125403`
  erfolgreich. Installer wurden heruntergeladen und gegen CI-SHA-256 geprüft.
- Nutzer: „auf Windows und auf Mac läuft alles perfekt“. Keine neuen einzelnen
  OS-/Architekturprotokolle wurden mitgesendet; qualitative Geräteabnahme.
- Jev-Fälle A–F wiederholt und OpenAI-Planung qualitativ bestätigt.
- MIT-Freigabe der übernommenen Dario-Beiträge und öffentliche Distribution
  ausdrücklich bestätigt. Bestehende Attribution bleibt erhalten.

Die letzte Toolbar-Platzierung der Diagrammbibliothek wird lokal für Web geprüft.
Die abgenommenen Desktop-Dateien bleiben unverändert; keine neuen Actions-Builds.
Release-Version, Dateien, Quellen und Prüfsummen:
[Abschlussbericht](RELEASE_CLOSEOUT_1.8.7.md).

## Weiterentwicklung

Die Entscheidungs-Engine bleibt Preview und Auto-Follow opt-in. Signierung und
Apple-Notarisierung, Laya-/CORS-Abnahme, Modellkalibrierung, Performance-Messungen
und weitere Plattformen sind spätere Arbeit, keine nochmals offenen Prüfungen
der bereits abgenommenen unsignierten Version. [Roadmap](ROADMAP.md).
