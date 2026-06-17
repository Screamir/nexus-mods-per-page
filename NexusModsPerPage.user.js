// ==UserScript==
// @name         Nexus's Mods Per Page
// @namespace    https://github.com/Screamir/nexus-mods-per-page
// @version      1.2
// @description  Load 40/60/80/100 mods on one page or use infinite scroll for the whole listing via Nexus Mods GraphQL. Installable in parallel with stable.
// @author       Screamir
// @match        https://www.nexusmods.com/games/*
// @match        https://www.nexusmods.com/mods*
// @run-at       document-idle
// @grant        none
// @noframes
// @supportURL   https://github.com/Screamir/nexus-mods-per-page/issues
// @license      MIT
// @compatible   firefox
// @compatible   chrome
// @compatible   edge
// @compatible   safari
// @downloadURL https://update.greasyfork.org/scripts/582461/Nexus%27s%20Mods%20Per%20Page.user.js
// @updateURL https://update.greasyfork.org/scripts/582461/Nexus%27s%20Mods%20Per%20Page.meta.js
// ==/UserScript==
//
// === Privacy / Adblock notes ===
//   * Only talks to Nexus Mods' own GraphQL API
//     (https://api-router.nexusmods.com/graphql) — same endpoint the
//     site itself uses. No third-party requests, no analytics, no
//     tracking, no eval/Function, no iframes, no fingerprinting, no
//     ads, no remote-loaded code.
//   * All injected DOM nodes use the "nmpp-" id/data-attribute
//     prefix — no element ids match generic ad selectors.
//   * Tested with uBlock Origin and AdGuard with default + Annoyances
//     filter lists enabled. No conflicts.

