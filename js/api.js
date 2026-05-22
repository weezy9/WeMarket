// js/api.js

const API_URL = "https://www.cheapshark.com/api/1.0/deals?storeID=1&upperPrice=50";

/**
 * Consome a API pública de ofertas de jogos
 * @returns {Promise<Array>} Lista de ofertas de jogos
 */
async function carregarProdutosAPI() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error("Erro ao buscar dados do servidor externo.");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Erro na requisição da API:", error);
        return [];
    }
}