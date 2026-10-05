# Mermaider 1.9.0

Decision flows can now combine confirmed upstream answers, replay retained full
history snapshots, compare states and export reports. Versioned MCP and local API
updates stay visible for review and cannot overwrite a newer session revision.
Three example flows and configurable keyboard shortcuts make the new features
accessible without configuring an AI provider.

The editor is bundled for offline desktop use. Editor and Mermaid modules load
separately, and a bounded in-memory SVG cache reuses identical renders. Clicking
an answer that needs review correctly focuses its question.

The website and readme are available in English, with a persistent DE/EN website
switcher. The current desktop builds include these changes.

Laya has a pinned local server wrapper, connection check and bilingual repeated
model benchmark. An optional local relay provides real SSE transport with a
180-second limit; the standard hosted Appwrite service remains buffered and
bounded to 50 seconds. The relay does not make the chat UI display tokens live.

These macOS ARM64 and Windows x64 installers are **unsigned**. Review
[installation instructions](https://github.com/Jakende/mermaider/blob/v1.9.0/docs/DESKTOP_INSTALL.md).
Their CI build checks are separate from practical device acceptance; the previously
accepted 1.8.7 files remain available unchanged. Decisions remains Preview.

Intel Mac/Linux candidates and signing workflows are prepared separately.
Apple/Windows certificates, real Laya/model measurements and installation on
additional platform devices require the owner's setup; no such acceptance is claimed.
See [Laya setup](https://github.com/Jakende/mermaider/blob/v1.9.0/docs/LAYA_SETUP.md),
[signing setup](https://github.com/Jakende/mermaider/blob/v1.9.0/docs/SIGNING_SETUP.md)
and [roadmap status](https://github.com/Jakende/mermaider/blob/v1.9.0/docs/ROADMAP.md).

MIT license; contributor credit and third-party attribution are retained in
LICENSE and ATTRIBUTION.md. SHA256SUMS.txt and BUILD_PROVENANCE.json identify the
new installer files and their exact source.
