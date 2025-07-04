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

  /* ————— Proteção contra resize do teclado ————— */
  let lastWidth  = window.innerWidth;
  let lastHeight = window.innerHeight;

  /* Backdrop que fecha a nav ao clicar fora (mobile) */
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  backdrop.addEventListener('click', closeNav);

  /* ---------- funções utilitárias ---------- */
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

  function showBackdrop()  { document.body.appendChild(backdrop); }
  function hideBackdrop()  { backdrop.remove(); }

  function expandNav() {
    clearTimeout(navTimer);
    nav.classList.add('expanded');
    showBackdrop();
    updateSearchAvail();
  }
  function closeNav() {
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
      navTimer = setTimeout(closeNav, 2500);
    }
  });

  searchIn.addEventListener('focus', () => {
    if (isDesktop()) clearTimeout(navTimer);
    nav.classList.add('expanded');          // garante aberta no desktop
  });
  searchIn.addEventListener('blur', () => {
    if (isDesktop() && !nav.matches(':hover')) {
      navTimer = setTimeout(closeNav, 2500);
    }
  });

  toggleBtn.addEventListener('click', e => {
    e.preventDefault();
    nav.classList.contains('expanded') ? closeNav() : expandNav();
  });

  logo.addEventListener('click', e => {
    if (!nav.classList.contains('expanded')) {
      e.preventDefault();
    } else {
      e.preventDefault();
      document.getElementById('inicio').scrollIntoView({ behavior: 'smooth' });
      closeNav();
    }
  });

  links.forEach(a => {
    a.addEventListener('click', e => {
      if (!nav.classList.contains('expanded')) {
        e.preventDefault();
      } else {
        e.preventDefault();
        document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
        closeNav();
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
    if (isDesktop()) navTimer = setTimeout(closeNav, 2500);
  });
  searchIn.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
      searchIn.focus();
    }
  });

  /* ---------- resize robusto (corrige teclado) ---------- */
  window.addEventListener('resize', () => {
    /* IGNORA completamente se o teclado está aberto */
    if (document.activeElement === searchIn) return;

    const wDiff = Math.abs(window.innerWidth  - lastWidth);
    const hDiff = Math.abs(window.innerHeight - lastHeight);
    lastWidth  = window.innerWidth;
    lastHeight = window.innerHeight;

    /* ----- desktop ----- */
    if (isDesktop()) {
      if (!nav.matches(':hover') && nav.classList.contains('expanded')) closeNav();
      return;
    }

    /* ----- mobile: só reage a mudança grande de largura (rotação) ----- */
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
