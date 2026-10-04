# Release-Stabilisierung – 01.10.2026

Historischer Arbeitsbericht. Aktueller Abschluss und Nutzerabnahme:
[RELEASE_CLOSEOUT_1.8.7.md](RELEASE_CLOSEOUT_1.8.7.md). Die nachfolgenden offenen
Punkte beschreiben den damaligen Stand.

Lokaler Arbeitsstand auf Basis von `b0a673d` (Manifestversion 1.8.6).
Kein neuer Tag, Push, veröffentlichter Release oder Appwrite-Deployment wurde
in diesem Arbeitslauf ausgeführt. Für den nächsten nativen Release eine neue
Version verwenden; der vorhandene Tag v1.8.6 bleibt bestehen.

## Behobene Probleme

- Rendering verwendet einen koordinierten Auftrag und verwirft überholte
  Ergebnisse schon beim nächsten Eingabezustand. Die zusätzliche unawaited
  `mermaid.parse`-Promise entfällt. Syntaxfehler werden abgefangen; Fehlermeldungen
  werden als Text eingefügt. Mermaid-Konfiguration und Rendering laufen seriell.
- Eingabeverzögerung von 500 auf 150 ms gesenkt. Stabile Vorschau-Abhängigkeiten
  verhindern ein neues Layout bei Pan/Zoom und geänderten Klick-Callbacks.
- Der Visual-Parser erhält Inline-Knoten, Kantenketten, Labels, gängige Formen
  und Subgraphs. Nicht unterstützte Konstrukte deaktivieren Visual Edit; die
  Mermaid-Vorschau bleibt verfügbar. Parallele Kanten haben unterschiedliche IDs.
- Umbenennen erhält Inline-Zielformen und Dollarzeichen. Löschen entfernt
  verbundene Kanten und erhält andere Inline-Knoten und verbleibende Ketten.
  Löschoperationen normalisieren dabei die betroffenen Diagrammstatements;
  Konfiguration vor der Diagrammdeklaration bleibt erhalten.
- Gespeicherte Tabs werden vor dem ersten Schreibeffekt geladen. Alte
  Chat-Historien werden migriert; fehlende aktive IDs werden korrigiert.
  Der aktive Tab wird nicht mehr während des Renderns mutiert.
- MCP liefert echte JSON-Schemas und die Appversion. Die gemeinsame Prüfung
  erkennt exakte Entry-Keywords. Sie prüft ausdrücklich nur den Einstieg,
  nicht die vollständige Diagrammsyntax; das geschieht beim Browser-Rendering.
- Mermaid auf 10.9.8 und Vite auf 6.4.3 aktualisiert; kompatible Pakete und
  Lockfile aktualisiert. Monaco pinnt eine verwundbare DOMPurify-Patchversion;
  ein eng begrenzter Override verwendet die gepatchte Version 3.4.16.
- ESLint funktioniert wieder und prüft TypeScript. Tests starten portabel
  über Node, ohne von einer Unix-Shell-Expansion abhängig zu sein.
- Keyring 3 hatte keine nativen Features und verwendete damit einen Mock.
  macOS verwendet jetzt `apple-native`, Windows `windows-native`. Cargo.lock
  wurde aktualisiert. Linux verwendet Kernel-Keyutils; persistenter Linux-
  Desktop-Support gehört nicht zur aktuellen macOS-/Windows-Release-Matrix.
- Alle Pipelines verwenden reproduzierbares `npm ci`. Release prüft zuerst
  den Webbuild inklusive Browserfällen. Genau ein Job legt den Draft an;
  beide Plattformen laden in dieselbe ID hoch, ohne einen Draft zu löschen.
  Bereits veröffentlichte Releases werden abgewiesen. Bundles sind pro
  Plattform auf App/DMG bzw. NSIS begrenzt.
- Versionsprüfung umfasst package.json, beide npm-Lockfile-Versionen,
  Tauri-Konfiguration, Cargo.toml, Cargo.lock und bei Tagläufen den Tag.
  Der Releasehelper verlangt einen sauberen Arbeitsbaum, prüft Tests vor
  dem Tag und staged nur Versionsdateien.

## Lokale Prüfergebnisse

Node 20.20.2, Chromium unter Linux:

- `npm ci`, `npm run check:release`, `npm run lint`, `npm test`: erfolgreich.
- 18 Unit-/Regressionstests einschließlich echter MCP-stdio-Kommunikation.
- `npm run build`: erfolgreicher TypeScript- und Vite-Produktionsbuild.
- Drei Chromium-Browsertests: Änderung/Speicherung/Fehlerbehandlung/Export,
  alle 17 kuratierten Diagrammvorlagen sowie visuelle Bearbeitung mit parallelen
  Kanten und Inline-Zielknoten. Keine unbehandelten Browserfehler.
- Zusätzlicher Vergleichslauf: fünf Änderungen benötigen 215/191/186/187/191 ms
  bis zur Vorschau (Median 191 ms), zuvor 567/536/536/532/532 ms (Median 536 ms).
  Das entspricht etwa 64 % geringerer beobachteter Latenz bei diesem kleinen
  Diagramm; keine Aussage über große Diagramme oder Modellantwortzeiten.
- `npm audit`: 0 Befunde über alle npm-Abhängigkeiten.
- Workflow-YAML und `git diff --check`: erfolgreich.
- `cargo metadata --locked`: erfolgreich; Cargo-Feature-Auflösung bestätigt
  die nativen macOS-/Windows-Backends. `cargo check` unter Linux scheitert an
  fehlender GLib-Systembibliothek. Kein nativer Build wurde hier bestätigt.

## Vor der Veröffentlichung noch erforderlich

1. Neue Version in allen Manifesten festlegen und geprüften Stand committen.
   Tag-Pipeline für diese Version ausführen; beide nativen Jobs müssen bestehen.
2. macOS-DMG und Windows-NSIS auf echten Zielsystemen installieren, starten,
   Diagramme importieren, visuell bearbeiten und SVG/PNG/PDF exportieren.
3. API-Schlüssel speichern, App vollständig beenden und neu starten;
   Wiederherstellung und Löschen im nativen Schlüsselspeicher prüfen.
   OpenAI und lokale Ollama-Verbindung separat testen.
4. Tatsächlich gebaute Architekturen, Signierung/Notarisierung und Windows-
   Signierung prüfen bzw. unsignierten Status transparent dokumentieren.
   Release Notes und Installer-Prüfsummen ergänzen, erst dann Draft publizieren.
5. Appwrite-Secrets und realen Deploymentlauf separat abschließen. Für die
   Produktwebsite sind öffentliche Release-/Downloadlinks weiterhin Voraussetzung.

Der Webbuild ist lokal geprüft und bereit zur Bereitstellung. Der Desktoprelease
ist noch nicht zur Veröffentlichung freigegeben.

## Folgestand: Kandidat 1.8.7

Die Manifestversionen wurden anschließend auf 1.8.7 angehoben. PR-Builds
für explizite macOS-ARM64-/Windows-x64-Ziele sind vorbereitet. Gemeinsamer
Bereitstellungs- und Abnahmeablauf: [RELEASE_1.8.7.md](RELEASE_1.8.7.md).
