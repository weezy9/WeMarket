const SEARCH_DEBOUNCE_MS = 350;
const COTACAO_DOLAR_REAL = 5;

const listaProdutos = document.getElementById("listaProdutos");
const listaFavoritos = document.getElementById("listaFavoritos");
const statusProdutos = document.getElementById("statusProdutos");
const contadorProdutos = document.getElementById("contadorProdutos");
const contadorFavoritos = document.getElementById("contadorFavoritos");
const carregarMais = document.getElementById("carregarMais");
const busca = document.getElementById("busca");
const formularioBusca = document.querySelector(".search-form");

let produtos = [];
let produtosGerais = [];
let resultadosBusca = [];
let favoritos = mesclarProdutosUnicos([], WeGamesStorage.carregarFavoritos().filter(produtoValido));
let paginaGeral = 0;
let paginaBusca = 0;
let termoBuscaAtual = "";
let temporizadorBusca = null;
let carregandoProdutos = false;
let chegouAoFimGeral = false;
let chegouAoFimBusca = true;
let requisicaoAtual = 0;
let controladorProdutos = null;

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function produtoValido(produto) {
  return produto && typeof produto.dealID === "string" && typeof produto.title === "string";
}

function mesclarProdutosUnicos(produtosAtuais, novosProdutos) {
  const mapaProdutos = new Map();

  [...produtosAtuais, ...novosProdutos].forEach((produto) => {
    const chave = chaveProduto(produto);
    const produtoExistente = mapaProdutos.get(chave);

    mapaProdutos.set(chave, escolherMelhorOferta(produtoExistente, produto));
  });

  return [...mapaProdutos.values()];
}

function chaveProduto(produto) {
  return produto.gameID ? String(produto.gameID) : produto.title.trim().toLowerCase().replace(/\s+/g, " ");
}

function escolherMelhorOferta(produtoAtual, novoProduto) {
  if (!produtoAtual) {
    return novoProduto;
  }

  const precoAtual = precoProduto(produtoAtual);
  const novoPreco = precoProduto(novoProduto);

  if (novoPreco < precoAtual) {
    return novoProduto;
  }

  if (novoPreco === precoAtual && descontoProduto(novoProduto) > descontoProduto(produtoAtual)) {
    return novoProduto;
  }

  return produtoAtual;
}

function precoProduto(produto) {
  const preco = Number(produto.salePrice);
  return Number.isFinite(preco) ? preco : Number.POSITIVE_INFINITY;
}

function descontoProduto(produto) {
  const desconto = Number(produto.savings);
  return Number.isFinite(desconto) ? desconto : 0;
}

async function carregarProdutos({ novaBusca = false } = {}) {
  const termo = termoBuscaAtual;
  const emBusca = Boolean(termo);
  const chegouAoFim = emBusca ? chegouAoFimBusca : chegouAoFimGeral;
  const paginaAtual = emBusca ? paginaBusca : paginaGeral;
  const produtosDoModo = emBusca ? resultadosBusca : produtosGerais;

  if ((!novaBusca && carregandoProdutos) || (!novaBusca && chegouAoFim)) {
    return;
  }

  if (controladorProdutos) {
    controladorProdutos.abort();
  }

  const idRequisicao = requisicaoAtual + 1;
  requisicaoAtual = idRequisicao;
  controladorProdutos = new AbortController();
  carregandoProdutos = true;
  atualizarBotaoCarregarMais();

  if (produtosDoModo.length === 0) {
    definirStatus(emBusca ? `Buscando "${termo}"...` : "Carregando ofertas...");
  }

  try {
    const resposta = await WeGamesAPI.buscarJogos({
      pagina: paginaAtual,
      termo,
      signal: controladorProdutos.signal,
    });
    const produtosValidos = resposta.produtos.filter(produtoValido);
    const produtosUnicos = mesclarProdutosUnicos(produtosDoModo, produtosValidos);

    if (idRequisicao !== requisicaoAtual) {
      return;
    }

    if (emBusca) {
      resultadosBusca = produtosUnicos;
      produtos = resultadosBusca;
      paginaBusca += 1;
      chegouAoFimBusca = resposta.chegouAoFim;
    } else {
      produtosGerais = produtosUnicos;
      produtos = produtosGerais;
      paginaGeral += 1;
      chegouAoFimGeral = resposta.chegouAoFim;
    }

    renderProdutos(produtos);
    renderFavoritos();
  } catch (erro) {
    if (erro.name === "AbortError") {
      return;
    }

    definirStatus(produtosDoModo.length === 0
      ? "Não foi possível carregar as ofertas. Tente novamente mais tarde."
      : "Não foi possível carregar mais jogos agora. Tente novamente em alguns instantes.", true);
    console.error(erro);
  } finally {
    if (idRequisicao === requisicaoAtual) {
      carregandoProdutos = false;
      controladorProdutos = null;
      atualizarBotaoCarregarMais();
    }
  }
}

