import '../assets/design-tokens.css'
import '../assets/components.css'
import './style.css'

const english = document.documentElement.lang === 'en'
const languageLink = document.querySelector<HTMLAnchorElement>('[data-language]')!
try {
  if (!english && localStorage.getItem('mermaider-website-language') === 'en') {
    window.location.replace('/website/en/' + window.location.hash)
  }
} catch { /* Both language links work without storage. */ }
languageLink.addEventListener('click', () => {
  try { localStorage.setItem('mermaider-website-language', languageLink.dataset.language!) } catch { /* Optional persistence. */ }
})

// Share the application's theme preference; tolerate unavailable browser storage.
const themeButton = document.querySelector<HTMLButtonElement>('#theme-toggle')!
function applyTheme(light: boolean) {
  document.body.classList.toggle('theme-invert', light)
  themeButton.textContent = english ? (light ? 'Dark' : 'Light') : (light ? 'Dunkel' : 'Hell')
  themeButton.setAttribute('aria-label', english
    ? (light ? 'Switch to dark theme' : 'Switch to light theme')
    : (light ? 'Dunkles Design aktivieren' : 'Helles Design aktivieren'))
  document.querySelector('meta[name="theme-color"]')!.setAttribute('content', light ? '#ffffff' : '#000000')
}
try { applyTheme(localStorage.getItem('mermaider-theme') === 'light') } catch { applyTheme(false) }
themeButton.addEventListener('click', () => {
  const light = !document.body.classList.contains('theme-invert')
  applyTheme(light)
  try { localStorage.setItem('mermaider-theme', light ? 'light' : 'dark') } catch { /* Theme still works without persistence. */ }
})

// Fixed, authored examples: no editor or model dependencies on the product page.
const examples = {
  flow: {
    code: 'flowchart LR\n  A[Idee] --> B[Diagramm]\n  B --> C[Teilen]',
    diagram: `<svg viewBox="0 0 510 230" role="img" aria-label="Ablauf: Idee führt zu Diagramm, Diagramm führt zu Teilen" xmlns="http://www.w3.org/2000/svg"><defs><marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs><g fill="none" stroke="var(--muted)" stroke-width="2" marker-end="url(#flow-arrow)"><path d="M132 115H188"/><path d="M322 115H378"/></g><g stroke-width="1.5"><rect x="12" y="84" width="120" height="62" rx="0" fill="var(--surface)" stroke="var(--border)"/><rect x="190" y="84" width="132" height="62" rx="0" fill="var(--surface)" stroke="var(--ink)"/><rect x="380" y="84" width="118" height="62" rx="0" fill="var(--surface)" stroke="var(--border)"/></g><g fill="var(--ink)" font-family="var(--font-mono)" font-size="17" text-anchor="middle"><text x="72" y="121">Idee</text><text x="256" y="121">Diagramm</text><text x="439" y="121">Teilen</text></g></svg>`,
  },
  decision: {
    code: 'flowchart LR\n  A{Bereit?} -->|Ja| B[Teilen]\n  A -->|Nein| C[Überarbeiten]',
    diagram: `<svg viewBox="0 0 510 230" role="img" aria-label="Entscheidung: Bereit? Bei Ja teilen, bei Nein überarbeiten" xmlns="http://www.w3.org/2000/svg"><defs><marker id="decision-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="var(--muted)"/></marker></defs><g fill="none" stroke="var(--muted)" stroke-width="2" marker-end="url(#decision-arrow)"><path d="M182 115H245V57H324"/><path d="M182 115H245V174H324"/></g><path d="M110 43L182 115L110 187L38 115Z" fill="var(--surface)" stroke="var(--ink)" stroke-width="1.5"/><g fill="var(--surface)" stroke="var(--border)" stroke-width="1.5"><rect x="326" y="28" width="162" height="58" rx="0"/><rect x="326" y="145" width="162" height="58" rx="0"/></g><g fill="var(--ink)" font-family="var(--font-mono)" font-size="17" text-anchor="middle"><text x="110" y="121">Bereit?</text><text x="407" y="63">Teilen</text><text x="407" y="180">Überarbeiten</text></g><g fill="var(--muted)" font-family="var(--font-mono)" font-size="14"><text x="268" y="46">Ja</text><text x="268" y="163">Nein</text></g></svg>`,
  },
}
const diagram = document.querySelector<HTMLElement>('#diagram')!
const code = document.querySelector<HTMLElement>('#example-code')!
function showExample(name: keyof typeof examples) {
  const translate = (text: string) => english ? text.replace(/Ablauf|Entscheidung|Bereit\?|Überarbeiten|Diagramm|Teilen|Idee|Bei Ja teilen, bei Nein überarbeiten|Ja|Nein/g,
    word => ({ Ablauf: 'Workflow', Entscheidung: 'Decision', 'Bereit?': 'Ready?', Überarbeiten: 'Revise', Diagramm: 'Diagram', Teilen: 'Share', Idee: 'Idea', 'Bei Ja teilen, bei Nein überarbeiten': 'If yes, share; if no, revise', Ja: 'Yes', Nein: 'No' }[word]!))
    .replace('führt zu', 'leads to').replace('führt zu', 'leads to') : text
  diagram.innerHTML = translate(examples[name].diagram) // Trusted authored literals only.
  code.textContent = translate(examples[name].code)
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
    const response = await fetch('/website/release.json', { cache: 'no-cache' })
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
      document.querySelector(`#status-${platform}`)!.textContent = english
        ? (download.signed
          ? 'Signed installer. See the release notes for details and checksums.'
          : 'Unsigned installer. Read the installation instructions in the release notes.')
        : download.signed
        ? 'Signierter Installer. Details und Prüfsummen in den Release Notes.'
        : 'Unsignierter Installer. Beachte die Installationshinweise in den Release Notes.'
      available++
    }
    if (available) {
      const link = document.querySelector<HTMLAnchorElement>('#release-notes')!
      link.href = notes
      link.hidden = false
      document.querySelector('#release-status')!.textContent = english ? `Version ${release.version} available.` : `Version ${release.version} verfügbar.`
    }
  } catch { /* Offline or unavailable config: keep the useful, truthful default. */ }
}
void loadRelease()
