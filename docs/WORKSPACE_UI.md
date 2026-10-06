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

## iPhone, Touch und Bildschirmtastatur

Eingabefelder, Auswahlfelder und der mobile Codeeditor verwenden mindestens
16 Pixel Schrift. Das verhindert den üblichen automatischen iOS-Fokuszoom,
ohne manuelles Vergrößern der Seite zu sperren. Es gibt keine Einschränkung
wie `user-scalable=no` oder eine maximale Browser-Zoomstufe.

Formulare behalten ihre native Scrollbedienung. Der sichtbare App-Bereich und
Dialoge folgen `visualViewport`, wenn die Tastatur eingeblendet wird. Ein
betroffenes Eingabefeld wird innerhalb seines Formulars sichtbar gehalten;
die Seite wird dabei weder zurückgescrollt noch zwangsweise zurückgezoomt.
Einstellungen behalten eine feste, an den verfügbaren Platz angepasste Höhe,
damit sich Verbindungsschaltflächen beim Modellladen nicht verschieben.

In der Vorschau verschieben ein oder zwei Finger das Diagramm. Pinch zoomt am
Gestenmittelpunkt. Gleiches gilt für Mausziehen und Trackpad-Scrollen;
Ctrl/Cmd+Scroll bzw. eine Trackpad-Pinch-Geste zoomt. Plus/Minus und Reset bleiben
verfügbar. Verschieben und Zoomen ändern die bestehende SVG-Darstellung ohne
neues Mermaid-Layout. Ein Drag löst keine versehentliche Diagrammentscheidung
aus; normales Antippen bleibt möglich. Im visuellen Editor bleiben die
vorhandenen React-Flow-Gesten erhalten.

Die automatische mobile Diagrammanpassung folgt Änderungen des verfügbaren
Platzes, auch beim Öffnen und Schließen der Tastatur. Nach manuellem Pan/Zoom
bleibt die vom Nutzer eingestellte Ansicht erhalten. Ein neues Diagramm-Layout
aktiviert die automatische Anpassung wie bisher erneut.

Die Browserprüfung umfasst zusätzlich ein mobiles WebKit-Projekt. Installieren:
`npx playwright install chromium webkit`. Chromium simuliert außerdem echte
Multi-Touch-Ereignisse; dieser Protokollfall und der native Wheel-Fall werden in mobilem
WebKit mangels Ereignisinjektion ausdrücklich übersprungen. WebKit prüft die
Formular-Scrollbarkeit und deren Touch-Regeln ohne simulierte Wischgeste. Bildschirmtastatur-Resizes werden kontrolliert simuliert. Das
ersetzt keine Bedienungsabnahme mit einer echten iPhone-Bildschirmtastatur.

## Diagrammübersicht und Vollbild

Die horizontale Tab-Leiste ist durch eine kompakte Auswahl direkt in der oberen Toolbar ersetzt. „Diagrams“
oder Cmd/Ctrl+K öffnet die Übersicht; gesucht wird ohne Groß-/Kleinschreibung in
Namen und aktuellem Mermaid-Code. Mehrere Suchwörter dürfen an verschiedenen
Stellen vorkommen. Die passende Codezeile dient als Vorschau. Pfeiltasten wechseln
zwischen Ergebnissen, Enter öffnet und Escape schließt die Suche. Diagramme lassen
sich dort schließen oder neu erstellen. Bestehende Tabs, Chats, Entscheidungen
und lokale Wiederherstellung bleiben erhalten.

View → Fullscreen workspace blendet Werkzeugleisten, Editor und Preview-Kopf
aus. Eine kleine schwebende Steuerung öffnet Diagramme, Chat oder Decisions und
beendet den Modus. Desktop nutzt das native Tauri-Fenstervollbild. Im Web wird, wo unterstützt,
zusätzlich Browser-Vollbild angefordert;
auf iPhone und Webviews ohne diese API bleibt der reduzierte Arbeitsbereich
innerhalb der App verfügbar. Escape und „Exit fullscreen“ stellen die vorherige
Editor-/Panelansicht wieder her. Escape in der Diagrammsuche schließt zunächst
nur den Dialog.

Chat und Decisions schweben in dieser Ansicht über dem Diagramm. Beide Fenster
sind an ihrer Kopfzeile per Maus, Touch oder Stift verschiebbar; bei fokussierter
Kopfzeile auch mit Pfeiltasten. Positionsgrenzen und Größenbegrenzung halten sie
bei Fenster- und Tastaturänderungen erreichbar. Decisions lässt sich zusätzlich
im normalen Arbeitsbereich auskoppeln und wieder andocken. Chat-Entwürfe bleiben
beim Andocken, Auskoppeln und Wechsel in den Vollbildmodus erhalten.

Schwebende Chat- und Decisions-Fenster verwenden denselben Griff unten rechts,
um Breite und Höhe zu ändern. Das angedockte Decisions-Panel behält seinen
seitlichen Griff. Beim erneuten Andocken werden dessen normale Breite und volle
Arbeitsbereichshöhe wiederhergestellt.

Menüs schließen bei einem tatsächlichen Klick oder Fokus außerhalb. Ein kurzzeitig
fehlendes Fokusziel beim Anklicken einer Aktion entfernt diese nicht vor ihrem
Klick. Die Werkzeugleiste liegt über Editor und Diagramm; Menüpunkte werden durch
Maus-, Tastatur- und mobile Touch-Prüfungen abgesichert.
