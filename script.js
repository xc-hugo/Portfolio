// script.js
document.addEventListener('DOMContentLoaded', () => {
  /* ============================================================
     NAVBAR + BUSCA
  ============================================================ */
  const nav        = document.getElementById('navbar');
  const toggleBtn  = document.getElementById('menu-toggle');
  const searchIn   = document.getElementById('search-input');
  const searchBtn  = document.getElementById('search-button');
  const countSpan  = document.getElementById('result-count');
  const links      = document.querySelectorAll('.menu a');
  const logo       = document.getElementById('logo');

  /* break‑point p/ “desktop” */
  const isDesktop = () => window.matchMedia('(min-width: 601px)').matches;

  let navTimer      = null;
  let results       = [];
  let currentIndex  = 0;
  let clearTimer    = null;
  let lastTerm      = '';

  /* ---------- cadeado: impede fechamento enquanto editando ---------- */
  let navLocked = false;

  /* ---------- proteção contra resize do teclado ---------- */
  let lastWidth  = window.innerWidth;
  let lastHeight = window.innerHeight;

  /* Backdrop que fecha a nav ao clicar fora (mobile) */
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  backdrop.addEventListener('click', () => closeNav());

  /* ---------- helpers ---------- */
  function clearHighlights() {
    document.querySelectorAll('span.search-result, span.highlight')
      .forEach(span => span.replaceWith(document.createTextNode(span.textContent)));
    countSpan.style.display = 'none';
    results = [];
    currentIndex = 0;
  }

  function updateSearchAvail() {
    const open = nav.classList.contains('expanded');
    searchIn.disabled = searchBtn.disabled = !open;
    if (!open && results.length) clearHighlights();
  }

  function showBackdrop() { document.body.appendChild(backdrop); }
  function hideBackdrop() { backdrop.remove(); }

  function expandNav() {
    clearTimeout(navTimer);
    nav.classList.add('expanded');
    showBackdrop();
    updateSearchAvail();
  }

  /* ◂  fecha só se não estiver “travada” */
  function closeNav(force = false) {
    if (!force && navLocked) return;      // respeita o cadeado
    clearTimeout(navTimer);
    nav.classList.remove('expanded');
    hideBackdrop();
    toggleBtn.blur();
    updateSearchAvail();
  }

  /* ---------- eventos de navegação ---------- */
  nav.addEventListener('mouseenter', () => {
    if (isDesktop()) expandNav();
  });
  nav.addEventListener('mouseleave', () => {
    if (isDesktop() && document.activeElement !== searchIn) {
      navTimer = setTimeout(() => closeNav(), 2500);
    }
  });

  /*  foco/desfoque do campo de busca */
  searchIn.addEventListener('focus', () => {
    navLocked = true;                // ativa cadeado
    if (isDesktop()) clearTimeout(navTimer);
    nav.classList.add('expanded');   // garante aberta
  });
  searchIn.addEventListener('blur', () => {
    navLocked = false;               // libera cadeado
    if (isDesktop() && !nav.matches(':hover')) {
      navTimer = setTimeout(() => closeNav(), 2500);
    }
  });

  /* botão hamburguer */
  toggleBtn.addEventListener('click', e => {
    e.preventDefault();
    if (nav.classList.contains('expanded')) {
      navLocked = false;             // permite fechar
      closeNav(true);
    } else {
      expandNav();
    }
  });

  /* clique no logo */
  logo.addEventListener('click', e => {
    if (!nav.classList.contains('expanded')) {
      e.preventDefault();
    } else {
      e.preventDefault();
      document.getElementById('inicio').scrollIntoView({ behavior: 'smooth' });
      navLocked = false;
      closeNav(true);
    }
  });

  /* links de navegação */
  links.forEach(a => {
    a.addEventListener('click', e => {
      if (!nav.classList.contains('expanded')) {
        e.preventDefault();
      } else {
        e.preventDefault();
        document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
        navLocked = false;
        closeNav(true);
      }
    });
  });

  /* ---------- busca local ---------- */
  function wrapMatches(term) {
    const regex = new RegExp(term.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&'), 'gi');
    document.querySelectorAll('main section').forEach(sec => {
      (function traverse(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const txt = node.textContent;
          let last = 0, m, found = false;
          const frag = document.createDocumentFragment();
          regex.lastIndex = 0;
          while ((m = regex.exec(txt)) !== null) {
            found = true;
            frag.appendChild(document.createTextNode(txt.slice(last, m.index)));
            const span = document.createElement('span');
            span.className = 'search-result';
            span.textContent = m[0];
            frag.appendChild(span);
            results.push(span);
            last = m.index + m[0].length;
          }
          if (found) {
            frag.appendChild(document.createTextNode(txt.slice(last)));
            node.parentNode.replaceChild(frag, node);
          }
        } else if (
          node.nodeType === Node.ELEMENT_NODE &&
          !['SCRIPT','STYLE'].includes(node.tagName) &&
          !node.classList.contains('search-result')
        ) {
          Array.from(node.childNodes).forEach(traverse);
        }
      })(sec);
    });
  }

  function updateCount() {
    if (results.length) {
      countSpan.textContent = `${currentIndex+1} de ${results.length}`;
      countSpan.style.display = 'inline-block';
    } else {
      countSpan.style.display = 'none';
    }
  }

  function highlightAt(i) {
    results.forEach(r => r.classList.remove('highlight'));
    currentIndex = (i + results.length) % results.length;
    const sp = results[currentIndex];
    sp.classList.add('highlight');
    sp.scrollIntoView({ behavior:'smooth', block:'center' });
    updateCount();
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => sp.classList.remove('highlight'), 3000);
  }

  function doSearch() {
    const term = searchIn.value.trim();
    if (!term || !nav.classList.contains('expanded')) return;

    if (term === lastTerm && results.length) {
      highlightAt(currentIndex + 1);
    } else {
      lastTerm = term;
      clearHighlights();
      clearTimeout(clearTimer);
      wrapMatches(term);
      results.length ? highlightAt(0)
                     : alert(`Nenhuma correspondência para “${term}”`);
    }
  }

  searchBtn.addEventListener('click', () => {
    doSearch();
    searchIn.focus();
    if (isDesktop()) navTimer = setTimeout(() => closeNav(), 2500);
  });
  searchIn.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
      searchIn.focus();
    }
  });

  /* ---------- resize robusto: ignora teclado ---------- */
  window.addEventListener('resize', () => {
    if (navLocked) return;            // teclado aberto → ignora
    const wDiff = Math.abs(window.innerWidth  - lastWidth);
    lastWidth  = window.innerWidth;
    lastHeight = window.innerHeight;

    /* desktop fecha quando mouse sai (já tratado ali em cima) */
    if (isDesktop()) return;

    /* mobile: só fecha se largura mudou muito (rotação/split) */
    if (wDiff >= 80 && nav.classList.contains('expanded')) closeNav();
  });

  /* init */
  updateSearchAvail();
  clearHighlights();
});

/* ============================================================
   RODAPÉ INTERATIVO
============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  const footer = document.getElementById('footer');
  const toggle = document.getElementById('footer-toggle');

  toggle.addEventListener('click', () => {
    footer.classList.toggle('minimized');
    toggle.title = footer.classList.contains('minimized')
      ? 'Abrir rodapé'
      : 'Fechar rodapé';
  });
});
