# Herkunftsprüfung vor öffentlicher Freigabe

Stand: 02.10.2026. Erste Sichtung, keine abgeschlossene Rechteklärung.
Nutzervorgabe: Repository privat lassen, bis Quellcode bereinigt und die
Urheberzuordnung nachvollziehbar ist. Kein Release wurde öffentlich freigegeben.

## Belegte Befunde

- Die Git-Historie enthält Beiträge von Jakob Endemann, Dario Novoa, Appwrite
  und Dependabot. Autor-Metadaten sind Hinweise auf Beiträge, kein Beweis für
  alleinige Rechte an sämtlichen Inhalten.
- Commit `c391d01` von Dario Novoa am 31.10.2025 fügte eine CC BY-NC-SA 4.0
  LICENSE hinzu und änderte Lizenzangaben in README und Manifesten. Frühere
  Beiträge betreffen unter anderem die Anwendung und den visuellen Editor
  (`4d46bfb`). Eine pauschale Zuordnung aller Quellen zu Jakob wäre unzutreffend.
- Commit `a5cbe7e` von Appwrite am 02.11.2025 ersetzte LICENSE durch MIT mit
  `Copyright (c) 2024 Appwrite` und änderte/ergänzte zahlreiche Dateien. Dieser
  Wechsel allein belegt keine Erlaubnis zur Umlizenzierung zuvor übernommener
  Beiträge.
- Commit `b49ae24` stimmt auf Nutzerwunsch die aktuellen Projektangaben auf MIT
  ab und erhält den bestehenden Appwrite-Hinweis. Die konfigurierte MIT-Lizenz
  ist bislang kein Nachweis, dass sämtliche übernommenen Teile unter MIT
  veröffentlicht werden dürfen.
- `.test-compile/` enthält eine vollständige historische Projektkopie und wird
  nicht vom aktuellen Build benötigt. Entfernung aus dem aktuellen Baum
  bereinigt weder die Git-Historie noch die Herkunft aktiver Quellen.

## Verbleibende Arbeit

1. Aktive Dateien und Assets mit ihrer ursprünglichen Herkunft/Lizenz abgleichen,
   insbesondere vor und nach dem Appwrite-Commit. Übernommene CC-Anteile und
   spätere eigenständige Beiträge dokumentieren.
2. Falls übernommene Teile nicht unter MIT freigegeben wurden: entsprechende
   Zustimmung der Rechteinhaber belegen oder die betroffenen Teile mit einer
   passenden Lizenz erhalten bzw. unabhängig ersetzen. Namensänderungen oder
   Löschen von Hinweisen lösen die Rechtefrage nicht.
3. Entbehrliche Kopien und alte Projektangaben gezielt entfernen. Aktive Quellen,
   Assets, Dokumentation und Git-Historie auf sensible Inhalte prüfen. Bisher
   wurde keine vollständige Secret-/Historienprüfung durchgeführt.
4. Eigene Beiträge und berechtigte Fremdhinweise sichtbar zuordnen. Erst nach
   abgeschlossener Prüfung Repository und öffentliche Downloads freigeben.

Bis dahin bleibt das Repository privat und das Downloadmanifest unveröffentlicht.
