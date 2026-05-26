// ================================================
//  app.js — Lógica principal do WeGames
//  DOM manipulation, navegação, renderização
// ================================================

// ── Estado global ──
let todosJogos   = [];
let filtroAtivo  = null;   // { tipo: 'genero'|'plataforma', valor: string }
let jogoModal    = null;   // jogo atualmente aberto no modal

// ── Init ──
document.addEventListener('DOMContentLoaded', async () => {
  try {
    todosJogos = await carregarJogos();

    // Preenche estatísticas do Hero
    document.getElementById('stat-total').textContent   = todosJogos.length;
    document.getElementById('stat-generos').textContent = extrairGeneros(todosJogos).length;
    atualizarStatFavs();

    // Renderiza sidebar e seções iniciais
    renderizarGeneros(extrairGeneros(todosJogos));
    renderizarGrid(todosJogos.slice(0, 6), 'grid-destaque');
    renderizarGrid([...todosJogos].reverse().slice(0, 6), 'grid-lancamentos');

  } catch (erro) {
    console.error('Erro ao carregar jogos:', erro);
    document.getElementById('grid-destaque').innerHTML =
      '<p style="color:var(--txt2);grid-column:1/-1">Erro ao carregar jogos. Verifique sua conexão.</p>';
  } finally {
    esconderLoading();
  }

  configurarBusca();
  configurarMenu();
  configurarFavCounter();
});

// ── Renderiza grid genérico ──
function renderizarGrid(jogos, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!jogos.length) {
    el.innerHTML = '';
    return;
  }

  el.innerHTML = jogos.map((j, i) => cardHTML(j, i)).join('');

  // Eventos dos botões de favorito
  el.querySelectorAll('.btn-fav').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id       = Number(btn.dataset.id);
      const favoritou = toggleFavorito(id);
      btn.classList.toggle('on', favoritou);
      btn.innerHTML  = favoritou
        ? '<i class="bi bi-heart-fill"></i>'
        : '<i class="bi bi-heart"></i>';
      atualizarFavCounter();
      atualizarStatFavs();
      // Atualiza seção favoritos se estiver visível
      if (document.getElementById('sec-favoritos').style.display !== 'none') {
        renderizarFavoritos();
      }
    });
  });

  // Abre modal ao clicar no card (exceto no botão fav)
  el.querySelectorAll('.jogo-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = Number(card.dataset.id);
      const jogo = todosJogos.find(j => j.id === id);
      if (jogo) abrirModal(jogo);
    });
  });
}