function definirStatus(mensagem, erro = false) {
  statusProdutos.hidden = false;
  statusProdutos.textContent = mensagem;
  statusProdutos.classList.toggle("error", erro);
}

function esconderStatus() {
  statusProdutos.hidden = true;
  statusProdutos.textContent = "";
  statusProdutos.classList.remove("error");
}

function limparElemento(elemento) {
  elemento.replaceChildren();
}

function renderProdutos(lista) {
  limparElemento(listaProdutos);

  contadorProdutos.textContent = termoBuscaAtual
    ? formatarContadorBusca(lista.length)
    : `${produtosGerais.length} jogos carregados`;

  if (lista.length === 0) {
    definirStatus(termoBuscaAtual
      ? `Nenhum jogo encontrado para "${termoBuscaAtual}".`
      : "Nenhuma oferta disponível no momento.");
    atualizarBotaoCarregarMais();
    return;
  }

  esconderStatus();

  const fragmento = document.createDocumentFragment();

  lista.forEach((produto) => {
    fragmento.appendChild(criarColunaCard(criarCardProduto(produto)));
  });

  listaProdutos.appendChild(fragmento);
  atualizarBotaoCarregarMais();
}

function renderFavoritos() {
  limparElemento(listaFavoritos);
  contadorFavoritos.textContent = favoritos.length === 1 ? "1 favorito" : `${favoritos.length} favoritos`;

  if (favoritos.length === 0) {
    const vazio = document.createElement("p");
    vazio.className = "empty";
    vazio.textContent = "Nenhum jogo favoritado ainda.";
    listaFavoritos.appendChild(vazio);
    return;
  }

  const fragmento = document.createDocumentFragment();

  favoritos.forEach((produto) => {
    fragmento.appendChild(criarColunaCard(criarCardFavorito(produto)));
  });

  listaFavoritos.appendChild(fragmento);
}

function formatarContadorBusca(total) {
  return total === 1
    ? `1 resultado para "${termoBuscaAtual}"`
    : `${total} resultados para "${termoBuscaAtual}"`;
}

function criarColunaCard(card) {
  const coluna = document.createElement("div");
  coluna.className = "col-12 col-sm-6 col-md-4 col-xl-3";
  coluna.appendChild(card);
  return coluna;
}

function criarCardProduto(produto) {
  const favoritado = estaFavoritado(produto);
  const card = criarBaseCard(produto);
  const corpo = card.querySelector(".card-body");

  corpo.append(
    criarTitulo(produto.title),
    criarLinhaPreco(produto),
    criarAcoesProduto(produto, favoritado),
  );

  return card;
}

function criarCardFavorito(produto) {
  const card = criarBaseCard(produto);
  const corpo = card.querySelector(".card-body");
  const botaoRemover = document.createElement("button");

  botaoRemover.type = "button";
  botaoRemover.className = "btn btn-outline-danger btn-sm w-100 remove-favorite";
  botaoRemover.dataset.favoriteId = produto.dealID;
  botaoRemover.textContent = "Remover dos favoritos";

  corpo.append(criarTitulo(produto.title), criarLinhaPreco(produto), botaoRemover);

  return card;
}

function criarBaseCard(produto) {
  const card = document.createElement("article");
  const imagem = document.createElement("img");
  const corpo = document.createElement("div");

  card.className = "card-game";

  imagem.className = "game-cover";
  imagem.src = produto.thumb || "images/WeGames.png";
  imagem.alt = produto.title;
  imagem.loading = "lazy";
  imagem.addEventListener("error", () => {
    imagem.src = "images/WeGames.png";
    imagem.alt = "Capa indisponível";
  }, { once: true });

  corpo.className = "card-body";

  card.append(imagem, corpo);
  return card;
}

function criarTitulo(titulo) {
  const elemento = document.createElement("h3");
  elemento.className = "game-title";
  elemento.textContent = titulo;
  return elemento;
}

function criarLinhaPreco(produto) {
  const linha = document.createElement("div");
  const preco = document.createElement("span");

  linha.className = "price-row";

  preco.className = "price";
  preco.textContent = formatarPreco(produto.salePrice);

  linha.append(preco);

  if (temDesconto(produto)) {
    const precoAntigo = document.createElement("span");

    precoAntigo.className = "old-price";
    precoAntigo.textContent = formatarPreco(produto.normalPrice);
    linha.appendChild(precoAntigo);
  }

  return linha;
}

