# Oberfläche und Bedienung

Der monochrome Stil bleibt erhalten. Funktionen werden geordnet; keine
Diagramm-, KI-, Export-, Wissensbasis- oder Entscheidungsfunktion entfällt.

- **New / Export:** neue Tabs und das vollständige Exportdialogfeld direkt öffnen.
- **File:** Diagramm importieren, Wissensbasis/RAG öffnen, Code oder Bild kopieren.
- **View:** Vollbildvorschau bzw. Editor anzeigen, Farbschema wechseln, Hilfe öffnen.
- **Chat / Decisions:** den gewünschten Arbeitsbereich einblenden. Chat öffnet
  auch dann direkt, wenn zuvor Decisions sichtbar war; Cmd/Ctrl+J und +L folgen
  derselben Logik. Die Entscheidungsabläufe bleiben pro Tab gespeichert.
- **Settings:** Connection für Chat und Flow-Planung; Embeddings für die
  unabhängige RAG-Anbieterwahl; Generation für Temperatur, Tiefe, automatische
  Fehlerkorrektur und Systemprompt; Appearance für Theme, Diagrammpalette,
  Beschriftungsformat und Blob-Bewegung.

Verbindungs- und Generierungswerte bleiben beim Wechsel zwischen Einstellungs-
bereichen als Entwurf erhalten und werden mit Save übernommen. Cancel oder Escape
verwerfen diese Entwürfe. Darstellungswerte werden dagegen sofort übernommen;
das wird im Bereich Appearance ausdrücklich angezeigt. API-Zugangsdaten bleiben
in der bestehenden, getrennten Speicherung.

Der bestehende persönliche Blob behält seine lokale Identität. Die Toolbar zeigt
langsame Atem-, Blink- und Blickbewegungen. Weitere Blobs reagieren beim Hover;
während einer KI-Operation zeigt der jeweilige Kopf eine Thinking-Pose. Viele
Chat-Avatare laufen nicht gleichzeitig. Bewegung lässt sich abschalten; eine
Systemvorgabe für reduzierte Bewegung führt immer zur statischen Darstellung.
Das Umschalten der Blob-Bewegung löst kein Mermaid-Rendering aus.

File und View lassen sich mit Pfeiltasten, Home, End und Escape bedienen.
Settings besitzt Dialogsemantik, Fokusbegrenzung, Tastaturnavigation zwischen
Bereichen und Rückkehr zum auslösenden Steuerelement. Diagramm-Tabs können mit
Pfeiltasten gewählt werden; Schließen bleibt per Maus, Touch und Tastatur möglich.

Auf schmalen Displays bleibt die Toolbar vollständig erreichbar. Editor und
Vorschau stehen untereinander; die Vorschau passt ein neu gerendertes Diagramm
an den verfügbaren Raum an. Chat und Decisions liegen bei Bedarf über dem
Arbeitsbereich. Der Chat ist beim ersten Start auf kleinen Geräten eingeklappt.
Die vorhandene Entscheidungspanel-Größenänderung bleibt erhalten. Diagrammfarben
passen sich dem hellen bzw. dunklen Arbeitsbereich an; eigene Mermaid-Direktiven
und explizite Diagrammfarben haben weiterhin Vorrang.

Browserprüfungen decken 320-Pixel-Bedienung, Menü-/Dialogfokus, unabhängige
Embedding-Konfiguration, gespeicherte Entwürfe, Farbschema-Kontrast,
Blob-Identität, Bewegungseinstellungen und die bestehenden Entscheidungs-,
Import-/Export- und Providerabläufe ab.
