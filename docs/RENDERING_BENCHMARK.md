# Rendering reference measurements

Run `npm run build`, then `node scripts/benchmark-rendering.mjs`. Optionally pass
an output filename. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` selects an installed
Chromium; otherwise install Playwright Chromium first.

The [raw measurements](fixtures/render-benchmark-1.9.0.json) record hardware,
browser, viewport, individual runs and emitted asset sizes. They cover 10, 50 and
200-node flowcharts, three runs each, with a fresh render and exact repeat after
changing the diagram. Wall time includes editor debounce and browser polling;
`renderMs` measures Mermaid rendering separately. All nine repeats hit the cache.
This is a small cloud reference measurement, not desktop-device acceptance.

Editor and Mermaid are separate lazy chunks. Monaco and its worker are bundled
locally, removing a runtime CDN dependency at the cost of a larger distribution.
The initial app chunk is about 1.1 MB before gzip; Monaco about 2.8 MB. Large
Mermaid diagram modules remain separate chunks and Vite still reports large
chunks. The distribution is approximately 8.2 MB before compression.

The in-memory LRU retains at most eight SVGs within a one-million-character budget;
individual SVGs above half that budget bypass it. Cache keys include source,
render configuration and text transformation; unique SVG IDs are regenerated.
Fresh node handlers and decision overlays attach after retrieval. No diagram
content is persisted by this cache or sent to a server.

Monaco uses its dedicated worker. Mermaid's layout relies on DOM/font measurement;
moving the whole renderer into a DOM-less worker would change its contract.
The serial render queue and cancellation stay intact. A worker-only layout engine
would need independent visual comparisons before adoption.