function criarAcoesProduto(produto, favoritado) {
  const acoes = document.createElement("div");
  const desconto = document.createElement("span");
  const botoes = document.createElement("div");
  const linkOferta = document.createElement("a");
  const favorito = document.createElement("button");

  acoes.className = "game-actions";

  if (temDesconto(produto)) {
    desconto.className = "discount";
    desconto.textContent = `-${Math.round(Number(produto.savings) || 0)}%`;
  } else {
    desconto.className = "discount-placeholder";
    desconto.setAttribute("aria-hidden", "true");
  }

  botoes.className = "card-buttons";

  linkOferta.className = "deal-link";
  linkOferta.href = `https://www.cheapshark.com/redirect?dealID=${encodeURIComponent(produto.dealID)}`;
  linkOferta.target = "_blank";
  linkOferta.rel = "noopener noreferrer";
  linkOferta.textContent = "Ver oferta";

  favorito.type = "button";
  favorito.className = `favorite${favoritado ? " active" : ""}`;
  favorito.dataset.favoriteId = produto.dealID;
  favorito.setAttribute("aria-pressed", String(favoritado));
  favorito.setAttribute("aria-label", favoritado ? `Remover ${produto.title} dos favoritos` : `Adicionar ${produto.title} aos favoritos`);
  favorito.title = favoritado ? "Remover dos favoritos" : "Adicionar aos favoritos";
  favorito.textContent = favoritado ? "★" : "☆";

  botoes.append(linkOferta, favorito);
  acoes.append(desconto, botoes);

  return acoes;
}

function formatarPreco(valor) {
  return formatadorMoeda.format((Number(valor) || 0) * COTACAO_DOLAR_REAL);
}

function temDesconto(produto) {
  const precoAtual = Number(produto.salePrice);
  const precoNormal = Number(produto.normalPrice);
  const desconto = Number(produto.savings);

  return Number.isFinite(precoAtual)
    && Number.isFinite(precoNormal)
    && precoNormal > precoAtual
    && desconto >= 1;
}

function estaFavoritado(produto) {
  const chave = typeof produto === "string" ? chaveFavoritoPorId(produto) : chaveProduto(produto);
  return favoritos.some((favorito) => chaveProduto(favorito) === chave);
}

function alternarFavorito(id) {
  const produto = produtos.find((item) => item.dealID === id);
  const chave = produto ? chaveProduto(produto) : chaveFavoritoPorId(id);
  const existe = favoritos.some((favorito) => chaveProduto(favorito) === chave);

  if (existe) {
    favoritos = favoritos.filter((favorito) => chaveProduto(favorito) !== chave);
  } else {
    if (!produto) {
      return;
    }

    favoritos = [...favoritos, produto];
  }

  WeGamesStorage.salvarFavoritos(favoritos);
  renderProdutos(produtos);
  renderFavoritos();
}

function chaveFavoritoPorId(id) {
  const produto = produtos.find((item) => item.dealID === id)
    || favoritos.find((item) => item.dealID === id);

  return produto ? chaveProduto(produto) : id;
}

function textoBusca() {
  return busca.value.trim().toLowerCase();
}

function prepararBusca() {
  const termo = textoBusca();

  clearTimeout(temporizadorBusca);
  cancelarRequisicaoAtual();

  if (!termo) {
    termoBuscaAtual = "";
    resultadosBusca = [];
    paginaBusca = 0;
    chegouAoFimBusca = true;
    produtos = produtosGerais;
    renderProdutos(produtos);

    if (produtosGerais.length === 0) {
      carregarProdutos();
    }

    return;
  }

  termoBuscaAtual = termo;
  resultadosBusca = [];
  paginaBusca = 0;
  chegouAoFimBusca = false;
  produtos = resultadosBusca;

  limparElemento(listaProdutos);
  contadorProdutos.textContent = `Buscando "${termo}"...`;
  definirStatus(`Buscando "${termo}"...`);
  atualizarBotaoCarregarMais();

  temporizadorBusca = setTimeout(() => {
    carregarProdutos({ novaBusca: true });
  }, SEARCH_DEBOUNCE_MS);
}

function cancelarRequisicaoAtual() {
  if (controladorProdutos) {
    controladorProdutos.abort();
    controladorProdutos = null;
  }

  requisicaoAtual += 1;
  carregandoProdutos = false;
}

function atualizarBotaoCarregarMais() {
  const emBusca = Boolean(termoBuscaAtual);
  const totalAtual = emBusca ? resultadosBusca.length : produtosGerais.length;
  const chegouAoFim = emBusca ? chegouAoFimBusca : chegouAoFimGeral;

  carregarMais.hidden = totalAtual === 0 || chegouAoFim;
  carregarMais.disabled = carregandoProdutos;
  carregarMais.textContent = carregandoProdutos
    ? "Carregando..."
    : emBusca ? "Carregar mais resultados" : "Carregar mais jogos";
}

function configurarEventos() {
  formularioBusca.addEventListener("submit", (evento) => {
    evento.preventDefault();
  });

  busca.addEventListener("input", () => {
    prepararBusca();
  });

  carregarMais.addEventListener("click", () => {
    carregarProdutos();
  });

  listaProdutos.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-favorite-id]");

    if (botao) {
      alternarFavorito(botao.dataset.favoriteId);
    }
  });

  listaFavoritos.addEventListener("click", (evento) => {
    const botao = evento.target.closest("[data-favorite-id]");

    if (botao) {
      alternarFavorito(botao.dataset.favoriteId);
    }
  });
}

configurarEventos();
renderFavoritos();
carregarProdutos();
