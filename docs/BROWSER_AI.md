# AI-Verbindungen in der Web-App

Die Desktop-App verwendet natives HTTP und den Systemschlüsselspeicher. Die
Web-App verwendet Browser-HTTP: Lokale Netzberechtigungen und CORS gelten auch,
wenn Ollama läuft oder eine ChatGPT-Anmeldung erfolgreich war. Eine Anmeldung
auf chatgpt.com ist zudem keine API-Authentifizierung für die Mermaider-Website.

## Empfohlen für ChatGPT/Codex und Ollama: lokale Brücke

1. Node.js 20 oder neuer muss auf dem eigenen Rechner installiert sein.
2. Die [Brückendatei](https://mermaider.appwrite.network/website/mermaider-browser-bridge.mjs)
   herunterladen. Sie hat keine zusätzlichen Paketabhängigkeiten.
3. Im Downloadordner `node mermaider-browser-bridge.mjs` ausführen und das
   Terminal offen lassen. Alternativ im Projektcheckout: `npm run ai:bridge`.
4. In der Web-App Settings → **Browser Connection Bridge** die Adresse
   `http://127.0.0.1:11435` eintragen.
5. In Dia/Chromium den lokalen Netzwerkzugriff für diese Website erlauben.
6. Ollama testen oder ChatGPT-/Codex-Zugriffstoken eintragen bzw. den Device-Code-
   Login starten. Modelle laden, Verbindung testen und Einstellungen speichern.

Die Brücke bindet ausschließlich an IPv4-Loopback, nicht an öffentliche Netzwerk-
Interfaces. Sie erlaubt nur die Produktionswebsite und lokale Vite-Entwicklungs-
Ursprünge. Zusätzliche erlaubte Ursprünge können bewusst über
`MERMAIDER_BRIDGE_ORIGINS` als kommaseparierte vollständige Origins gesetzt werden;
Port über `MERMAIDER_BRIDGE_PORT`. Keine Platzhalterfreigabe für sämtliche Websites.

Erlaubte Ziele sind Ollama auf Loopback-Port 11434 und definierte Modelle-/Chat-/
Embedding-/Device-Auth-Endpunkte auf api.openai.com, chatgpt.com und auth.openai.com.
Keine beliebigen Proxyziele, keine Weiterleitungen, keine Token- oder Promptlogs.
Anfragen und Antworten werden im Speicher übertragen; OAuth-/API-Zugangsdaten
werden von der Brücke nicht gespeichert. Benutzerdefinierte Anbieterendpunkte
funktionieren über direkten Browserzugriff mit deren passenden CORS-Regeln;
die lokale Brücke ist kein universeller Proxy.

## Ohne Brücke

- OpenAI-API-Schlüssel: direkter Zugriff auf `https://api.openai.com/v1`.
  Ein ChatGPT-Abo/Zugriffstoken ersetzt keinen OpenAI-API-Schlüssel.
- Ollama: die konkrete Website-Origin über `OLLAMA_ORIGINS` erlauben und Ollama
  vollständig neu starten. Auf macOS bei Nutzung der Ollama-App beispielsweise
  `launchctl setenv OLLAMA_ORIGINS "https://mermaider.appwrite.network"`, danach
  die Ollama-App beenden und erneut starten. Lokalen Netzwerkzugriff im Browser
  erlauben. Nicht gleichzeitig eine zweite `ollama serve`-Instanz starten.
- ChatGPT-/Codex-Kontozugang: lokale Brücke oder Desktop-App verwenden. Die
  statische Website kann fehlende Cross-Origin-Freigaben nicht selbst ändern.

## Zugangsdaten und Fehleranzeige

Browser-Zugangsdaten bleiben im Speicher und in sessionStorage desselben Tabs,
überleben dessen Neuladen und werden bei Reset entfernt. Sie werden nicht in
localStorage-Einstellungsmetadaten gespeichert. sessionStorage ist Browser-
Speicher, kein verschlüsselter OS-Schlüsselspeicher; für native Persistenz die
Desktop-App verwenden. Desktop-Zugangsdaten bleiben im Systemschlüsselspeicher.

Modellabruf meldet HTTP-/Authentifizierungs-/Transportfehler sichtbar. Ein leeres
Modellverzeichnis wird nicht mehr als Ersatz für einen verschluckten Fehler
verwendet. Gewählte API-Key-Authentifizierung verwendet den API-Schlüssel auch,
wenn noch ein älteres OAuth-Token vorhanden ist. Proxy-Pfadpräfixe beim Ollama-
Modellabruf bleiben erhalten. Reale Anbieterantworten/Benutzerzugänge müssen auf
dem Zielrechner geprüft werden; automatisierte Tests verwenden Testanbieter.
