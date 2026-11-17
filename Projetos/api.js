/*
  Autor: Luiz Felipe da Conceição
  Arquivo: api.js
  Responsabilidade: concentrar as chamadas da tela de Projetos para a API.

  Backend esperado:
  http://localhost:3000

  Rotas usadas por esta tela (todas enviam o header x-usuario-id):
  GET   /projetos/resumo
  POST  /projetos
  GET   /projetos/:id/membros
  GET   /projetos/:id/candidatos
  POST  /projetos/:id/membros
  PATCH /projetos/:id/membros/:usuarioId/remover
*/

const API_BASE_URL = "http://localhost:3000";

// chave onde a tela de login guardou o usuário (sessionStorage)
const CHAVE_USUARIO_LOGADO = "usuarioLogado";

function lerUsuarioLogado() {
  try {
    return JSON.parse(sessionStorage.getItem(CHAVE_USUARIO_LOGADO));
  } catch (erro) {
    return null;
  }
}

async function tratarRespostaApi(resposta) {
  const dados = await resposta.json();

  if (!resposta.ok) {
    const mensagem = dados.mensagem || "Erro ao realizar a requisição";
    const erro = new Error(mensagem);

    // a API informa qual campo errou (ex.: nome)
    erro.campo = dados.campo;
    throw erro;
  }

  return dados;
}

async function chamarApi(caminho, metodo = "GET", corpo = null) {
  const usuario = lerUsuarioLogado();

  const opcoes = {
    method: metodo,
    headers: {
      "x-usuario-id": usuario ? usuario.id : ""
    }
  };

  if (corpo) {
    opcoes.headers["Content-Type"] = "application/json";
    opcoes.body = JSON.stringify(corpo);
  }

  let resposta;

  try {
    resposta = await fetch(`${API_BASE_URL}${caminho}`, opcoes);
  } catch (erro) {
    // servidor desligado, sem rede ou sem VPN
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }

  return await tratarRespostaApi(resposta);
}

async function listarProjetosApi() {
  return await chamarApi("/projetos/resumo");
}

async function criarProjetoApi(nome) {
  return await chamarApi("/projetos", "POST", { nome });
}

async function listarMembrosApi(idProjeto) {
  return await chamarApi(`/projetos/${idProjeto}/membros`);
}

async function listarCandidatosApi(idProjeto) {
  return await chamarApi(`/projetos/${idProjeto}/candidatos`);
}

async function adicionarMembrosApi(idProjeto, usuariosIds) {
  return await chamarApi(`/projetos/${idProjeto}/membros`, "POST", { usuariosIds });
}

async function removerMembroApi(idProjeto, usuarioId) {
  return await chamarApi(`/projetos/${idProjeto}/membros/${usuarioId}/remover`, "PATCH");
}
