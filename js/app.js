// js/app.js

let todosJogos = [];
let visualizacaoAtual = "loja"; // "loja" ou "favoritos"

// Elementos capturados do DOM
const gamesGrid = document.getElementById("games-grid");
const loadingElement = document.getElementById("loading");
const searchInput = document.getElementById("search-input");
const sectionTitle = document.getElementById("section-title");
const gameCount = document.getElementById("game-count");
const btnLoja = document.getElementById("btn-loja");
const btnFavoritos = document.getElementById("btn-favoritos");

document.addEventListener("DOMContentLoaded", async () => {
    // Carrega os dados direto do arquivo js/api.js
    todosJogos = await carregarProdutosAPI();
    
    // Força o sumiço do carregando via JS nativo independente de classes CSS
    if (loadingElement) {
        loadingElement.style.display = "none";
    }
    
    renderizarInterface();
    configurarEventos();
});

function configurarEventos() {
    // Filtro dinâmico por digitação
    searchInput.addEventListener("input", () => {
        renderizarInterface();
    });

    // Mudar para aba Loja
    btnLoja.addEventListener("click", (e) => {
        e.preventDefault();
        visualizacaoAtual = "loja";
        btnLoja.classList.add("active");
        btnFavoritos.classList.remove("active");
        sectionTitle.innerHTML = `<span class="neon-dot"></span> Em Destaque`;
        renderizarInterface();
    });

    // Mudar para aba Favoritos
    btnFavoritos.addEventListener("click", (e) => {
        e.preventDefault();
        visualizacaoAtual = "favoritos";
        btnFavoritos.classList.add("active");
        btnLoja.classList.remove("active");
        sectionTitle.innerHTML = `<span class="neon-dot" style="background-color: #e53e3e; box-shadow: 0 0 8px #e53e3e;"></span> Meus Favoritos`;
        renderizarInterface();
    });
}

function renderizarInterface() {
    const termoBusca = searchInput.value.toLowerCase();
    let listaFiltrada = [];

    if (visualizacaoAtual === "loja") {
        listaFiltrada = todosJogos.filter(jogo => 
            jogo.title.toLowerCase().includes(termoBusca)
        );
    } else {
        const favoritos = obterFavoritos();
        listaFiltrada = favoritos.filter(jogo => 
            jogo.title.toLowerCase().includes(termoBusca)
        );
    }

    if (gameCount) {
        gameCount.innerText = `${listaFiltrada.length} jogo(s) encontrado(s)`;
    }

    renderizarCards(listaFiltrada);
}

function renderizarCards(jogos) {
    gamesGrid.innerHTML = "";

    if (jogos.length === 0) {
        gamesGrid.innerHTML = `
            <div class="col-12 text-center my-5 py-4">
                <i class="bi bi-patch-question text-muted fs-1 d-block mb-2"></i>
                <p class="text-muted fs-6">Nenhum jogo listado nesta seção.</p>
            </div>
        `;
        return;
    }

    jogos.forEach(jogo => {
        const favoritado = estaFavoritado(jogo.dealID);
        const classeIconeCoracao = favoritado ? "bi-heart-fill active" : "bi-heart";
        const porcentagemDesconto = Math.round(parseFloat(jogo.savings));

        const cardHTML = `
            <div class="col">
                <div class="game-card">
                    <div class="card-img-container">
                        <img src="${jogo.thumb}" alt="${jogo.title}" class="game-card-img" onerror="this.src='https://placehold.co/300x135/151a26/ffffff?text=WeGames'">
                        ${porcentagemDesconto > 0 ? `<div class="discount-badge">-${porcentagemDesconto}%</div>` : ''}
                    </div>
                    
                    <div class="card-details">
                        <h6 class="game-title" title="${jogo.title}">${jogo.title}</h6>
                        
                        <div class="d-flex justify-content-between align-items-center mt-auto">
                            <div>
                                <span class="price-sale">U$ ${jogo.salePrice}</span>
                                ${porcentagemDesconto > 0 ? `<span class="price-original">U$ ${jogo.normalPrice}</span>` : ''}
                            </div>
                            
                            <button class="btn-favorite-heart ${favoritado ? 'active' : ''}" onclick="alternarJogoFavorito('${jogo.dealID}')" title="Favoritar">
                                <i class="bi ${classeIconeCoracao}"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        gamesGrid.insertAdjacentHTML("beforeend", cardHTML);
    });
}

// Escopo global para responder ao clique do atributo onclick dos cards
window.alternarJogoFavorito = function(dealID) {
    let jogoAlvo = todosJogos.find(j => j.dealID === dealID);
    if (!jogoAlvo) {
        jogoAlvo = obterFavoritos().find(j => j.dealID === dealID);
    }

    if (jogoAlvo) {
        alternarFavorito(jogoAlvo); // Executa a sua lógica do storage.js
        renderizarInterface();       // Atualiza a tela imediatamente
    }
};