(function () {
  'use strict'

  // ===================== I18N =====================
  // 11 языков покрывают ~85% аудитории Nexus. Fallback: en.
  // Добавить язык — просто скопируй блок en, переведи все ключи, ключ — ISO-639-1 код.
  const STRINGS = {
    en: {
      waitReact: 'Waiting for React render…',
      loadingUpTo: 'Loading up to {n}…',
      doneTarget: 'Done: {loaded} of {total}',
      totalAll: '{total} mods total',
      error: 'Error: {msg}',
      errLoad: 'Loading error: {msg}. Scroll down to retry.',
      infinite: 'Infinite scroll: {have} / {total}',
      perPage: '{n} per page',
      allInfinite: 'All (infinite scroll)',
      loadingStatus: 'Loading {from}–{to} of {total}',
      loadingInd: 'Loading mods {from}–{to}{ofTotal}…',
      allLoaded: 'Done: all {total} mods loaded',
      allLoadedShort: 'Done: all loaded ({total})',
      loadedScroll: 'Loaded {have} of {total}. Scroll for more…',
      loadedInitial: 'Loaded {n}{ofTotal}. Scroll for more…',
      scrollHint: 'Scroll down to load…',
      gqlBadShape: 'GraphQL: unexpected response shape (Nexus may have changed the API)',
      ofTotal: ' of {total}',
      paginationOf: '{from}–{to} of {total}'
    },
    ru: {
      waitReact: 'Жду рендер React…',
      loadingUpTo: 'Загружаю до {n}…',
      doneTarget: 'Готово: {loaded} из {total}',
      totalAll: '{total} модов всего',
      error: 'Ошибка: {msg}',
      errLoad: 'Ошибка загрузки: {msg}. Прокрути ниже для повтора.',
      infinite: 'Бесконечная прокрутка: {have} / {total}',
      perPage: '{n} на странице',
      allInfinite: 'Все (бесконечная прокрутка)',
      loadingStatus: 'Загружаю {from}–{to} из {total}',
      loadingInd: 'Загружаю моды {from}–{to}{ofTotal}…',
      allLoaded: 'Готово: все {total} модов загружены',
      allLoadedShort: 'Готово: всё загружено ({total})',
      loadedScroll: 'Загружено {have} из {total}. Прокрути ниже для следующих…',
      loadedInitial: 'Загружено {n}{ofTotal}. Прокрути ниже для следующих…',
      scrollHint: 'Прокрути ниже для загрузки…',
      gqlBadShape: 'GraphQL: неожиданная форма ответа (возможно Nexus поменял API)',
      ofTotal: ' из {total}',
      paginationOf: '{from}–{to} из {total}'
    },
    hi: {
      waitReact: 'React रेंडर की प्रतीक्षा…',
      loadingUpTo: '{n} तक लोड हो रहा है…',
      doneTarget: 'पूर्ण: {total} में से {loaded}',
      totalAll: 'कुल {total} मॉड्स',
      error: 'त्रुटि: {msg}',
      errLoad: 'लोड करने में त्रुटि: {msg}. पुनः प्रयास के लिए नीचे स्क्रॉल करें.',
      infinite: 'अनंत स्क्रॉल: {have} / {total}',
      perPage: '{n} प्रति पृष्ठ',
      allInfinite: 'सभी (अनंत स्क्रॉल)',
      loadingStatus: '{total} में से {from}–{to} लोड हो रहा है',
      loadingInd: 'मॉड्स {from}–{to}{ofTotal} लोड हो रहे हैं…',
      allLoaded: 'पूर्ण: सभी {total} मॉड्स लोड हो गए',
      allLoadedShort: 'पूर्ण: सब लोड हो गया ({total})',
      loadedScroll: '{total} में से {have} लोड हो गए. अधिक के लिए नीचे स्क्रॉल करें…',
      loadedInitial: '{n}{ofTotal} लोड हो गए. अधिक के लिए नीचे स्क्रॉल करें…',
      scrollHint: 'लोड करने के लिए नीचे स्क्रॉल करें…',
      gqlBadShape: 'GraphQL: अप्रत्याशित प्रतिक्रिया रूप (Nexus ने API बदला हो सकता है)',
      ofTotal: ' / {total}',
      paginationOf: '{total} में से {from}–{to}'
    },
    de: {
      waitReact: 'Warte auf React-Rendering…',
      loadingUpTo: 'Lade bis zu {n}…',
      doneTarget: 'Fertig: {loaded} von {total}',
      totalAll: '{total} Mods insgesamt',
      error: 'Fehler: {msg}',
      errLoad: 'Ladefehler: {msg}. Nach unten scrollen, um es erneut zu versuchen.',
      infinite: 'Endloses Scrollen: {have} / {total}',
      perPage: '{n} pro Seite',
      allInfinite: 'Alle (endloses Scrollen)',
      loadingStatus: 'Lade {from}–{to} von {total}',
      loadingInd: 'Lade Mods {from}–{to}{ofTotal}…',
      allLoaded: 'Fertig: alle {total} Mods geladen',
      allLoadedShort: 'Fertig: alles geladen ({total})',
      loadedScroll: '{have} von {total} geladen. Weiter scrollen für mehr…',
      loadedInitial: '{n}{ofTotal} geladen. Weiter scrollen für mehr…',
      scrollHint: 'Nach unten scrollen zum Laden…',
      gqlBadShape: 'GraphQL: unerwartete Antwortform (Nexus hat eventuell die API geändert)',
      ofTotal: ' von {total}',
      paginationOf: '{from}–{to} von {total}'
    },
    fr: {
      waitReact: 'Attente du rendu React…',
      loadingUpTo: 'Chargement jusqu’à {n}…',
      doneTarget: 'Terminé : {loaded} sur {total}',
      totalAll: '{total} mods au total',
      error: 'Erreur : {msg}',
      errLoad: 'Erreur de chargement : {msg}. Faites défiler pour réessayer.',
      infinite: 'Défilement infini : {have} / {total}',
      perPage: '{n} par page',
      allInfinite: 'Tous (défilement infini)',
      loadingStatus: 'Chargement {from}–{to} sur {total}',
      loadingInd: 'Chargement des mods {from}–{to}{ofTotal}…',
      allLoaded: 'Terminé : tous les {total} mods chargés',
      allLoadedShort: 'Terminé : tout chargé ({total})',
      loadedScroll: '{have} sur {total} chargés. Faites défiler pour plus…',
      loadedInitial: '{n}{ofTotal} chargés. Faites défiler pour plus…',
      scrollHint: 'Faites défiler pour charger…',
      gqlBadShape: 'GraphQL : forme de réponse inattendue (Nexus a peut-être changé l’API)',
      ofTotal: ' sur {total}',
      paginationOf: '{from}–{to} sur {total}'
    },
    es: {
      waitReact: 'Esperando renderizado de React…',
      loadingUpTo: 'Cargando hasta {n}…',
      doneTarget: 'Listo: {loaded} de {total}',
      totalAll: '{total} mods en total',
      error: 'Error: {msg}',
      errLoad: 'Error al cargar: {msg}. Desplaza hacia abajo para reintentar.',
      infinite: 'Desplazamiento infinito: {have} / {total}',
      perPage: '{n} por página',
      allInfinite: 'Todos (scroll infinito)',
      loadingStatus: 'Cargando {from}–{to} de {total}',
      loadingInd: 'Cargando mods {from}–{to}{ofTotal}…',
      allLoaded: 'Listo: todos los {total} mods cargados',
      allLoadedShort: 'Listo: todo cargado ({total})',
      loadedScroll: '{have} de {total} cargados. Desplaza para más…',
      loadedInitial: '{n}{ofTotal} cargados. Desplaza para más…',
      scrollHint: 'Desplaza hacia abajo para cargar…',
      gqlBadShape: 'GraphQL: forma de respuesta inesperada (Nexus puede haber cambiado la API)',
      ofTotal: ' de {total}',
      paginationOf: '{from}–{to} de {total}'
    },
    it: {
      waitReact: 'In attesa del rendering di React…',
      loadingUpTo: 'Caricamento fino a {n}…',
      doneTarget: 'Fatto: {loaded} di {total}',
      totalAll: '{total} mod in totale',
      error: 'Errore: {msg}',
      errLoad: 'Errore di caricamento: {msg}. Scorri in basso per riprovare.',
      infinite: 'Scorrimento infinito: {have} / {total}',
      perPage: '{n} per pagina',
      allInfinite: 'Tutti (scorrimento infinito)',
      loadingStatus: 'Caricamento {from}–{to} di {total}',
      loadingInd: 'Caricamento mod {from}–{to}{ofTotal}…',
      allLoaded: 'Fatto: tutti i {total} mod caricati',
      allLoadedShort: 'Fatto: tutto caricato ({total})',
      loadedScroll: '{have} di {total} caricati. Scorri per altri…',
      loadedInitial: '{n}{ofTotal} caricati. Scorri per altri…',
      scrollHint: 'Scorri in basso per caricare…',
      gqlBadShape: 'GraphQL: forma di risposta inattesa (Nexus potrebbe aver cambiato l’API)',
      ofTotal: ' di {total}',
      paginationOf: '{from}–{to} di {total}'
    },
    pl: {
      waitReact: 'Czekam na renderowanie React…',
      loadingUpTo: 'Ładowanie do {n}…',
      doneTarget: 'Gotowe: {loaded} z {total}',
      totalAll: '{total} modów w sumie',
      error: 'Błąd: {msg}',
      errLoad: 'Błąd ładowania: {msg}. Przewiń w dół, aby spróbować ponownie.',
      infinite: 'Nieskończone przewijanie: {have} / {total}',
      perPage: '{n} na stronę',
      allInfinite: 'Wszystkie (nieskończone przewijanie)',
      loadingStatus: 'Ładowanie {from}–{to} z {total}',
      loadingInd: 'Ładowanie modów {from}–{to}{ofTotal}…',
      allLoaded: 'Gotowe: wszystkie {total} mody załadowane',
      allLoadedShort: 'Gotowe: wszystko załadowane ({total})',
      loadedScroll: 'Załadowano {have} z {total}. Przewiń, aby kontynuować…',
      loadedInitial: 'Załadowano {n}{ofTotal}. Przewiń, aby kontynuować…',
      scrollHint: 'Przewiń w dół, aby załadować…',
      gqlBadShape: 'GraphQL: nieoczekiwany kształt odpowiedzi (Nexus mógł zmienić API)',
      ofTotal: ' z {total}',
      paginationOf: '{from}–{to} z {total}'
    },
    zh: {
      waitReact: '等待 React 渲染…',
      loadingUpTo: '加载至 {n}…',
      doneTarget: '完成：{total} 中的 {loaded}',
      totalAll: '共 {total} 个模组',
      error: '错误：{msg}',
      errLoad: '加载错误：{msg}。向下滚动重试。',
      infinite: '无限滚动：{have} / {total}',
      perPage: '每页 {n} 个',
      allInfinite: '全部（无限滚动）',
      loadingStatus: '加载 {from}–{to}（共 {total}）',
      loadingInd: '正在加载模组 {from}–{to}{ofTotal}…',
      allLoaded: '完成：所有 {total} 个模组已加载',
      allLoadedShort: '完成：全部已加载（{total}）',
      loadedScroll: '已加载 {have} / {total}。向下滚动查看更多…',
      loadedInitial: '已加载 {n}{ofTotal}。向下滚动查看更多…',
      scrollHint: '向下滚动加载…',
      gqlBadShape: 'GraphQL：意外的响应格式（Nexus 可能更改了 API）',
      ofTotal: ' / {total}',
      paginationOf: '{from}–{to}（共 {total}）'
    },
    ja: {
      waitReact: 'React のレンダリングを待っています…',
      loadingUpTo: '{n} まで読み込み中…',
      doneTarget: '完了：{total} 件中 {loaded} 件',
      totalAll: '合計 {total} MOD',
      error: 'エラー：{msg}',
      errLoad: '読み込みエラー：{msg}。再試������するには下にスクロールしてください。',
      infinite: '無限スクロール：{have} / {total}',
      perPage: '1ページ {n} 件',
      allInfinite: 'すべて（無限スクロール）',
      loadingStatus: '{total} 件中 {from}–{to} を読み込み中',
      loadingInd: 'MOD {from}–{to}{ofTotal} を読み込み中…',
      allLoaded: '完了：すべての {total} MOD を読み込みました',
      allLoadedShort: '完了：すべて読み込み済み（{total}）',
      loadedScroll: '{total} 件中 {have} 件読み込み済み。続きを見るには下にスクロール…',
      loadedInitial: '{n}{ofTotal} 件読み込み済み。続きを見るには下にスクロール…',
      scrollHint: '読み込むには下にスクロール…',
      gqlBadShape: 'GraphQL：予期しない応答形式（Nexus が API を変更した可能性）',
      ofTotal: '（{total} 件中）',
      paginationOf: '{total} 件中 {from}–{to}'
    },
    pt: {
      waitReact: 'Aguardando renderização do React…',
      loadingUpTo: 'Carregando até {n}…',
      doneTarget: 'Concluído: {loaded} de {total}',
      totalAll: '{total} mods no total',
      error: 'Erro: {msg}',
      errLoad: 'Erro de carregamento: {msg}. Role para baixo para tentar novamente.',
      infinite: 'Rolagem infinita: {have} / {total}',
      perPage: '{n} por página',
      allInfinite: 'Todos (rolagem infinita)',
      loadingStatus: 'Carregando {from}–{to} de {total}',
      loadingInd: 'Carregando mods {from}–{to}{ofTotal}…',
      allLoaded: 'Concluído: todos os {total} mods carregados',
      allLoadedShort: 'Concluído: tudo carregado ({total})',
      loadedScroll: '{have} de {total} carregados. Role para mais…',
      loadedInitial: '{n}{ofTotal} carregados. Role para mais…',
      scrollHint: 'Role para baixo para carregar…',
      gqlBadShape: 'GraphQL: forma de resposta inesperada (Nexus pode ter alterado a API)',
      ofTotal: ' de {total}',
      paginationOf: '{from}–{to} de {total}'
    }
  }
  const LANG = (() => {
    const raw = (navigator.language || navigator.userLanguage || 'en').toLowerCase()
    const code = raw.slice(0, 2)
    return STRINGS[code] ? code : 'en'
  })()
  function t (key, params) {
    const dict = STRINGS[LANG] || STRINGS.en
    let str = dict[key] || STRINGS.en[key] || key
    if (params) str = str.replace(/\{(\w+)\}/g, (_, k) => params[k] == null ? '' : params[k])
    return str
  }

  // Защита от параллельно установленных старых версий этого же скрипта:
  // прячем их UI-элементы CSSом (display:none !important) — даже если
  // они всё ещё инжектятся, то не видны и не кликабельны.
  ;(function injectLegacyHider () {
    if (document.getElementById('nmpp-legacy-hide')) return
    const st = document.createElement('style')
    st.id = 'nmpp-legacy-hide'
    st.textContent = '#lime-pgsize-panel, #lime-btns, #lime-mpp-wrap, #lime-status, #lime-pagination, #lime-infinite-indicator { display:none !important; visibility:hidden !important; pointer-events:none !important; }'
    ;(document.head || document.documentElement).appendChild(st)
  })()
  function killLegacyPanels () {
    document.querySelectorAll('#lime-pgsize-panel, #lime-btns').forEach(el => el.remove()) // старый встроенный UI v3.x — физически удаляем
  }

  // Глобальный одноразовый обработчик: клик вне меню MPP — закрыть.
  function closeNmppMenu () {
    const menu = document.getElementById('nmpp-menu')
    if (!menu || menu.style.display !== 'block') return
    menu.style.display = 'none'
    const btn = document.getElementById('nmpp-btn')
    if (btn) btn.setAttribute('aria-expanded', 'false')
  }
  document.addEventListener('click', (e) => {
    const menu = document.getElementById('nmpp-menu')
    if (!menu || menu.style.display !== 'block') return
    if (e.target.closest('#nmpp-wrap')) return
    closeNmppMenu()
  })
  // Escape закрывает меню и возвращает фокус на кнопку (a11y).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return
    const menu = document.getElementById('nmpp-menu')
    if (!menu || menu.style.display !== 'block') return
    closeNmppMenu()
    const btn = document.getElementById('nmpp-btn')
    if (btn) btn.focus()
  })

  // ===================== НАСТРОЙКИ =====================
  const SIZES = [20, 40, 60, 80, 100, 'all'] // 'all' = infinite scroll
  const STORAGE_KEY = 'nmpp_target_size'
  const BATCH = 20
  // sort whitelist — валидные имена полей ModsSort в GraphQL Nexus
  const SORT_WHITELIST = new Set(['downloads', 'endorsements', 'createdAt', 'updatedAt', 'name', 'relevance', 'rating', 'trending', 'random', 'surprise'])
  // Retry/backoff constants — анти-молоток при ошибках API.
  const MAX_CONSEC_ERRORS = 5   // после стольких ошибок подряд требуется реальный скролл юзера
  const BACKOFF_BASE_MS = 1000  // 1s → 2s → 4s → 8s → 16s
  const BACKOFF_MAX_MS = 30000
  // Тюнинг скорости/чувствительности — правь здесь, не в логике ниже.
  const CFG = {
    NEAR_BOTTOM_PX: 1000,        // дистанция до низа грида в px для триггера infinite load
    POST_BATCH_PAUSE_MS: 500,    // базовая пауза после успешного батча (анти-rate-limit)
    POST_BATCH_JITTER_MS: 400,   // случайный jitter поверх паузы
    GRID_STABLE_MAX_ITER: 80,    // итераций ожидания стабилизации грида
    GRID_STABLE_POLL_MS: 250,    // 80 × 250ms = 20s таймаут
  }
  const GRAPHQL_URL = 'https://api-router.nexusmods.com/graphql'
  const TOTAL_KEY = 'nmpp_total_count'
  const NEXUS_ORANGE = '#d98f40'

  const storedRaw = localStorage.getItem(STORAGE_KEY) || '20'
  let targetSize = storedRaw === 'all' ? 'all' : (parseInt(storedRaw, 10) || 20)
  let lastPathKey = null
  let lastTotalCount = 0
  let infiniteObserver = null
  let infiniteNextOffset = 0
  let autoExpandTimer = null
  let currentAbort = null // AbortController текущего expandTo / infinite scroll
  let randomSeed = null // стабильный seed для sort=random на время жизни листинга

  // ===================== TOTAL CACHE =====================
  function listingKey () {
    const u = new URL(location.href)
    u.searchParams.delete('page')
    return u.pathname + '?' + u.searchParams.toString()
  }
  function readCachedTotal () {
    try {
      const raw = sessionStorage.getItem(TOTAL_KEY)
      if (!raw) return 0
      const obj = JSON.parse(raw)
      return obj.key === listingKey() ? (obj.total || 0) : 0
    } catch (_) { return 0 }
  }
  function writeCachedTotal (n) {
    try { sessionStorage.setItem(TOTAL_KEY, JSON.stringify({ key: listingKey(), total: n })) } catch (_) {}
  }

  // ===================== URL =====================
  function getGameDomainFromPath () {
    const m = location.pathname.match(/^\/games\/([^/]+)\/mods/)
    if (m) {
      let g = m[1].toLowerCase()
      if (g === 'moddingtools') g = 'site'
      return g
    }
    return null
  }

  function parseTimeRange (raw) {
    if (!raw || raw === 'allTime') return null
    if (raw.includes('|')) {
      const [s, e] = raw.split('|')
      const toUnix = (d, end) => {
        const dt = new Date(d + 'T00:00:00Z')
        if (end) dt.setUTCHours(23, 59, 59, 999)
        return Math.floor(dt.getTime() / 1000)
      }
      return { type: 'absolute', from: toUnix(s, false), to: toUnix(e, true) }
    }
    const days = parseInt(raw, 10)
    if (!isNaN(days)) return { type: 'relative', days }
    return null
  }

  function loadParams () {
    const p = new URLSearchParams(location.search)
    // URLSearchParams уже декодирует %XX и трактует "+" как пробел. Повторный decodeURIComponent
    // ломался на литеральных % (напр. %25 → % → URIError при повторном декоде).
    const arr = (k) => p.getAll(k)
    const one = (k) => p.get(k) || null
    return {
      gameName: getGameDomainFromPath(),
      categories: arr('categoryName'),
      tagsContains: arr('tag'),
      tagsExclude: arr('excludedTag'),
      languages: arr('languageName'),
      title: one('title') || one('keyword') || one('q'),
      description: one('description'),
      sort: p.get('sort'),
      sortDirection: p.get('sortDirection') || 'DESC',
      sortExplicit: p.has('sort'),
      showAdult: p.get('showAdultContent'),
      onlyAdult: p.get('adultContent'),
      vortexSupport: p.get('supportsVortex'),
      onlyUpdated: p.get('hasUpdated'),
      timeRange: parseTimeRange(p.get('timeRange') || 'allTime'),
      currentPage: parseInt(p.get('page') || '1', 10)
    }
  }

  // ===================== GRAPHQL =====================
  // Nexus именует случайную сортировку «Surprise me». В URL/GraphQL дженерится как sort=random.
  // Для стабильности порядка между батчами жёстко фиксируем seed.
  function isRandomSort (sort) {
    if (!sort) return false
    return /^(random|surprise|shuffle)$/i.test(String(sort))
  }
  function getRandomSeed () {
    if (randomSeed == null) {
      // 31-битный целый (Int в GraphQL — 32-бит signed)
      randomSeed = Math.floor(Math.random() * 0x7fffffff)
    }
    return randomSeed
  }

  function cancelInFlight (reason) {
    if (currentAbort) {
      try { currentAbort.abort(reason || 'superseded') } catch (_) {}
      currentAbort = null
    }
  }

  function isAbortError (e) {
    return e && (e.name === 'AbortError' || /aborted|superseded/i.test(e.message || ''))
  }

  async function fetchModsBatch (offset, ctx, signal) {
    let adultFilter = []
    if (ctx.onlyAdult === 'false') adultFilter = [{ op: 'EQUALS', value: false }]
    else if (ctx.showAdult === 'true') adultFilter = [{ op: 'EQUALS', value: true }]

    const variables = {
      count: BATCH,
      offset,
      facets: {
        categoryName: ctx.categories || [],
        languageName: ctx.languages || [],
        tag: ctx.tagsContains || []
      },
      filter: {
        filter: [],
        adultContent: adultFilter,
        gameDomainName: ctx.gameName ? [{ op: 'EQUALS', value: ctx.gameName }] : [],
        hasUpdated: ctx.onlyUpdated ? [{ op: 'EQUALS', value: ctx.onlyUpdated === 'true' }] : [],
        supportsVortex: ctx.vortexSupport ? [{ op: 'EQUALS', value: ctx.vortexSupport === 'true' }] : [],
        name: ctx.title ? [{ op: 'WILDCARD', value: ctx.title }] : []
      },
      postFilter: { tag: ctx.tagsExclude && ctx.tagsExclude.length ? ctx.tagsExclude.map(v => ({ op: 'NOT_EQUALS', value: String(v) })) : [] }
    }
    if (ctx.sortExplicit && ctx.sort) {
      if (isRandomSort(ctx.sort)) {
        // стабильный seed — иначе каждый батч будет свежей тасовкой → 100% дубликаты
        variables.sort = [{ random: { seed: getRandomSeed() } }]
      } else if (SORT_WHITELIST.has(ctx.sort)) {
        // direction тоже whitelist — невалидное значение даёт GraphQL-ошибку.
        const dir = ctx.sortDirection === 'ASC' ? 'ASC' : 'DESC'
        variables.sort = [{ [ctx.sort]: { direction: dir } }]
      } else {
        // неизвестное поле — не передаём sort, сервер применит дефолт.
        console.warn('[NexusMPP] unknown sort field ignored:', ctx.sort)
      }
    }
    if (ctx.description) {
      variables.filter.description = [{ op: 'MATCHES', value: String(ctx.description) }]
    }
    if (ctx.timeRange?.type === 'absolute') {
      variables.filter.filter.push({
        op: 'AND',
        createdAt: [
          { op: 'GTE', value: String(ctx.timeRange.from) },
          { op: 'LTE', value: String(ctx.timeRange.to) }
        ]
      })
    }
    if (ctx.timeRange?.type === 'relative') {
      const from = Math.floor((Date.now() - ctx.timeRange.days * 86400000) / 1000)
      variables.filter.filter.push({ op: 'AND', createdAt: [{ op: 'GTE', value: String(from) }] })
    }

    const query = `query ModsListing($count: Int = 0, $facets: ModsFacet, $filter: ModsFilter, $offset: Int, $postFilter: ModsFilter, $sort: [ModsSort!]) {
  mods(count: $count, facets: $facets, filter: $filter, offset: $offset, postFilter: $postFilter, sort: $sort, viewUserBlockedContent: false) {
    nodes { ...ModTileFragment }
    totalCount
  }
}
fragment ModTileFragment on Mod {
  adultContent createdAt downloads endorsements fileSize
  game { domainName id name }
  modCategory { categoryId name }
  modId name status summary thumbnailUrl uid updatedAt
  uploader { avatar memberId name }
  viewerDownloaded viewerEndorsed viewerTracked viewerUpdateAvailable viewerIsBlocked
}`

    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        accept: '*/*',
        'content-type': 'application/json',
        'x-graphql-operationname': 'ModsListing'
      },
      credentials: 'include',
      body: JSON.stringify({ query, variables, operationName: 'ModsListing' }),
      signal
    })
    if (!res.ok) {
      // Пробрасываем status и Retry-After header для корректного backoff на 429/503.
      const err = new Error('HTTP ' + res.status)
      err.status = res.status
      const ra = parseInt(res.headers.get('retry-after') || '', 10)
      if (!isNaN(ra) && ra > 0) err.retryAfterMs = ra * 1000
      throw err
    }
    const json = await res.json()
    if (json?.errors && json.errors.length) {
      const msg = json.errors.map(e => e.message || String(e)).join('; ')
      throw new Error('GraphQL: ' + msg)
    }
    const data = json?.data?.mods
    if (!data || !Array.isArray(data.nodes)) {
      throw new Error(t('gqlBadShape'))
    }
    return { nodes: data.nodes, totalCount: data.totalCount || 0 }
  }

  // ===================== КАРТОЧКА =====================
  function formatNumber (n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'm'
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k'
    return String(n)
  }
  function formatFileSize (kb) {
    if (!kb) return '0 B'
    const b = kb * 1024
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(b) / Math.log(1024))
    return parseFloat((b / Math.pow(1024, i)).toFixed(1)) + units[i]
  }
  function timeAgo (input) {
    const date = new Date(input)
    const s = Math.floor((Date.now() - date.getTime()) / 1000)
    if (s < 60) return 'just now'
    const m = Math.floor(s / 60); if (m < 60) return m + ' minute' + (m > 1 ? 's' : '') + ' ago'
    const h = Math.floor(m / 60); if (h < 24) return h + ' hour' + (h > 1 ? 's' : '') + ' ago'
    const d = Math.floor(h / 24); if (d < 7) return d + ' day' + (d > 1 ? 's' : '') + ' ago'
    const w = Math.floor(d / 7); if (w < 4) return w + ' week' + (w > 1 ? 's' : '') + ' ago'
    const mo = Math.floor(d / 30); if (mo < 12) return mo + ' month' + (mo > 1 ? 's' : '') + ' ago'
    const y = Math.floor(d / 365); return y + ' year' + (y > 1 ? 's' : '') + ' ago'
  }

  // ===== XSS-safe interpolation helpers =====
  const esc = s => String(s ?? '').replace(/[&<>"'`]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' })[c])
  const encURI = s => encodeURIComponent(String(s ?? ''))
  const safeImgSrc = u => (typeof u === 'string' && /^https?:\/\//i.test(u)) ? esc(u) : ''
  function buildModUrl (node) {
    const d = node?.game?.domainName
    const m = node?.modId
    return d && m != null ? `https://www.nexusmods.com/${encURI(d)}/mods/${encURI(m)}` : ''
  }

  function buildTile (node, withGameName) {
    const domain = node.game?.domainName ? encURI(node.game.domainName) : ''
    const modId = node.modId != null ? encURI(node.modId) : ''
    const itemUrl = domain && modId ? `https://www.nexusmods.com/${domain}/mods/${modId}` : '#'
    const authorName = node.uploader?.name || ''
    const authorUrl = authorName ? `https://www.nexusmods.com/profile/${encURI(authorName)}` : '#'
    const categoryUrl = node.modCategory && domain
      ? `https://www.nexusmods.com/games/${domain}/mods?categoryName=${encURI(node.modCategory.name)}`
      : '#'
    const gameUrl = domain ? `https://www.nexusmods.com/${domain}` : '#'

    const downloadedBadge = node.viewerDownloaded ? `
      <div class="absolute top-2.5 left-2.5 z-10 rounded bg-neutral-50 px-1.5 py-1 shadow-md">
        <p class="typography-title-sm flex items-center gap-x-1 leading-4 text-neutral-inverted" data-e2eid="mod-tile-downloaded">
          <svg viewBox="0 0 24 24" style="width:1rem;height:1rem"><path d="M21,5L9,17L3.5,11.5L4.91,10.09L9,14.17L19.59,3.59L21,5M3,21V19H21V21H3Z" fill="currentColor"/></svg>
          <span>${node.viewerUpdateAvailable ? 'Update available' : ''}</span>
        </p>
      </div>` : ''

    const gameNameHtml = withGameName ? `
      <a class="nxm-link nxm-link-variant-secondary nxm-link-moderate typography-body-sm inline" data-e2eid="mod-tile-game" href="${gameUrl}">${esc(node.game?.name || '')}</a>
      <span class="bg-neutral-subdued inline-flex size-[3px] shrink-0 rotate-45 align-middle leading-normal mx-1.5 hidden @3xs/mod-tile:inline-flex"></span>` : ''

    const adultHtml = node.adultContent ? `
      <span class="bg-neutral-subdued inline-flex size-[3px] shrink-0 rotate-45 align-middle leading-normal mx-1.5"></span>
      <span class="typography-body-sm text-danger-strong">Adult</span>` : ''

    const root = document.createElement('div')
    root.className = '@container/mod-tile group/mod-tile bg-surface-mid flex min-h-108 flex-col rounded'
    root.setAttribute('data-e2eid', 'mod-tile')
    root.setAttribute('data-nmpp-extra', '1')
    root.innerHTML = `
      <div class="relative">
        <a href="${itemUrl}">
          <div class="bg-surface-translucent-low group/image relative z-0 flex aspect-video items-center justify-center overflow-hidden rounded-t">
            <img alt="${esc(node.name || '')}" class="absolute z-2 max-h-full transition-transform group-hover/image:scale-105" src="${safeImgSrc(node.thumbnailUrl)}">
          </div>
        </a>
        ${downloadedBadge}
        <div class="px-3 pt-3 pb-5">
          <div class="divide-y divide-solid divide-stroke-weak">
            <div class="space-y-1.5 pb-2">
              <a class="nxm-link nxm-link-variant-secondary nxm-link-moderate typography-body-lg line-clamp-2 font-semibold break-words" data-e2eid="mod-tile-title" href="${itemUrl}">${esc(node.name || '')}</a>
              <a class="nxm-link nxm-link-variant-secondary nxm-link-moderate typography-body-sm gap-x-1.5 flex" data-e2eid="user-link" href="${authorUrl}" target="_blank">
                <img class="size-4 shrink-0 rounded-full" loading="lazy" src="${safeImgSrc(node.uploader?.avatar)}">
                <span class="truncate">${esc(authorName)}</span>
              </a>
            </div>
            <div class="flex flex-col space-y-0.5 py-2 leading-none @3xs/mod-tile:block @3xs/mod-tile:space-y-0">
              ${gameNameHtml}
              <a class="nxm-link nxm-link-variant-secondary nxm-link-moderate typography-body-sm inline" data-e2eid="mod-tile-category" href="${categoryUrl}">${esc(node.modCategory?.name || '')} ${adultHtml}</a>
            </div>
            <div class="flex flex-col gap-x-4 gap-y-1 py-2 @3xs/mod-tile:flex-row @3xs/mod-tile:gap-y-0">
              <p class="typography-body-sm text-neutral-subdued flex items-center gap-x-1" data-e2eid="mod-tile-updated">
                <svg viewBox="0 0 24 24" style="width:1rem;height:1rem"><path d="M21,10.12H14.22L16.96,7.3C14.23,4.6 9.81,4.5 7.08,7.2C4.35,9.91 4.35,14.28 7.08,17C9.81,19.7 14.23,19.7 16.96,17C18.32,15.65 19,14.08 19,12.1H21C21,14.08 20.12,16.65 18.36,18.39C14.85,21.87 9.15,21.87 5.64,18.39C2.14,14.92 2.11,9.28 5.62,5.81C9.13,2.34 14.76,2.34 18.27,5.81L21,3V10.12M12.5,8V12.25L16,14.33L15.28,15.54L11,13V8H12.5Z" fill="currentColor"/></svg>
                <time>${esc(timeAgo(node.updatedAt))}</time>
              </p>
              <p class="typography-body-sm text-neutral-subdued flex items-center gap-x-1" data-e2eid="mod-tile-uploaded">
                <svg viewBox="0 0 24 24" style="width:1rem;height:1rem"><path d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" fill="currentColor"/></svg>
                <time>${esc(timeAgo(node.createdAt))}</time>
              </p>
            </div>
            <div class="typography-body-sm text-neutral-subdued line-clamp-4 pt-2 break-words" data-e2eid="mod-tile-summary">${esc(node.summary || '')}</div>
          </div>
        </div>
        <div class="mt-auto flex min-h-8 items-center gap-x-4 rounded-b bg-surface-high px-3">
          <p class="typography-body-sm text-neutral-moderate flex items-center gap-x-1 leading-4">
            <svg viewBox="0 0 24 24" style="width:1rem;height:1rem"><path d="M23,10C23,8.89 22.1,8 21,8H14.68L15.64,3.43C15.66,3.33 15.67,3.22 15.67,3.11C15.67,2.7 15.5,2.32 15.23,2.05L14.17,1L7.59,7.58C7.22,7.95 7,8.45 7,9V19A2,2 0 0,0 9,21H18C18.83,21 19.54,20.5 19.84,19.78L22.86,12.73C22.95,12.5 23,12.26 23,12V10M1,21H5V9H1V21Z" fill="currentColor"/></svg>
            <span data-e2eid="mod-tile-endorsements">${formatNumber(node.endorsements)}</span>
          </p>
          <p class="typography-body-sm text-neutral-moderate flex items-center gap-x-1 leading-4">
            <svg viewBox="0 0 24 24" style="width:1rem;height:1rem"><path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" fill="currentColor"/></svg>
            <span data-e2eid="mod-tile-downloads">${formatNumber(node.downloads)}</span>
          </p>
          <p class="typography-body-sm text-neutral-moderate flex items-center gap-x-1 leading-4">
            <svg viewBox="0 0 24 24" style="width:1rem;height:1rem"><path d="M4.9 10.7L7.3 5.9C7.4 5.6 7.6 5.4 7.9 5.2C8.2 5.1 8.5 5 8.8 5H16.5C16.8 5 17.1 5.1 17.3 5.2C17.6 5.4 17.8 5.6 17.9 5.9L20.3 10.7H4.9ZM4.5 16.4V11.5H20.75V16.4C20.75 16.8 20.6 17.2 20.3 17.5C19.97 17.8 19.56 18 19.13 18H6.13C5.69 18 5.28 17.8 4.98 17.5C4.67 17.2 4.5 16.83 4.5 16.4Z" fill="currentColor"/></svg>
            <span data-e2eid="mod-tile-file-size">${esc(formatFileSize(node.fileSize))}</span>
          </p>
        </div>
      </div>`
    return root
  }

  // ===================== ОСНОВНАЯ ЛОГИКА =====================
  function getGrid () { return document.querySelector('div.mods-grid') }
  function countTiles (grid) {
    return grid ? grid.querySelectorAll('[data-e2eid="mod-tile"]').length : 0
  }
  function removeExtras () {
    const grid = getGrid()
    if (!grid) return
    grid.querySelectorAll('[data-nmpp-extra="1"]').forEach(el => el.remove())
  }
  function isModsListPage () {
    // Только страница-список модов: /mods, /mods/, /games/<game>/mods, /games/<game>/mods/.
    // НЕ матчит /games/<game>/mods/<id> — страницу конкретного мода.
    return /^\/mods\/?$/.test(location.pathname)
      || /^\/games\/[^/]+\/mods\/?$/.test(location.pathname)
  }

  // Ждём пока React дорисует исходные карточки (счётчик не меняется 2 тика).
  async function waitForGridStable (signal) {
    let prev = -1, same = 0
    for (let i = 0; i < CFG.GRID_STABLE_MAX_ITER; i++) {
      if (signal?.aborted) return -1
      const c = countTiles(getGrid())
      if (c > 0 && c === prev) { same++; if (same >= 2) return c }
      else same = 0
      prev = c
      await new Promise(r => setTimeout(r, CFG.GRID_STABLE_POLL_MS))
      if (signal?.aborted) return -1
    }
    // Грид так и не стабилизировался — селекторы могли устареть.
    const c = countTiles(getGrid())
    if (!c) console.warn('[NexusMPP] mods grid did not stabilize in 20s — data-e2eid selectors may be outdated')
    return c
  }

  async function expandTo (target) {
    if (!getGrid()) return
    // Отменяем предыдущий ран (если был) и ставим свой сигнал
    cancelInFlight('new expandTo')
    const ac = new AbortController()
    currentAbort = ac
    const signal = ac.signal
    const isInfinite = target === 'all'
    if (isInfinite) updateStatus(t('waitReact'), '#9ca3af')
    else if (target > BATCH) updateStatus(t('waitReact'), '#9ca3af')
    try {
      const initialCount = await waitForGridStable(signal)
      if (signal.aborted || initialCount < 0) return
      const grid = getGrid()
      if (!grid) return

      const ctx = loadParams()
      const pageOffset = (Math.max(1, ctx.currentPage) - 1) * BATCH
      const existing = new Set(
        Array.from(grid.querySelectorAll('a[data-e2eid="mod-tile-title"]')).map(a => a.href)
      )
      const withGameName = !ctx.gameName
      let loaded = initialCount

      if (!lastTotalCount) lastTotalCount = readCachedTotal()

      // ----- INFINITE SCROLL MODE -----
      if (isInfinite) {
        // Стартуем сразу с догрузки до viewport-ы, дальше — observer
        infiniteNextOffset = pageOffset + BATCH * Math.ceil(initialCount / BATCH)
        // Узнаём totalCount если ещё неизвестен
        if (!lastTotalCount) {
          try {
            const { totalCount } = await fetchModsBatch(0, ctx, signal)
            if (totalCount) { lastTotalCount = totalCount; writeCachedTotal(totalCount) }
          } catch (e) { if (isAbortError(e)) return }
        }
        if (signal.aborted) return
        setupInfiniteScroll(ctx, withGameName, existing, signal)
        updateStatus(t('infinite', { have: loaded, total: lastTotalCount || '?' }), NEXUS_ORANGE)
        return
      }

      // ----- FIXED SIZE MODE -----
      let effectiveTarget = target
      if (lastTotalCount) {
        const remaining = Math.max(0, lastTotalCount - pageOffset)
        effectiveTarget = Math.min(target, remaining)
      }

      if (target > BATCH) updateStatus(t('loadingUpTo', { n: effectiveTarget }), '#3b82f6')

      let batchIdx = 1
      while (loaded < effectiveTarget) {
        if (signal.aborted) return
        const offset = pageOffset + batchIdx * BATCH
        const { nodes, totalCount } = await fetchModsBatch(offset, ctx, signal)
        if (signal.aborted) return
        if (totalCount) { lastTotalCount = totalCount; writeCachedTotal(totalCount) }
        if (!nodes.length) break
        for (const n of nodes) {
          if (loaded >= effectiveTarget) break
          const url = buildModUrl(n)
          if (!url || existing.has(url)) continue
          existing.add(url)
          grid.appendChild(buildTile(n, withGameName))
          loaded++
        }
        batchIdx++
        await new Promise(r => setTimeout(r, CFG.POST_BATCH_PAUSE_MS + Math.random() * CFG.POST_BATCH_JITTER_MS))
        if (signal.aborted) return
      }

      if (!lastTotalCount) {
        try {
          const { totalCount } = await fetchModsBatch(0, ctx, signal)
          if (totalCount) { lastTotalCount = totalCount; writeCachedTotal(totalCount) }
        } catch (e) { if (isAbortError(e)) return }
      }

      if (target > BATCH) updateStatus(t('doneTarget', { loaded, total: lastTotalCount || '?' }), '#22c55e')
      else updateStatus(t('totalAll', { total: lastTotalCount || '?' }), '#9ca3af')
    } catch (e) {
      if (isAbortError(e)) return
      console.error('[NexusMPP]', e)
      updateStatus(t('error', { msg: e.message }), '#ef4444')
    } finally {
      if (currentAbort === ac) currentAbort = null
    }

    rebuildPagination()
  }

  // ===================== INFINITE SCROLL =====================
  function ensureInfiniteIndicator () {
    let el = document.getElementById('nmpp-indicator')
    if (el) return el
    const grid = getGrid()
    if (!grid) return null
    el = document.createElement('div')
    el.id = 'nmpp-indicator'
    el.style.cssText = `
      display:flex;align-items:center;justify-content:center;gap:10px;
      margin:24px auto;padding:16px 20px;max-width:520px;
      background:rgba(217,143,64,.08);
      border:1px solid rgba(217,143,64,.4);
      border-radius:10px;
      color:#eee;font:13px/1.4 system-ui,sans-serif;
      text-align:center;
    `
    // Спиннер — статичный HTML, текст — через textContent (паттерн консистентный, без template-литералов в DOM-нодах с переводами).
    el.innerHTML = '<span id="nmpp-spinner" style="display:inline-block;width:14px;height:14px;border:2px solid rgba(217,143,64,.3);border-top-color:#d98f40;border-radius:50%;animation:nmpp-spin .8s linear infinite;"></span><span id="nmpp-text"></span>'
    el.querySelector('#nmpp-text').textContent = t('scrollHint')
    // animation keyframes (однажды)
    if (!document.getElementById('nmpp-spin-style')) {
      const st = document.createElement('style')
      st.id = 'nmpp-spin-style'
      st.textContent = '@keyframes nmpp-spin{to{transform:rotate(360deg)}}'
      document.head.appendChild(st)
    }
    grid.parentNode.insertBefore(el, grid.nextSibling)
    return el
  }
  function setInfiniteIndicator (state, text) {
    const el = document.getElementById('nmpp-indicator')
    if (!el) return
    const sp = document.getElementById('nmpp-spinner')
    const tx = document.getElementById('nmpp-text')
    if (tx) tx.textContent = text || ''
    if (sp) sp.style.display = state === 'loading' ? 'inline-block' : 'none'
    if (state === 'done') {
      el.style.background = 'rgba(34,197,94,.08)'
      el.style.borderColor = 'rgba(34,197,94,.4)'
    } else if (state === 'error') {
      el.style.background = 'rgba(239,68,68,.08)'
      el.style.borderColor = 'rgba(239,68,68,.4)'
    } else {
      el.style.background = 'rgba(217,143,64,.08)'
      el.style.borderColor = 'rgba(217,143,64,.4)'
    }
  }
  function removeInfiniteIndicator () {
    const el = document.getElementById('nmpp-indicator')
    if (el) el.remove()
  }
  function updateInfiniteIndicator () {
    if (targetSize !== 'all') removeInfiniteIndicator()
  }

  function teardownInfiniteScroll () {
    if (infiniteObserver) { infiniteObserver.disconnect(); infiniteObserver = null }
    const sentinel = document.getElementById('nmpp-sentinel')
    if (sentinel) sentinel.remove()
    if (targetSize !== 'all') removeInfiniteIndicator()
  }

  function setupInfiniteScroll (ctx, withGameName, existing, signal) {
    teardownInfiniteScroll()
    const grid = getGrid()
    if (!grid) return

    ensureInfiniteIndicator()
    setInfiniteIndicator('idle', t('loadedInitial', { n: countTiles(grid), ofTotal: lastTotalCount ? t('ofTotal', { total: lastTotalCount }) : '' }))

    let loading = false
    let retryCount = 0
    let retryTimer = null
    let waitingForUserScroll = false

    async function tryLoadMore () {
      if (loading) return
      if (waitingForUserScroll) return // ждём реального скролл-события юзера после исчерпания ретраев
      if (targetSize !== 'all') return
      if (signal && signal.aborted) { teardownInfiniteScroll(); return }
      if (lastTotalCount && infiniteNextOffset >= lastTotalCount) {
        setInfiniteIndicator('done', t('allLoaded', { total: lastTotalCount }))
        teardownInfiniteScroll()
        updateStatus(t('allLoadedShort', { total: lastTotalCount }), '#22c55e')
        return
      }
      const g = getGrid()
      if (!g) return
      const rect = g.getBoundingClientRect()
      const distanceToBottom = rect.bottom - window.innerHeight
      if (distanceToBottom > CFG.NEAR_BOTTOM_PX) return // ещё далеко от низа

      loading = true
      let succeeded = false
      const to = Math.min(infiniteNextOffset + BATCH, lastTotalCount || infiniteNextOffset + BATCH)
      try {
        setInfiniteIndicator('loading', t('loadingInd', { from: infiniteNextOffset + 1, to, ofTotal: lastTotalCount ? t('ofTotal', { total: lastTotalCount }) : '' }))
        updateStatus(t('loadingStatus', { from: infiniteNextOffset + 1, to, total: lastTotalCount || '?' }), '#3b82f6')
        const { nodes, totalCount } = await fetchModsBatch(infiniteNextOffset, ctx, signal)
        if (signal?.aborted) { teardownInfiniteScroll(); return }
        retryCount = 0 // успех сбрасывает счётчик ретраев
        if (totalCount) { lastTotalCount = totalCount; writeCachedTotal(totalCount) }
        if (!nodes.length) {
          setInfiniteIndicator('done', t('allLoaded', { total: countTiles(getGrid()) }))
          teardownInfiniteScroll()
          updateStatus(t('allLoadedShort', { total: countTiles(getGrid()) }), '#22c55e')
          return
        }
        const g2 = getGrid()
        for (const n of nodes) {
          const url = buildModUrl(n)
          if (!url || existing.has(url)) continue
          existing.add(url)
          g2.appendChild(buildTile(n, withGameName))
        }
        infiniteNextOffset += BATCH
        const have = countTiles(g2)
        const total = lastTotalCount || '?'
        if (lastTotalCount && have >= lastTotalCount) {
          setInfiniteIndicator('done', t('allLoaded', { total: lastTotalCount }))
          teardownInfiniteScroll()
        } else {
          setInfiniteIndicator('idle', t('loadedScroll', { have, total }))
        }
        updateStatus(t('infinite', { have, total }), NEXUS_ORANGE)
        succeeded = true
        // Случайная пауза между батчами (анти-рейт-лимит)
        await new Promise(r => setTimeout(r, CFG.POST_BATCH_PAUSE_MS + Math.random() * CFG.POST_BATCH_JITTER_MS))
        if (signal?.aborted) return
      } catch (e) {
        if (isAbortError(e)) { teardownInfiniteScroll(); return }
        console.error('[NexusMPP]', e)
        retryCount++
        if (retryCount >= MAX_CONSEC_ERRORS) {
          setInfiniteIndicator('error', t('errLoad', { msg: e.message }))
          updateStatus(t('error', { msg: e.message }), '#ef4444')
          waitingForUserScroll = true // требуется реальный скролл юзера, чтобы возобновить
          return
        }
        // Exponential backoff + Retry-After (если сервер прислал) — берём максимум.
        const expBackoffMs = Math.min(BACKOFF_MAX_MS, BACKOFF_BASE_MS * Math.pow(2, retryCount - 1))
        const delayMs = Math.max(expBackoffMs, e.retryAfterMs || 0)
        const delaySec = Math.round(delayMs / 1000)
        setInfiniteIndicator('error', t('errLoad', { msg: e.message + ` (retry ${retryCount}/${MAX_CONSEC_ERRORS} in ${delaySec}s)` }))
        retryTimer = setTimeout(() => { retryTimer = null; tryLoadMore() }, delayMs)
        return
      } finally {
        loading = false
      }

      // Авто-продолжение ТОЛЬКО на успехе и ТОЛЬКО если грид ещё близко к низу.
      if (succeeded) requestAnimationFrame(tryLoadMore)
    }

    // Throttled scroll handler (через rAF)
    let scrollPending = false
    function onScroll () {
      if (scrollPending) return
      // Реальный скролл юзера сбрасывает retry-wait state
      if (waitingForUserScroll) { waitingForUserScroll = false; retryCount = 0 }
      scrollPending = true
      requestAnimationFrame(() => {
        scrollPending = false
        tryLoadMore()
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    // Сохраняем функции отписки в фейковом observer-плейсхолдере (чтобы teardown не ломался)
    infiniteObserver = {
      disconnect () {
        window.removeEventListener('scroll', onScroll)
        window.removeEventListener('resize', onScroll)
        if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
      }
    }

    // Стартовая проверка: вдруг viewport уже близко к низу
    requestAnimationFrame(tryLoadMore)
  }

  // ===================== ПАГИНАЦИЯ =====================
  function findNativeNav () {
    const navs = document.querySelectorAll('nav[role="navigation"]')
    for (const n of navs) {
      if (n.querySelector('button[aria-label*="Go to page"], button[aria-label*="Go to next"], button[aria-label*="Go to previous"]')) {
        return n
      }
    }
    return null
  }

  function computePageRange (current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const range = []
    range.push(1)
    if (current > 4) range.push('...')
    for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) range.push(i)
    if (current < total - 3) range.push('...')
    range.push(total)
    return range
  }

  function navigateToUserPage (userPage) {
    if (targetSize === 'all' || typeof targetSize !== 'number') return
    const multiplier = targetSize / BATCH
    const nexusPage = (userPage - 1) * multiplier + 1
    const u = new URL(location.href)
    if (nexusPage <= 1) u.searchParams.delete('page')
    else u.searchParams.set('page', String(nexusPage))
    // SPA-style: pushState → maybeAutoExpand сработает через 'nmpp-locationchange'
    history.pushState({}, '', u.toString())
    // Скроллим вверх к гриду (иначе остаёмся в низу предыдущей страницы)
    const grid = getGrid()
    if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function rebuildPagination () {
    const nav = findNativeNav()
    const existing = document.getElementById('nmpp-pagination')

    // Infinite — обе пагинации прячем
    if (targetSize === 'all') {
      if (nav) nav.style.display = 'none'
      if (existing) existing.remove()
      return
    }

    // size=20 — нативная остаётся, наша снимается
    if (targetSize <= BATCH) {
      if (nav) nav.style.display = ''
      if (existing) existing.remove()
      return
    }

    if (!nav || !lastTotalCount) return

    nav.style.display = 'none'
    const ctx = loadParams()
    const multiplier = targetSize / BATCH
    const userPages = Math.max(1, Math.ceil(lastTotalCount / targetSize))
    const currentUserPage = Math.max(1, Math.floor((ctx.currentPage - 1) / multiplier) + 1)

    let box = existing
    if (!box) {
      box = document.createElement('div')
      box.id = 'nmpp-pagination'
      box.style.cssText = 'display:flex;gap:6px;justify-content:center;align-items:center;flex-wrap:wrap;padding:12px;font-family:system-ui,sans-serif;'
      nav.parentNode.insertBefore(box, nav.nextSibling)
    }
    box.innerHTML = ''

    const makeBtn = (label, page, opts = {}) => {
      const b = document.createElement('button')
      b.textContent = label
      b.disabled = !!opts.disabled
      b.style.cssText = `padding:6px 12px;border-radius:6px;cursor:${opts.disabled ? 'not-allowed' : 'pointer'};border:1px solid ${opts.active ? NEXUS_ORANGE : '#555'};background:${opts.active ? NEXUS_ORANGE : 'transparent'};color:#fff;font:inherit;font-size:13px;min-width:32px;opacity:${opts.disabled ? '.4' : '1'};`
      if (!opts.disabled) b.addEventListener('click', () => navigateToUserPage(page))
      return b
    }

    box.appendChild(makeBtn('‹', currentUserPage - 1, { disabled: currentUserPage <= 1 }))
    for (const p of computePageRange(currentUserPage, userPages)) {
      if (p === '...') {
        const s = document.createElement('span')
        s.textContent = '…'
        s.style.cssText = 'color:#999;padding:0 4px;'
        box.appendChild(s)
      } else {
        box.appendChild(makeBtn(String(p), p, { active: p === currentUserPage }))
      }
    }
    box.appendChild(makeBtn('›', currentUserPage + 1, { disabled: currentUserPage >= userPages }))

    const startMod = (currentUserPage - 1) * targetSize + 1
    const endMod = Math.min(startMod + targetSize - 1, lastTotalCount)
    const info = document.createElement('span')
    info.style.cssText = 'margin-left:12px;color:#bbb;font-size:12px;'
    info.textContent = t('paginationOf', { from: startMod, to: endMod, total: lastTotalCount })
    box.appendChild(info)
  }

  // ===================== UI: MPP BUTTON =====================
  function updateStatus (text, color) {
    // Статусы из expandTo/infinite идут в:
    //  • лейбл кнопки MPP (всегда виден текущий размер)
    //  • видимый инфинит-индикатор под гридом (в режиме 'all')
    //  • консоль (для дебага)
    const lbl = document.getElementById('nmpp-label')
    if (lbl) lbl.textContent = `MPP: ${targetSize === 'all' ? '∞' : targetSize}`
    if (text) console.debug('[NexusMPP]', text)
  }

  // Ищем нативный тулбар фильтров по характерным признакам.
  function findNativeToolbar () {
    // Все потенциальные кнопки фильтров — те, у которых есть aria-haspopup или role=combobox
    const candidates = Array.from(document.querySelectorAll('button[aria-haspopup], [role="combobox"]'))
    const filterLabels = /all\s*time|downloads|endorsements|most\s*popular|relevance|recently|name|trending|sort/i
    for (const el of candidates) {
      if (el.closest('header, footer')) continue
      // ищем тот, у кого в тексте/aria-label один из ярлыков сортировки
      const text = ((el.textContent || '') + ' ' + (el.getAttribute('aria-label') || '')).trim()
      if (filterLabels.test(text)) {
        // возвращаем родителя — обычно flex-контейнер с другими фильтрами
        return el.parentElement
      }
    }
    // запасной вариант — ищем по тексту
    const allBtns = Array.from(document.querySelectorAll('button'))
    for (const el of allBtns) {
      const txt = (el.textContent || '').trim()
      if (/^(All Time|Downloads|Endorsements|Recently added|Most|Trending|Sort)/i.test(txt) && el.closest('main')) {
        return el.parentElement
      }
    }
    return null
  }

  function injectInlineButton () {
    if (!isModsListPage()) return
    if (document.getElementById('nmpp-wrap')) return
    const toolbar = findNativeToolbar()
    if (!toolbar) return // тулб��р ещё н�� появился — ждём следующий тик MutationObserver
    // бывшая фиксированная панель — выносим на всякий случай, если осталась от старых версий
    const floating = document.getElementById('lime-pgsize-panel')
    if (floating) floating.remove()

    const wrap = document.createElement('div')
    wrap.id = 'nmpp-wrap'
    wrap.style.cssText = 'position:relative;display:inline-flex;align-items:center;margin-left:8px;'

    const btn = document.createElement('button')
    btn.type = 'button'
    btn.id = 'nmpp-btn'
    btn.setAttribute('aria-haspopup', 'true')
    btn.setAttribute('aria-expanded', 'false')
    btn.setAttribute('aria-controls', 'nmpp-menu')
    btn.style.cssText = `
      display:inline-flex;align-items:center;gap:6px;
      background:transparent;color:#fff;
      border:1px solid ${NEXUS_ORANGE};
      padding:6px 12px;border-radius:6px;
      font:inherit;font-size:13px;font-weight:600;
      cursor:pointer;line-height:1;white-space:nowrap;
    `
    btn.innerHTML = `<span id="nmpp-label">MPP: ${targetSize === 'all' ? '∞' : targetSize}</span>
      <svg width="10" height="10" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" fill="currentColor"/></svg>`
    btn.style.color = NEXUS_ORANGE

    const menu = document.createElement('div')
    menu.id = 'nmpp-menu'
    menu.setAttribute('role', 'menu')
    menu.setAttribute('aria-labelledby', 'nmpp-btn')
    menu.style.cssText = `
      position:absolute;top:calc(100% + 6px);right:0;z-index:9999;
      background:#1a1a1d;border:1px solid #333;border-radius:8px;
      box-shadow:0 6px 24px rgba(0,0,0,.5);
      min-width:170px;padding:4px;display:none;
    `

    SIZES.forEach(v => {
      const item = document.createElement('button')
      item.type = 'button'
      item.setAttribute('role', 'menuitem')
      const isAll = v === 'all'
      const label = isAll ? t('allInfinite') : t('perPage', { n: v })
      item.textContent = label
      const isActive = v === targetSize
      item.style.cssText = `
        display:block;width:100%;text-align:left;
        padding:8px 12px;
        background:${isActive ? 'rgba(217,143,64,.18)' : 'transparent'};
        color:${isActive ? NEXUS_ORANGE : '#eee'};
        border:none;border-radius:4px;
        font:inherit;font-size:13px;cursor:pointer;
      `
      item.addEventListener('mouseenter', () => {
        if (!isActive) item.style.background = 'rgba(255,255,255,.08)'
      })
      item.addEventListener('mouseleave', () => {
        item.style.background = isActive ? 'rgba(217,143,64,.18)' : 'transparent'
      })
      item.addEventListener('click', () => {
        setMenuOpen(false)
        onSizeClick(v)
      })
      menu.appendChild(item)
    })

    // Синхронный toggle display + aria-expanded (a11y).
    function setMenuOpen (open) {
      menu.style.display = open ? 'block' : 'none'
      btn.setAttribute('aria-expanded', open ? 'true' : 'false')
    }
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      setMenuOpen(menu.style.display !== 'block')
    })

    wrap.appendChild(btn)
    wrap.appendChild(menu)
    toolbar.appendChild(wrap)
  }

  function onSizeClick (size) {
    if (size === targetSize) return
    const prev = targetSize
    targetSize = size
    localStorage.setItem(STORAGE_KEY, String(size))
    // Защита от race: между refreshUI() и expandTo() микротаски MutationObserver
    // запускают obsTick, который проверяет pathKey() !== lastPathKey. Если
    // Nexus асинхронно меняет location.search (его React-роутер любит
    // replaceState), lastPathKey уходит в рассинхрон, obsTick зовёт
    // maybeAutoExpand → cancelInFlight('url changed') → аборт нашего expandTo.
    // Симптом: число обновляется (rebuildPagination в финале), а тайлы нет.
    // Синхронизация здесь покрывает кейс, когда URL ниже не меняется.
    lastPathKey = pathKey()
    refreshUI()
    // Синхронно перерисовываем пагинацию под новый размер. Без этого
    // переход X→All оставляет старую кастомную пагинацию (от size=60 и т.п.)
    // в DOM на всё время infinite-сессии, и её кнопки выглядят живыми, но
    // navigateToUserPage() при targetSize==='all' молча выходит — «некликабельны».
    // Также покрывает 20→All: иначе нативный nav не скрывается.
    // В expandTo() ветка isInfinite уходит через return до финального rebuildPagination,
    // так что вызываем его здесь сами.
    rebuildPagination()

    // При уходе из infinite — снимаем observer
    if (prev === 'all') teardownInfiniteScroll()

    // Пересчитываем целевую страницу так, чтобы примерно сохранить позицию
    // в общем списке: первый мод старой user-страницы → страница с ним при новом размере.
    const u = new URL(location.href)
    const oldNexusPage = parseInt(u.searchParams.get('page') || '1', 10)
    let newNexusPage = 1
    if (prev !== 'all' && size !== 'all' && oldNexusPage > 1 && typeof prev === 'number') {
      const prevMul = prev / BATCH
      const prevUserPage = Math.max(1, Math.floor((oldNexusPage - 1) / prevMul) + 1)
      const firstMod = (prevUserPage - 1) * prev
      const newUserPage = Math.floor(firstMod / size) + 1
      newNexusPage = Math.max(1, (newUserPage - 1) * (size / BATCH) + 1)
    }
    if (newNexusPage <= 1) u.searchParams.delete('page')
    else u.searchParams.set('page', String(newNexusPage))

    if (u.toString() !== location.href) {
      // синхронизируем lastPathKey заранее, чтобы maybeAutoExpand (через 'nmpp-locationchange')
      // увидел совпадение и вышел без дублирующего expandTo — сами вызовем ниже.
      lastPathKey = u.pathname + u.search
      history.pushState({}, '', u.toString())
    }
    cancelInFlight('size changed')
    removeExtras()
    expandTo(size)
  }

  function refreshUI () {
    const wrap = document.getElementById('nmpp-wrap')
    if (wrap) wrap.remove()
    const panel = document.getElementById('lime-pgsize-panel')
    if (panel) panel.remove()
    injectInlineButton()
    updateInfiniteIndicator()
  }

  // ===================== SPA-РОУТИНГ =====================
  function pathKey () { return location.pathname + location.search }

  function maybeAutoExpand () {
    if (!isModsListPage()) return
    const k = pathKey()
    if (k === lastPathKey) return
    const prevKey = lastPathKey
    lastPathKey = k

    // Если listingKey изменился (а не только page) — totalCount устарел
    const prevListing = prevKey ? prevKey.split('&page=')[0] : null
    if (!prevListing || prevListing !== listingKey()) {
      lastTotalCount = 0
      randomSeed = null // новый листинг — новая тасовка
    }

    // Удаляем наши прежние догруженные карточки — они могут быть в старой
    // сортировке/фильтре. Nexus сам перерисует исходные 20.
    cancelInFlight('url changed')
    removeExtras()
    teardownInfiniteScroll()
    removeInfiniteIndicator()

    if (autoExpandTimer) { clearInterval(autoExpandTimer); autoExpandTimer = null }
    let tries = 0
    autoExpandTimer = setInterval(() => {
      const grid = getGrid()
      if (grid && countTiles(grid) >= 1) {
        clearInterval(autoExpandTimer); autoExpandTimer = null
        expandTo(targetSize)
      } else if (++tries > 40) { clearInterval(autoExpandTimer); autoExpandTimer = null }
    }, 250)
  }

  // Наблюдатель за DOM — rAF-debounce, чтобы выполнять работу не чаще 1 раза за кадр.
  let obsTickPending = false
  function obsTick () {
    obsTickPending = false
    killLegacyPanels()
    injectInlineButton()
    if (targetSize !== 'all' && typeof targetSize === 'number' && targetSize > BATCH) {
      const nav = findNativeNav()
      if (nav && nav.style.display !== 'none') {
        nav.style.display = 'none'
        rebuildPagination()
      }
    }
    if (targetSize === 'all') {
      const nav = findNativeNav()
      if (nav && nav.style.display !== 'none') nav.style.display = 'none'
    }
    // Пока есть in-flight expandTo — не дёргаем maybeAutoExpand из observer'а:
    // навигация юзера придёт через 'nmpp-locationchange'/'popstate' напрямую,
    // а лишний триггер здесь аборти́рует свежий expandTo и оставит грид недогруженным.
    if (!currentAbort && pathKey() !== lastPathKey) maybeAutoExpand()
  }
  const obs = new MutationObserver(() => {
    if (obsTickPending) return
    obsTickPending = true
    requestAnimationFrame(obsTick)
  })
  obs.observe(document.documentElement, { childList: true, subtree: true })

  ;['pushState', 'replaceState'].forEach(m => {
    const orig = history[m]
    history[m] = function () {
      const r = orig.apply(this, arguments)
      window.dispatchEvent(new Event('nmpp-locationchange'))
      return r
    }
  })
  window.addEventListener('nmpp-locationchange', maybeAutoExpand)
  window.addEventListener('popstate', maybeAutoExpand)

  // старт
  killLegacyPanels()
  injectInlineButton()
  maybeAutoExpand()
})()
