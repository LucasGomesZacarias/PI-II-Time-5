/*
  Autor: Luiz Felipe da Conceição
  Arquivo: api.js
  Responsabilidade: concentrar a chamada do Dashboard para a API.

  Backend esperado:
  http://localhost:3000

  Rota usada por esta tela:
  GET /dashboard -> totais por status, prioridade e tipo, críticas em aberto e próximas do prazo
*/

const API_BASE_URL = "http://localhost:3000";

async function tratarRespostaApi(resposta) {
  const dados = await resposta.json();

  if (!resposta.ok) {
    const mensagem = dados.mensagem || "Erro ao realizar a requisição";
    throw new Error(mensagem);
  }

  return dados;
}

async function buscarDashboardApi() {
  let resposta;

  try {
    resposta = await fetch(`${API_BASE_URL}/dashboard`);
  } catch (erro) {
    // servidor desligado, sem rede ou sem VPN
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }

  return await tratarRespostaApi(resposta);
}
