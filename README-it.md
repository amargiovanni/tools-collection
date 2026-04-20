# Tools Collection

Una raccolta modulare e type-safe di 44 strumenti per sviluppatori che funzionano nel browser. Costruita con Astro, Solid.js, TypeScript strict e Tailwind CSS 4. Distribuibile su Cloudflare Pages o su qualsiasi hosting statico.

![CI](https://github.com/amargiovanni/tools-collection/actions/workflows/ci.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg)
![Astro](https://img.shields.io/badge/Astro-6-ff5d01.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Cosa Fa

44 strumenti che girano interamente nel browser: nessun dato lascia la tua macchina, ad eccezione della generazione QR, che usa un'API esterna. Cinque lingue (EN/IT/ES/FR/DE), switch tema (chiaro/scuro/sistema) e command palette (`Ctrl/Cmd+K`) per navigare rapidamente.

Novità della `1.5.0`: generatori browser-safe per API key, JWT secret, HMAC key, salt, codici di recupero, passphrase e stringhe casuali; in più il color picker chiarisce i formati supportati (HEX/RGB/HSL) e accetta direttamente `rgb()`, `rgba()`, `hsl()` e `hsla()`.

## Strumenti

| Categoria | Strumenti |
|---|---|
| **Elaborazione Testo** | List Generator, Add Text to Lines, Convert Case, Remove Duplicate Lines, Remove Line Breaks, Remove Lines Containing |
| **Generatori** | Password Generator (crypto API), Passphrase Generator, Random String Generator, API Key Generator, JWT Secret Generator, Username Generator, PIN Generator, UUID Generator, BitTorrent Magnet Link Generator |
| **Estrazione** | Domain Extractor, Email Extractor |
| **Analisi** | Count Duplicates, Text Counter |
| **Sicurezza** | PEM Certificate Inspector, AES Key Generator, HMAC Key Generator, Salt Generator, Recovery Code Generator, Rclone Password Revealer, Password Strength Checker, QR Code Generator/Reader |
| **Convertitori** | Emoji Shortcode, Base64 Encoder/Decoder, URL Encoder/Decoder, Data Size Converter, Number Base Converter |
| **Sviluppo** | JSON Formatter/Validator, Diff Checker, Regex Tester, XML Beautifier, Cron Expression Parser, JWT Decoder |
| **Utilità** | Color Picker (HEX/RGB/HSL), Timestamp Converter, Time Convert, Reg2GPO, Hash Generator, CSV Viewer |

## Stack Tecnologico

| Livello | Tecnologia |
|---|---|
| Meta-framework | [Astro](https://astro.build/) 6 — generazione statica, code splitting per pagina |
| Framework UI | [Solid.js](https://www.solidjs.com/) — reattività fine-grained, zero virtual DOM |
| Styling | [Tailwind CSS](https://tailwindcss.com/) 4 — design token via `@theme`, switch tema (chiaro/scuro/sistema) |
| Type safety | TypeScript strict — `noUncheckedIndexedAccess`, zero `any` |
| i18n | Messaggi JSON type-safe con validazione compile-time delle chiavi |
| Ricerca | [Fuse.js](https://www.fusejs.io/) — fuzzy search nella command palette |
| Test | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) — copertura unit ed end-to-end su tool, componenti condivisi e navigazione |
| Varianti | [cva](https://cva.style/) — varianti componenti type-safe |

## Architettura

Ogni tool è separato con chiarezza in tre livelli:

```text
src/tools/json-formatter.ts             ← Logica pura (senza DOM, restituisce Result<T>)
src/components/tools/JsonFormatter.tsx ← UI Solid.js (compone componenti condivisi)
src/pages/[lang]/tools/[tool].astro     ← Pagina Astro (monta l'island con client:load)
```

```text
src/
├── components/
│   ├── ui/                # 13 componenti Solid riutilizzabili (Button, TextArea, OutputPanel, ...)
│   ├── tools/             # più di 30 componenti UI tool (uno per tool)
│   ├── Sidebar.astro      # Navigazione per categorie
│   └── HomeCatalog.astro
├── config/
│   ├── tools.ts           # Registry tool (44 voci con metadati)
│   └── tool-components.ts # Mapping componenti lazy (code splitting via SolidJS lazy())
├── i18n/
│   ├── index.ts           # Helper type-safe t(lang, key)
│   └── messages/          # en/it/es/fr/de.json
├── islands/
│   ├── CommandPalette.tsx # Fuzzy search via Ctrl/Cmd+K
│   └── ToolRenderer.tsx   # Dispatcher dinamico componenti tool
├── layouts/
│   ├── BaseLayout.astro   # HTML head, SEO, redirect legacy
│   └── ToolLayout.astro   # Sidebar + header + slot tool
├── lib/
│   ├── result.ts          # Tipo Result<T> per error handling
│   ├── useToolState.ts    # Hook condiviso per salvataggio/ripristino stato URL
│   ├── validation.ts      # Validazione input condivisa (validateNonEmpty)
│   ├── clipboard.ts       # Copia con fallback
│   └── download.ts        # Utility download file
├── pages/
│   ├── index.astro        # Redirect root → /{lang}/
│   └── [lang]/            # Route dinamiche per tutte e 5 le lingue
├── styles/
│   └── global.css         # Tailwind 4 @theme tokens + dark mode
└── tools/                 # 44 moduli di logica pura (zero DOM)
```

## Avvio Rapido

### Prerequisiti

- Node.js 22+
- npm

### Installazione e Avvio

```bash
git clone https://github.com/amargiovanni/tools-collection.git
cd tools-collection
npm install
npm run dev
```

Apri `http://localhost:4321`.

### Build per Produzione

```bash
npm run build
npm run preview
```

L'output viene generato in `dist/`: 226 pagine HTML statiche (44 tool per lingua x 5 + homepage + redirect root) pronte per qualsiasi hosting.

### Docker

```bash
docker compose up --build -d
```

Disponibile su `http://localhost:8080`.

Per impostare la lingua predefinita mostrata alla prima visita, passa `DEFAULT_LANGUAGE` (`en`, `it`, `es`, `fr` o `de`) tramite Docker Compose:

```bash
DEFAULT_LANGUAGE=it docker compose up --build -d
```

Se il browser ha gia una preferenza lingua salvata in `localStorage`, quella continua ad avere priorita.

### Logo Personalizzato

L'applicazione può mostrare un logo personalizzato preso da `data/logo.png` nella hero della home e accanto a `Online Tools` nella sidebar/header dei tool.

- Percorso atteso nel repository: `./data/logo.png`
- Percorso atteso nel container: `/usr/share/nginx/html/data/logo.png`
- Se il file manca o non è leggibile, viene mostrato il logo di fallback integrato

#### Permessi del file

L'immagine deve essere leggibile dal web server che gira nel container. Evita permessi restrittivi come `0600`.

Impostazione consigliata:

```bash
chmod 0644 data/logo.png
```

### Deploy su Cloudflare Pages

Non serve alcun adapter: l'output statico di Astro funziona direttamente.

1. Collega il repository GitHub a Cloudflare Pages
2. Build command: `npm run build`
3. Output directory: `dist`

## Sviluppo

### Comandi

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il server di sviluppo con HMR |
| `npm run build` | Build di produzione (226 pagine) |
| `npm run preview` | Anteprima della build di produzione |
| `npm run test` | Esegue i test unitari |
| `npm run test:watch` | Esegue i test unitari in watch mode |
| `npm run test:coverage` | Esegue i test unitari con report di copertura |
| `npm run test:e2e` | Esegue i test e2e Playwright nel browser |
| `npm run test:e2e:ui` | Esegue i test e2e con UI interattiva |
| `npm run check` | Type check Astro |

### Test

Vitest copre i moduli di logica dei tool, gli helper i18n e i componenti condivisi:

```bash
npm test
```

Playwright copre i flussi dei tool e la navigazione nel browser:

```bash
npm run build && npm run test:e2e
```

Usa `npm run test:e2e:ui` per un'interfaccia interattiva dove puoi eseguire i test uno alla volta e ispezionare lo stato del browser.

### Aggiungere un Nuovo Tool

1. **Logica pura** — Crea `src/tools/my-tool.ts` che restituisce `Result<T>`
2. **Test** — Crea `tests/tools/my-tool.test.ts`
3. **Componente UI** — Crea `src/components/tools/MyTool.tsx` componendo `src/components/ui/*`
4. **Registry** — Aggiungi la voce in `src/config/tools.ts`
5. **Component map** — Aggiungi l'import in `src/config/tool-components.ts`
6. **i18n** — Aggiungi le chiavi in tutti i 5 file locale (`en.json`, `it.json`, `es.json`, `fr.json`, `de.json`)
7. **Test e2e** — Crea `e2e/tools/my-tool.spec.ts` usando l'helper `toolTest`

Il tool ottiene automaticamente una pagina in `/{lang}/tools/my-tool` e compare in sidebar, home e command palette.

### Design Token

I colori sono definiti come custom property CSS in `src/styles/global.css` tramite la direttiva `@theme` di Tailwind 4. Il dark mode è controllato con un attributo `data-theme` su `<html>`. Gli utenti possono scegliere tra chiaro, scuro e sistema tramite il pulsante tema. La preferenza viene salvata in `localStorage`.

## Privacy

- Tutta l'elaborazione avviene nel browser
- Nessun analytics, nessun tracking, nessun cookie
- La generazione QR è l'unica eccezione: usa `api.qrserver.com`
- Password e PIN usano `crypto.getRandomValues()` (crittograficamente sicuro)

## Licenza

MIT — vedi [LICENSE](LICENSE).

## Autori

- **Andrea Margiovanni** — [@amargiovanni](https://github.com/amargiovanni)
- **Giovanni "Gioxx" Solone** — [@gioxx](https://github.com/gioxx)

---

<div align="center">
  <a href="https://github.com/amargiovanni/tools-collection/issues">Segnala un bug</a> · <a href="https://github.com/amargiovanni/tools-collection/issues">Richiedi una feature</a>
</div>
