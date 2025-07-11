// 1. Seleção de Elementos do DOM
const nav           = document.getElementById('navbar');
const toggleBtn     = document.getElementById('menu-toggle');
const searchIn      = document.getElementById('search-input');
const searchBtn     = document.getElementById('search-button');
const countSpan     = document.getElementById('result-count');
const links         = document.querySelectorAll('.menu a');
const logo          = document.getElementById('logo');
const footer        = document.getElementById('footer');
const footerToggle  = document.getElementById('footer-toggle');

// 2. Variáveis de Estado e Constantes
let navTimer    = null;
let results     = [];
let currentIndex = 0;
let clearTimer  = null;
let lastTerm    = '';
let navLocked   = false;
let lastWidth   = window.innerWidth;
let lastHeight  = window.innerHeight;
const isDesktop = () => window.matchMedia('(min-width: 601px)').matches;

// 3. Backdrop para Nav Mobile
const backdrop = document.createElement('div');
backdrop.className = 'nav-backdrop';
backdrop.addEventListener('click', () => closeNav());

// 4. Funções Utilitárias
function showBackdrop() {
  document.body.appendChild(backdrop);
}
function hideBackdrop() {
  backdrop.remove();
}
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

// 5. Manipulação da Navbar e Busca
function expandNav() {
  clearTimeout(navTimer);
  nav.classList.add('expanded');
  showBackdrop();
  updateSearchAvail();
}
function closeNav(force = false) {
  if (!force && navLocked) return;
  clearTimeout(navTimer);
  nav.classList.remove('expanded');
  hideBackdrop();
  toggleBtn.blur();
  updateSearchAvail();
}
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

// 6. Eventos de Navegação e Busca
document.addEventListener('DOMContentLoaded', () => {
  // Navbar hover (desktop)
  nav.addEventListener('mouseenter', () => {
    if (isDesktop()) expandNav();
  });
  nav.addEventListener('mouseleave', () => {
    if (isDesktop() && document.activeElement !== searchIn) {
      navTimer = setTimeout(() => closeNav(), 2500);
    }
  });

  // Foco/desfoque da busca
  searchIn.addEventListener('focus', () => {
    navLocked = true;
    if (isDesktop()) clearTimeout(navTimer);
    nav.classList.add('expanded');
  });
  searchIn.addEventListener('blur', () => {
    navLocked = false;
    if (isDesktop() && !nav.matches(':hover')) {
      navTimer = setTimeout(() => closeNav(), 2500);
    }
  });

  // Toggle menu (mobile)
  toggleBtn.addEventListener('click', e => {
    e.preventDefault();
    if (nav.classList.contains('expanded')) {
      navLocked = false;
      closeNav(true);
    } else {
      expandNav();
    }
  });

  // Clique no logo
  logo.addEventListener('click', e => {
    e.preventDefault();
    if (nav.classList.contains('expanded')) {
      document.getElementById('inicio')
        .scrollIntoView({ behavior: 'smooth' });
      navLocked = false;
      closeNav(true);
    }
  });

  // Links do menu
  links.forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      if (nav.classList.contains('expanded')) {
        document.querySelector(a.getAttribute('href'))
          ?.scrollIntoView({ behavior: 'smooth' });
        navLocked = false;
        closeNav(true);
      }
    });
  });

  // Busca local
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

  // Proteção resize (teclado/mobile)
  window.addEventListener('resize', () => {
    if (navLocked) return;
    const wDiff = Math.abs(window.innerWidth - lastWidth);
    lastWidth = window.innerWidth;
    lastHeight = window.innerHeight;
    if (!isDesktop() && wDiff >= 80 && nav.classList.contains('expanded')) {
      closeNav();
    }
  });

  // Inicialização
  updateSearchAvail();
  clearHighlights();
});

// 7. Rodapé Interativo
footerToggle.addEventListener('click', () => {
  footer.classList.toggle('minimized');
  footerToggle.title = footer.classList.contains('minimized')
    ? 'Abrir rodapé'
    : 'Fechar rodapé';
});

// ===== Quiz.js – Lógica Completa e Centralizada =====

// 1. Elementos
const btnStart    = document.getElementById('btn-start-quiz');
const quizSection = document.getElementById('quiz');
const modal       = document.querySelector('.quiz-modal');
const btnClose    = document.getElementById('quiz-close');
const qTitle      = document.getElementById('quiz-title');
const qProgress   = document.getElementById('quiz-progress');
const qQuestion   = document.getElementById('quiz-question');
const qOptions    = document.getElementById('quiz-options');
const btnRestart  = document.getElementById('quiz-restart');

