import './style.css'

// Fixed, authored examples: no editor or model dependencies on the product page.
const examples = {
  flow: {
    code: 'flowchart LR\n  A[Idee] --> B[Diagramm]\n  B --> C[Teilen]',
    diagram: `<svg viewBox="0 0 510 230" role="img" aria-label="Ablauf: Idee führt zu Diagramm, Diagramm führt zu Teilen" xmlns="http://www.w3.org/2000/svg"><defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#6983ad"/></marker></defs><g fill="none" stroke="#6983ad" stroke-width="2" marker-end="url(#flow-arrow)"><path d="M132 115H188"/><path d="M322 115H378"/></g><g stroke-width="1.5"><rect x="12" y="84" width="120" height="62" rx="9" fill="#f1f5fc" stroke="#c0cee2"/><rect x="190" y="84" width="132" height="62" rx="9" fill="#e9efff" stroke="#255be7"/><rect x="380" y="84" width="118" height="62" rx="9" fill="#f1f5fc" stroke="#c0cee2"/></g><g fill="#243b60" font-family="system-ui,sans-serif" font-size="17" text-anchor="middle"><text x="72" y="121">Idee</text><text x="256" y="121">Diagramm</text><text x="439" y="121">Teilen</text></g></svg>`,
  },
  decision: {
    code: 'flowchart LR\n  A{Bereit?} -->|Ja| B[Teilen]\n  A -->|Nein| C[Überarbeiten]',
    diagram: `<svg viewBox="0 0 510 230" role="img" aria-label="Entscheidung: Bereit? Bei Ja teilen, bei Nein überarbeiten" xmlns="http://www.w3.org/2000/svg"><defs><marker id="decision-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#6983ad"/></marker></defs><g fill="none" stroke="#6983ad" stroke-width="2" marker-end="url(#decision-arrow)"><path d="M182 115H245V57H324"/><path d="M182 115H245V174H324"/></g><path d="M110 43L182 115L110 187L38 115Z" fill="#e9efff" stroke="#255be7" stroke-width="1.5"/><g fill="#f1f5fc" stroke="#c0cee2" stroke-width="1.5"><rect x="326" y="28" width="162" height="58" rx="9"/><rect x="326" y="145" width="162" height="58" rx="9"/></g><g fill="#243b60" font-family="system-ui,sans-serif" font-size="17" text-anchor="middle"><text x="110" y="121">Bereit?</text><text x="407" y="63">Teilen</text><text x="407" y="180">Überarbeiten</text></g><g fill="#536178" font-family="system-ui,sans-serif" font-size="14"><text x="268" y="46">Ja</text><text x="268" y="163">Nein</text></g></svg>`,
  },
}
const diagram = document.querySelector<HTMLElement>('#diagram')!
const code = document.querySelector<HTMLElement>('#example-code')!
function showExample(name: keyof typeof examples) {
  diagram.innerHTML = examples[name].diagram // Trusted literals only, never external input.
  code.textContent = examples[name].code
  document.querySelectorAll<HTMLButtonElement>('[data-example]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.example === name))
  })
}
showExample('flow')
document.querySelectorAll<HTMLButtonElement>('[data-example]').forEach(button => {
  button.addEventListener('click', () => showExample(button.dataset.example as keyof typeof examples))
})

// Published downloads are opt-in, reviewed configuration, never guessed URLs.
// Until release approval, the page honestly shows the candidate's status.
type Download = { url: string; signed: boolean }
type Release = { version: string; published: boolean; notesUrl: string; macos?: Download; windows?: Download }
function safeHttps(value: string): string | null {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null } catch { return null }
}
async function loadRelease() {
  try {
    const response = await fetch('./release.json', { cache: 'no-cache' })
    if (!response.ok) return
    const release: Release = await response.json()
    if (release.published !== true || !/^\d+\.\d+\.\d+$/.test(release.version)) return
    const notes = safeHttps(release.notesUrl)
    if (!notes) return
    let available = 0
    for (const platform of ['macos', 'windows'] as const) {
      const download = release[platform]
      if (!download || typeof download.signed !== 'boolean') continue
      const url = safeHttps(download.url)
      if (!url) continue
      const link = document.querySelector<HTMLAnchorElement>(`#download-${platform}`)!
      link.href = url
      link.hidden = false
      const card = link.closest('article')!
      card.querySelector('p')!.textContent = `Version ${release.version} · ${platform === 'macos' ? 'DMG' : 'Installer'}`
      document.querySelector(`#status-${platform}`)!.textContent = download.signed
        ? 'Signierter Installer. Details und Prüfsummen in den Release Notes.'
        : 'Unsignierter Installer. Beachte die Installationshinweise in den Release Notes.'
      available++
    }
    if (available) {
      const link = document.querySelector<HTMLAnchorElement>('#release-notes')!
      link.href = notes
      link.hidden = false
      document.querySelector('#release-status')!.textContent = `Version ${release.version} verfügbar.`
    }
  } catch { /* Offline or unavailable config: keep the useful, truthful default. */ }
}
void loadRelease()
