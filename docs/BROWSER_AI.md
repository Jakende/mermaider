# AI-Verbindungen ohne zusätzliche Downloads

Die Web-App benötigt keine lokale Hilfsdatei und kein Node.js. Ollama bleibt auf
dem Rechner des Nutzers. OpenAI und Jev werden über die auf Appwrite gehostete
Funktion `mermaider-ai-gateway` angesprochen. Die Desktop-App verwendet weiterhin
natives HTTP und den Betriebssystem-Schlüsselspeicher.

## OpenAI

1. Settings → OpenAI → API Key wählen und einen persönlichen OpenAI-API-Schlüssel
   eintragen. Ein ChatGPT-Abo enthält keinen OpenAI-API-Zugang.
2. Modelle laden, ein verfügbares Modell auswählen und die Verbindung testen.
3. Einstellungen speichern.

Browser-Anfragen senden Schlüssel und Eingabe über den Mermaider-Dienst an
OpenAI. Der Dienst verwendet ausschließlich den persönlichen Schlüssel der
Anfrage; es gibt keinen gemeinsamen OpenAI-Schlüssel und keine automatische
Kostenübernahme. Browser-Schlüssel bleiben in sessionStorage des Tabs und
überleben Reloads. Sie werden nicht in localStorage-Einstellungen gespeichert.
Reset entfernt die OpenAI-Zugangsdaten. sessionStorage ist kein verschlüsselter
OS-Schlüsselspeicher.

ChatGPT-/Codex-Kontoanmeldung ist im Browser deaktiviert. Der vorhandene
Device-Code-Weg nutzt den Codex-Client und ist keine verifizierte Mermaider-Web-
OAuth-Integration. Native Kontoanmeldung bleibt erhalten. Bereits gespeicherte
Kontotokens werden nicht durch einen API-Schlüssel ersetzt; im Web muss ein
API-Schlüssel eingegeben und die neue Konfiguration gespeichert werden.

## Ollama auf macOS und Dia/Chromium

1. Lokalen Netzwerkzugriff für `https://mermaider.appwrite.network` im Browser
   erlauben, wenn die Berechtigungsabfrage erscheint.
2. Bei der Ollama-App einmal im Terminal ausführen:

   ```bash
   launchctl setenv OLLAMA_ORIGINS "https://mermaider.appwrite.network"
   ```

3. Ollama vollständig beenden und erneut öffnen. Bestehende benötigte Origins
   beim Konfigurieren beibehalten; keine pauschale Sternfreigabe verwenden.
4. Settings → Ollama: `http://127.0.0.1:11434/v1`, vorhandene Modelle auswählen,
   Verbindung testen und speichern.

Bei einem Terminalserver `OLLAMA_ORIGINS` vor dem Start von Ollama setzen. Nicht
parallel eine zweite `ollama serve`-Instanz starten. Die Einstellungen zeigen die
konkrete aktuelle Website-Origin und die macOS-Anweisung. Der Hostingserver
kann das lokale Ollama des Besuchers nicht erreichen.

## Jev und Laya

**DECISIONS → Preview** ist eine erste Integration, unabhängig vom Chatprovider.
Jev verwendet `https://api.typesafe.ai`, einen TypeSafe-API-Schlüssel und
standardmäßig `jev-latest`. Im Browser laufen diese Anfragen über Appwrite.
Laya verwendet den bereits gestarteten lokalen HTTP-Dienst, standardmäßig
`http://127.0.0.1:8000`, und `multilingual` (API-Key optional).

Für Laya funktioniert natives HTTP ohne Browser-CORS. Browserzugriff braucht
zusätzlich eine CORS-Freigabe im Laya-Server und lokalen Netzwerkzugriff. Der
untersuchte Laya-Server aktiviert keine CORS-Middleware: Die unveränderte
`laya-serve`-Installation ist deshalb noch keine bestätigte Web-Konfiguration.
Eine zusätzliche lokale Transportbrücke wird nicht eingeführt. Die App wechselt
bei einem Fehler niemals still zu einem gehosteten Anbieter.

Die Seitenleiste unterstützt bearbeitbare Choice-Fragen mit Folgefragen,
KI-Entwürfe über den Chatprovider und Auswertung über Jev/Laya. Manuelle Auswahl,
Live-Vorschläge und optionales Auto-Follow sind unabhängig von automatischen
Strukturentwürfen wählbar. Knotenklicks öffnen die Interaktion direkt im Diagramm.
Sitzungen und bis zu zehn Undo-Schritte bleiben lokal pro Tab erhalten;
veraltete Antworten werden verworfen. Details: [Dynamische Entscheidungen](DYNAMIC_DECISIONS.md).

Entscheidungskeys sind von OpenAI getrennt: Web im Tab-Speicher, Desktop im
eigenen Keychain-Service. OpenAI-, Jev- und Embedding-Zugriff hat der Nutzer am
02.10.2026 bestätigt. Qualität der neuen Planung, deutsche Beispiele und Laya
benötigen weitere Abnahme.

## Gehosteter Dienst und Grenzen

Die Funktion leitet ausschließlich definierte HTTPS-Routen auf api.openai.com
und api.typesafe.ai weiter. Keine frei wählbaren Proxyziele, lokalen Adressen,
Codex-/OAuth-Routen oder Redirects. Ein Provider-Schlüssel ist erforderlich.
Anfragen/Antworten sind auf 512 KB begrenzt, Upstream-Anfragen auf 50 Sekunden.
Appwrite-Execution-API wird genutzt, kein öffentliches unbeschränktes Proxy-Domain-
Routing. Betriebskosten/Quoten müssen vor breiter öffentlicher Distribution in
Appwrite beobachtet und passend begrenzt werden.

Appwrite-Funktionslogging ist deaktiviert; der Funktionscode protokolliert keine
Schlüssel, Prompts oder Antworten und speichert sie nicht. Credentials werden
im Execution-Body übertragen, nicht in protokollierten Requestheadern. Es wird
keine Garantie über sämtliche internen Logs der Hosting-/Modellanbieter gegeben.

SSE-Antworten werden vom synchronen Appwrite-Aufruf gesammelt und anschließend
an den vorhandenen Parser übergeben. Das ist **kein Live-Token-Streaming vom
Server zum Browser**. Lange Modellanfragen können das Timeout erreichen; dafür
sind spätere asynchrone/Streaming-Ausbaustufen getrennt zu prüfen.

Automatisierte Tests verwenden kontrollierte Anbieterantworten. Liveprüfungen
prüfen Appwrite-Zugriff, CORS, Gesundheitsroute und Zielbeschränkung ohne echte
Providerkeys. OpenAI/Jev wurden vom Nutzer bestätigt. Das lokale Ollama/Laya und die neue
dynamische Planung bleiben eigene Abnahmepunkte.
