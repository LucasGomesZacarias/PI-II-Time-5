/*
  Autor: Luiz Felipe da Conceição
  Arquivo: api.js
  Responsabilidade: concentrar as chamadas da tela de login para a API.

  Backend esperado:
  http://localhost:3000

  Rotas usadas por esta tela:
  POST /login      -> confere e-mail e senha e devolve o usuário (sem senha)
  POST /usuarios   -> cadastra um novo usuário (entra como Membro da Equipe)
*/

const API_BASE_URL = "http://localhost:3000";

async function tratarRespostaApi(resposta) {
  const dados = await resposta.json();

  if (!resposta.ok) {
    const mensagem = dados.mensagem || "Erro ao realizar a requisição";
    const erro = new Error(mensagem);

    // a API informa qual campo errou (nome, email, senha ou confirmaSenha)
    erro.campo = dados.campo;
    throw erro;
  }

  return dados;
}

async function enviarJsonApi(caminho, corpo) {
  let resposta;

  try {
    resposta = await fetch(`${API_BASE_URL}${caminho}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(corpo)
    });
  } catch (erro) {
    // servidor desligado, sem rede ou sem VPN
    throw new Error("Não foi possível conectar ao servidor. Tente novamente.");
  }

  return await tratarRespostaApi(resposta);
}

async function loginApi(email, senha) {
  return await enviarJsonApi("/login", { email, senha });
}

async function cadastrarUsuarioApi(usuario) {
  return await enviarJsonApi("/usuarios", usuario);
}
