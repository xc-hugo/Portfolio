// script.js
document.addEventListener('DOMContentLoaded', () => {
  const nav       = document.getElementById('navbar');
  const toggle    = document.getElementById('menu-toggle');
  const input     = document.getElementById('search-input');
  const btn       = document.getElementById('search-button');
  const countSpan = document.getElementById('result-count');
  const links     = document.querySelectorAll('.menu a');
  const logo      = document.getElementById('logo');

  // Só ativa hover/timers acima de 600px
  const isDesktop = () => window.matchMedia('(min-width: 601px)').matches;

  let navTimer     = null;
  let results      = [];
  let currentIndex = 0;
  let clearTimer   = null;
  let lastTerm     = '';

  // Backdrop para fechar ao clicar fora
  const backdrop = document.createElement('div');
  backdrop.className = 'nav-backdrop';
  backdrop.addEventListener('click', closeNav);

  // Remove apenas os spans de busca, sem tocar nas animações
  function clearHighlights() {
    document.querySelectorAll('span.search-result, span.highlight').forEach(span => {
      const textNode = document.createTextNode(span.textContent);
      span.parentNode.replaceChild(textNode, span);
    });
    countSpan.style.display = 'none';
    results = [];
    currentIndex = 0;
  }

  function updateSearchAvail() {
    const open = nav.classList.contains('expanded');
    input.disabled = btn.disabled = !open;
    if (!open && results.length > 0) clearHighlights();
  }

  function showBackdrop() {
    document.body.appendChild(backdrop);
  }
  function hideBackdrop() {
    if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
  }

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
    toggle.blur();
    updateSearchAvail();
  }

  // Desktop: abre no hover, fecha no mouseleave
  nav.addEventListener('mouseenter', () => {
    if (isDesktop()) expandNav();
  });
  nav.addEventListener('mouseleave', () => {
    if (isDesktop() && document.activeElement !== input) {
      navTimer = setTimeout(closeNav, 2500);
    }
  });

  // Manuseio de foco no campo de busca
  input.addEventListener('focus', () => {
    if (isDesktop()) clearTimeout(navTimer);
  });
  input.addEventListener('blur', () => {
    if (isDesktop() && !nav.matches(':hover')) {
      navTimer = setTimeout(closeNav, 2500);
    }
  });

  // Botão hambúrguer
  toggle.addEventListener('click', e => {
    e.preventDefault();
    clearTimeout(navTimer);
    nav.classList.contains('expanded') ? closeNav() : expandNav();
  });

  // Click no logo
  logo.addEventListener('click', e => {
    if (!nav.classList.contains('expanded')) {
      e.preventDefault();
    } else {
      document.getElementById('inicio').scrollIntoView({ behavior: 'smooth' });
      closeNav();
    }
  });

  // Links do menu
  links.forEach(a => {
    a.addEventListener('click', e => {
      if (!nav.classList.contains('expanded')) {
        e.preventDefault();
      } else {
        e.preventDefault();
        const tgt = document.querySelector(a.getAttribute('href'));
        if (tgt) tgt.scrollIntoView({ behavior: 'smooth' });
        closeNav();
      }
    });
  });

  // Procura e envolve ocorrências em <span class="search-result">
  function wrapMatches(term) {
    const regex = new RegExp(term.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&'), 'gi');
    document.querySelectorAll('main section').forEach(sec => {
      (function traverse(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          let last = 0, m, found = false;
          const frag = document.createDocumentFragment();
          regex.lastIndex = 0;
          while ((m = regex.exec(text)) !== null) {
            found = true;
            frag.appendChild(document.createTextNode(text.slice(last, m.index)));
            const span = document.createElement('span');
            span.className = 'search-result';
            span.textContent = m[0];
            frag.appendChild(span);
            results.push(span);
            last = m.index + m[0].length;
          }
          if (found) {
            frag.appendChild(document.createTextNode(text.slice(last)));
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
      countSpan.textContent = `${currentIndex + 1} de ${results.length}`;
      countSpan.style.display = 'inline-block';
    } else {
      countSpan.style.display = 'none';
    }
  }

  function highlightAt(i) {
    results.forEach(s => s.classList.remove('highlight'));
    currentIndex = (i + results.length) % results.length;
    const sp = results[currentIndex];
    sp.classList.add('highlight');
    sp.scrollIntoView({ behavior: 'smooth', block: 'center' });
    updateCount();
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => sp.classList.remove('highlight'), 3000);
  }

  // Executa a busca sem reiniciar animações
  function doSearch() {
    const term = input.value.trim();
    if (!term || !nav.classList.contains('expanded')) return;
    if (term === lastTerm && results.length) {
      highlightAt(currentIndex + 1);
    } else {
      lastTerm = term;
      clearHighlights();
      clearTimeout(clearTimer);
      wrapMatches(term);
      if (results.length) {
        highlightAt(0);
      } else {
        alert(`Nenhuma correspondência para "${term}"`);
      }
    }
  }

  // Eventos de busca
  btn.addEventListener('click', () => {
    doSearch();
    input.focus();
    clearTimeout(navTimer);
    if (isDesktop()) navTimer = setTimeout(closeNav, 2500);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      doSearch();
      input.focus();
    }
  });

  // Inicialização
  updateSearchAvail();
  clearHighlights();

  // Fecha nav apropriadamente no resize
  window.addEventListener('resize', () => {
    if (isDesktop() && !nav.matches(':hover') && nav.classList.contains('expanded')) {
      closeNav();
    }
    if (!isDesktop() && nav.classList.contains('expanded')) {
      closeNav();
    }
  });
});