// ── HTML de um card ──
function cardHTML(jogo, index = 0) {
  const fav  = isFavoritado(jogo.id);
  const plat = jogo.platform.includes('Windows') ? 'PC' : jogo.platform;
  const delay = Math.min(index * 40, 300);

  return `
    <div class="jogo-card" data-id="${jogo.id}" style="animation-delay:${delay}ms">
      <div class="card-thumb">
        <img
          src="${jogo.thumbnail}"
          alt="${jogo.title}"
          loading="lazy"
          onerror="this.src='https://placehold.co/365x205/131c2e/2979ff?text=WeGames'"
        />
        <span class="card-platform-badge">${plat}</span>
      </div>
      <div class="card-body">
        <div class="card-genre">${jogo.genre}</div>
        <div class="card-name" title="${jogo.title}">${jogo.title}</div>
        <div class="card-footer">
          <span class="card-free">GRÁTIS</span>
          <button class="btn-fav ${fav ? 'on' : ''}" data-id="${jogo.id}" title="${fav ? 'Desfavoritar' : 'Favoritar'}">
            <i class="bi bi-heart${fav ? '-fill' : ''}"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// ── Renderiza seção Favoritos ──
function renderizarFavoritos() {
  const favs  = getJogosFavoritados(todosJogos);
  const vazio = document.getElementById('fav-vazio');
  const badge = document.getElementById('fav-total-badge');

  badge.textContent = `${favs.length} jogo${favs.length !== 1 ? 's' : ''}`;

  if (!favs.length) {
    document.getElementById('grid-favoritos').innerHTML = '';
    vazio.style.display = 'flex';
  } else {
    vazio.style.display = 'none';
    renderizarGrid(favs, 'grid-favoritos');
  }
}

// ── Busca dinâmica ──
function configurarBusca() {
  const input = document.getElementById('busca-input');
  input.addEventListener('input', () => {
    const termo = input.value.trim();

    if (!termo) {
      // Volta ao estado anterior
      filtroAtivo
        ? aplicarFiltro(filtroAtivo.tipo, filtroAtivo.valor)
        : navegarPara('inicio');
      return;
    }

    const resultado = buscarJogos(todosJogos, termo);
    mostrarLoja(resultado, `Resultados para "${termo}"`);
  });
}

// ── Menu lateral ──
function configurarMenu() {
  document.querySelectorAll('.side-item[data-section]').forEach(item => {
    item.addEventListener('click', () => navegarPara(item.dataset.section));
  });
}

// ── Renderiza gêneros no sidebar ──
function renderizarGeneros(generos) {
  const menu = document.getElementById('generos-menu');
  menu.innerHTML = generos.map(g => `
    <li class="side-item" data-genero="${g}" onclick="aplicarFiltro('genero','${g.replace(/'/g,"\\'")}')">
      <i class="bi bi-tag"></i><span>${g}</span>
    </li>
  `).join('');
}

// ── Filtro por gênero ou plataforma ──
function aplicarFiltro(tipo, valor) {
  filtroAtivo = { tipo, valor };
  document.getElementById('busca-input').value = '';

  const jogos = tipo === 'genero'
    ? filtrarPorGenero(todosJogos, valor)
    : filtrarPorPlataforma(todosJogos, valor);

  mostrarLoja(jogos, valor);

  // Atualiza item ativo do sidebar
  document.querySelectorAll('.side-item').forEach(el => el.classList.remove('active'));
  const alvo = document.querySelector(`[data-genero="${valor}"]`);
  if (alvo) alvo.classList.add('active');
}

function filtrarPlataforma(plataforma) {
  aplicarFiltro('plataforma', plataforma);
}

// ── Exibe seção Loja com jogos filtrados ──
function mostrarLoja(jogos, titulo) {
  mostrarSecao('sec-loja');
  document.getElementById('loja-titulo').textContent = titulo;
  document.getElementById('loja-count').textContent  = `${jogos.length} jogo${jogos.length !== 1 ? 's' : ''}`;
  document.getElementById('loja-vazio').style.display = jogos.length ? 'none' : 'flex';
  renderizarGrid(jogos, 'grid-loja');
}

// ── Navegação entre seções ──
function navegarPara(secao) {
  filtroAtivo = null;
  document.getElementById('busca-input').value = '';

  document.querySelectorAll('.side-item').forEach(el => el.classList.remove('active'));
  const alvo = document.querySelector(`[data-section="${secao}"]`);
  if (alvo) alvo.classList.add('active');

  mostrarSecao(`sec-${secao}`);

  if (secao === 'favoritos') renderizarFavoritos();
  if (secao === 'loja') {
    mostrarLoja(todosJogos, 'Todos os Jogos');
    filtroAtivo = null;
  }
}

function mostrarSecao(id) {
  ['sec-inicio', 'sec-loja', 'sec-favoritos'].forEach(s => {
    document.getElementById(s).style.display = s === id ? 'block' : 'none';
  });
}

// ── Modal de detalhe ──
function abrirModal(jogo) {
  jogoModal = jogo;
  const fav = isFavoritado(jogo.id);

  document.getElementById('modal-img').src            = jogo.thumbnail;
  document.getElementById('modal-img').alt            = jogo.title;
  document.getElementById('modal-titulo').textContent = jogo.title;
  document.getElementById('modal-desc').textContent   = jogo.short_description;
  document.getElementById('modal-genero').textContent = jogo.genre;
  document.getElementById('modal-plataforma').textContent = jogo.platform;
  document.getElementById('modal-pub').textContent    = jogo.publisher;
  document.getElementById('modal-data').textContent   = new Date(jogo.release_date).toLocaleDateString('pt-BR');
  document.getElementById('modal-link').href          = jogo.game_url || '#';

  const btnFav = document.getElementById('modal-fav-btn');
  btnFav.classList.toggle('on', fav);
  btnFav.innerHTML = fav
    ? '<i class="bi bi-heart-fill"></i> Favoritado'
    : '<i class="bi bi-heart"></i> Favoritar';

  document.getElementById('modal-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function fecharModal(e) {
  if (e && e.target !== document.getElementById('modal-overlay') && !e.target.closest('.modal-close')) return;
  document.getElementById('modal-overlay').style.display = 'none';
  document.body.style.overflow = '';
  jogoModal = null;
}

function toggleFavModal() {
  if (!jogoModal) return;
  const favoritou = toggleFavorito(jogoModal.id);
  const btn = document.getElementById('modal-fav-btn');
  btn.classList.toggle('on', favoritou);
  btn.innerHTML = favoritou
    ? '<i class="bi bi-heart-fill"></i> Favoritado'
    : '<i class="bi bi-heart"></i> Favoritar';

  atualizarFavCounter();
  atualizarStatFavs();

  if (document.getElementById('sec-favoritos').style.display !== 'none') {
    renderizarFavoritos();
  }
}

// ── Fecha modal com ESC ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') fecharModal({ target: document.getElementById('modal-overlay') });
});

// ── Contador de favoritos no topbar ──
function configurarFavCounter() {
  const badge = document.getElementById('fav-counter');
  badge.addEventListener('click', () => navegarPara('favoritos'));
  atualizarFavCounter();
}

function atualizarFavCounter() {
  const total = totalFavoritos();
  const badge = document.getElementById('fav-counter');
  document.getElementById('fav-count').textContent = total;
  badge.style.display = total > 0 ? 'flex' : 'none';
}

function atualizarStatFavs() {
  document.getElementById('stat-favs').textContent = totalFavoritos();
}

// ── Loading ──
function esconderLoading() {
  const el = document.getElementById('loading');
  el.classList.add('hide');
  setTimeout(() => el.style.display = 'none', 400);
}