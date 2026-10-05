# Laya lokal einrichten

Der Endpoint in Mermaider ist vorbereitet: **http://127.0.0.1:8000**.
Der Server läuft auf deinem Rechner; localhost in Codex wäre ein anderer Rechner.
Das Skript nutzt den echten Laya-Server, keine simulierten Modellantworten.

## macOS

Python 3.10 oder neuer installieren, dann im Repository:

```bash
python3 -m venv .venv-laya
source .venv-laya/bin/activate
python -m pip install "laya[serve]==0.3.22"
python scripts/laya-server.py --check
python scripts/laya-server.py
```

## Windows PowerShell

```powershell
py -m venv .venv-laya
.\.venv-laya\Scripts\python.exe -m pip install "laya[serve]==0.3.22"
.\.venv-laya\Scripts\python.exe scripts/laya-server.py --check
.\.venv-laya\Scripts\python.exe scripts/laya-server.py
```

Beim ersten Start werden öffentliche Modellgewichte heruntergeladen. Warte, bis
Uvicorn auf Port 8000 bereit ist. Standard ist das mehrsprachige Modell.
Das Skript bindet ausschließlich an 127.0.0.1; keine Firewallfreigabe ins Internet nötig.
Ein optionaler persönlicher `LAYA_API_KEY` kann als Prozessvariable gesetzt werden;
denselben Wert dann in Mermaider eintragen. Nicht im Repository speichern.

## In Mermaider

1. **Decisions → Provider connection → Laya (local)** auswählen.
2. Endpoint **http://127.0.0.1:8000**, Model **multilingual**.
3. Optionalen Laya-Key eintragen und **Save provider** wählen.
4. Mit **Test local connection** Health und Modellliste prüfen.
5. Im Browser die angefragte lokale Netzwerkberechtigung erlauben.
6. Einen manuellen Flow anlegen und eine Frage ausdrücklich mit **Evaluate** auswerten.

Das Server-Skript erlaubt Browser-CORS für die gehostete Mermaider-App und die
lokalen Entwicklungsseiten auf 5173/5174, ohne Wildcard oder Credential-Cookies.
CORS ist keine Netzwerkberechtigung; der Browser kann zusätzlich eine Freigabe verlangen.
Bei Portkonflikten `--port 8001` verwenden und den Endpoint entsprechend ändern.

## Reale Modellprüfung

Nach erfolgreichem Start:

```bash
npm run benchmark:decisions -- --provider laya --endpoint http://127.0.0.1:8000 --model multilingual --repetitions 3
```

Die deutschen/englischen Fälle durchlaufen A → B → A. Das Ergebnis trennt
Richtigkeit, Wiederholbarkeit, Fehler, Latenz und Wahrscheinlichkeitsgüte.
Ein lokaler Protokolltest und `--check` ersetzen weder reale Inferenz noch
praktische macOS-/Windows-Abnahme. Solange du diese Läufe nicht durchgeführt hast,
bleiben diese Nachweise offen. Kalibrierung darf nicht aus Einzelwerten abgeleitet werden.

Upstream-Vertrag: https://github.com/NandhaKishorM/laya/blob/6d942c92081fbc139e736bbd9ac0023223c29b7f/docs/http-api.md
