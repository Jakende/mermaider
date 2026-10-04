# Direkte npm-Abhängigkeiten und Lizenzangaben

Stand 02.10.2026, aus den installierten Paketmanifesten des Lockfiles gelesen.
Diese Übersicht erfasst direkte Abhängigkeiten; sie ersetzt keine Lizenztexte
oder vollständige Erfassung transitiver npm-/Rust-Abhängigkeiten. Die jeweilige
Paketlizenz gilt zusätzlich zur Projektlizenz.

| Paket | Installierte Version | Lizenzangabe |
| --- | --- | --- |
| @blobatar/react | 2.7.0 | MIT |
| blobatar | 2.7.0 | MIT |
| @modelcontextprotocol/sdk | 1.31.0 | MIT |
| @monaco-editor/react | 4.7.0 | MIT |
| @tauri-apps/api | 2.11.1 | Apache-2.0 OR MIT |
| @tauri-apps/plugin-http | 2.5.9 | MIT OR Apache-2.0 |
| @types/html2canvas | 0.5.35 | MIT |
| @xyflow/react | 12.12.0 | MIT |
| html2canvas | 1.4.1 | MIT |
| jspdf | 4.2.1 | MIT |
| localforage | 1.10.0 | Apache-2.0 |
| mermaid | 10.9.8 | MIT |
| react | 18.3.1 | MIT |
| react-dom | 18.3.1 | MIT |
| zod | 4.6.5 | MIT |

Tauri und tauri-plugin-http werden als Rust-Abhängigkeiten unter MIT/Apache-2.0
bereitgestellt; keyring unter MIT/Apache-2.0. Deren originale Hinweise in den
Crates bleiben erhalten. Vollständige Distribution-Hinweise sind beim finalen
nativen Release gegen den tatsächlichen Bundleinhalt abzugleichen.