// 2. Perguntas sobre o portfólio
const allQuestions = [
  { q:'Qual o nome completo do autor deste portfólio?', opts:['Hugo Souza','Hugo Oliveira Silva','Hugo Santos','Hugo Ribeiro'], ans:1 },
  { q:'Em qual instituto federal ele estuda?', opts:['IFMA','UFMA','UEMA','UFRJ'], ans:0 },
  { q:'Qual o tema central do portfólio?', opts:['Web','Design gráfico','Jogos','Marketing'], ans:2 },
  { q:'Quantos projetos estão listados?', opts:['1','2','3','4'], ans:1 },
  { q:'Nome do primeiro projeto?', opts:['Mirror Jump','English Today','Game X','Jump Master'], ans:0 },
  { q:'Foco de "English Today"?', opts:['Ensino de inglês','Puzzle','Simulação','App mobile'], ans:0 },
  { q:'Quantas seções no menu?', opts:['4','5','6','7'], ans:2 },
  { q:'Frase antes de “Olá, eu sou o Hugo”?', opts:['Perfeição','Crítica/Avaliação','Código limpo','Primeiro passo'], ans:1 },
  { q:'Linguagens em “Sobre Mim”?', opts:['Java, Python,...','Assembly, F#,...','C#, TS,...','PHP, Go,...'], ans:0 },
  { q:'Game engines dominadas?', opts:['Unity/Unreal','GameMaker/Godot','CryEngine','Source'], ans:1 },
  { q:'Repositório do portfólio?', opts:['GitLab','Bitbucket','GitHub','SourceForge'], ans:2 },
  { q:'Onde publica jogos indie?', opts:['Kongregate','Newgrounds','Steam','Itch.io'], ans:3 },
  { q:'Serviço do formulário?', opts:['EmailJS','FormSubmit.co','SMTP','Mailchimp'], ans:1 },
  { q:'Idade do Autor?', opts:['15 anos','16 anos','17 anos','18 anos'], ans:1 },
  { q:'Qual idioma ele não domina?', opts:['Francês','Espanhol','Português','Inglês'], ans:0 },
  { q:'Estado informado?', opts:['São Paulo','Rio de Janeiro','Maranhão','Minas Gerais'], ans:2 }
];

let questions, currentQ, score;

// 3. Embaralhar array
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// 4. Abre o quiz
function startQuiz() {
  questions = allQuestions.slice();
  shuffle(questions);
  currentQ = 0;
  score = 0;
  btnRestart.classList.add('hidden');
  quizSection.classList.remove('hidden', 'closing');
  quizSection.classList.add('open');
  modal.classList.remove('closing');
  showQuestion();
}

// 5. Exibe cada pergunta com fade
function showQuestion() {
  modal.classList.add('fading');
  setTimeout(() => {
    const { q, opts } = questions[currentQ];
    qTitle.textContent    = 'Quiz do Portfolio';
    qProgress.textContent = `Pergunta ${currentQ + 1} de ${questions.length}`;
    qQuestion.textContent = q;
    qOptions.innerHTML    = '';
    opts.forEach((txt, i) => {
      const b = document.createElement('button');
      b.textContent = txt;
      b.disabled    = false;
      b.onclick     = () => selectOption(i, b);
      const li = document.createElement('li');
      li.appendChild(b);
      qOptions.appendChild(li);
    });
    modal.classList.remove('fading');
  }, 300);
}

// 6. Trata seleção e avança
function selectOption(i, btn) {
  const correctIndex = questions[currentQ].ans;
  if (i === correctIndex) {
    score++;
    btn.classList.add('correct');
  } else {
    btn.classList.add('wrong');
    qOptions.children[correctIndex].firstChild.classList.add('correct');
  }
  Array.from(qOptions.querySelectorAll('button')).forEach(b => b.disabled = true);
  setTimeout(() => {
    if (currentQ < questions.length - 1) {
      currentQ++;
      showQuestion();
    } else {
      showResult();
    }
  }, 800);
}

// 7. Exibe resultado final
function showResult() {
  modal.classList.add('fading');
  setTimeout(() => {
    qTitle.textContent    = 'Resultado';
    qProgress.textContent = '';
    qQuestion.textContent = `Você acertou ${score} de ${questions.length}!`;
    qOptions.innerHTML    = '';
    btnRestart.classList.remove('hidden');
    modal.classList.remove('fading');
  }, 300);
}

// 8. Reinicia o quiz
function restartQuiz() {
  startQuiz();
}

// 9. Fecha o quiz
function exitQuiz() {
  modal.classList.add('closing');
  quizSection.classList.remove('open');
  quizSection.classList.add('closing');
  setTimeout(() => {
    quizSection.classList.add('hidden');
    modal.classList.remove('closing');
    quizSection.classList.remove('closing');
  }, 400);
}

// 10. Event listeners
btnStart.addEventListener('click', startQuiz);
btnClose.addEventListener('click', exitQuiz);
btnRestart.addEventListener('click', restartQuiz);
// clicar fora para fechar
quizSection.addEventListener('click', e => {
  if (e.target === quizSection) exitQuiz();
});
