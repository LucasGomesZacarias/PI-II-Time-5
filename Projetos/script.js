/*
  Autor: Luiz Felipe da Conceição
  Arquivo: script.js
  Responsabilidade: controlar a página projetos.html.

  Funções principais:
  - carregar e renderizar os projetos
  - criar um projeto (quem cria vira líder)
  - abrir a lista de pessoas do projeto
  - adicionar e remover pessoas (só líder ou administrador)
*/

// id do projeto cuja lista de pessoas está aberta no modal
let projetoAberto = null;

// nomes vêm de usuários: escapa antes de colocar no HTML
function escaparHtml(texto) {
  const trocas = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  return String(texto).replace(/[&<>"']/g, (caractere) => trocas[caractere]);
}

async function carregarProjetos() {
  try {
    exibirMensagem("info", "Carregando projetos...");

    const projetos = await listarProjetosApi();

    renderizarProjetos(projetos);

    if (projetos.length === 0) {
      exibirMensagem("info", "Você ainda não participa de nenhum projeto. Crie o seu em Novo projeto.");
    } else {
      exibirMensagem("success", "Projetos carregados com sucesso.");
    }
  } catch (erro) {
    exibirMensagem("danger", erro.message);
  }
}

function renderizarProjetos(projetos) {
  const lista = document.getElementById("listaProjetos");

  lista.innerHTML = "";

  projetos.forEach((projeto) => {
    lista.innerHTML += `
      <div class="col-12 col-md-6 col-lg-4">
        <div class="card card-projeto h-100">
          <div class="card-body d-flex flex-column">
            <h2 class="h5">${escaparHtml(projeto.nome)}</h2>
            <p class="text-muted small mb-2">Líder: ${projeto.lider ? escaparHtml(projeto.lider) : "Sem líder"}</p>
            <p class="mb-3">
              <span class="badge text-bg-secondary">${projeto.totalMembros} pessoa(s)</span>
              ${criarBadgePapel(projeto.meuPapel)}
            </p>
            <button class="btn btn-sm btn-primary mt-auto" onclick="abrirModalMembros(${projeto.id})">
              Ver pessoas
            </button>
          </div>
        </div>
      </div>
    `;
  });
}

function criarBadgePapel(papel) {
  if (papel === "Líder") {
    return `<span class="badge badge-lider">Você é líder</span>`;
  }

  if (papel === "Membro") {
    return `<span class="badge text-bg-info">Você é membro</span>`;
  }

  return "";
}

async function criarProjeto(evento) {
  evento.preventDefault();

  const campoNome = document.getElementById("nomeProjeto");
  const erroNome = document.getElementById("erroNomeProjeto");
  const nome = campoNome.value.trim();

  campoNome.classList.remove("is-invalid");
  erroNome.innerText = "";

  // validação no navegador (a API valida de novo)
  if (nome === "") {
    campoNome.classList.add("is-invalid");
    erroNome.innerText = "O nome do projeto é obrigatório.";
    return;
  }

  if (nome.length < 3 || nome.length > 100) {
    campoNome.classList.add("is-invalid");
    erroNome.innerText = "O nome do projeto deve ter de 3 a 100 caracteres.";
    return;
  }

  try {
    await criarProjetoApi(nome);

    campoNome.value = "";
    bootstrap.Modal.getInstance(document.getElementById("modalNovoProjeto")).hide();

    await carregarProjetos();
    exibirMensagem("success", "Projeto criado! Você é o líder dele.");
  } catch (erro) {
    // erro com campo (nome repetido, por exemplo) aparece no próprio campo
    if (erro.campo === "nome") {
      campoNome.classList.add("is-invalid");
      erroNome.innerText = erro.message;
    } else {
      exibirMensagem("danger", erro.message);
      bootstrap.Modal.getInstance(document.getElementById("modalNovoProjeto")).hide();
    }
  }
}

async function abrirModalMembros(idProjeto) {
  try {
    projetoAberto = idProjeto;
    exibirMensagemMembros("", "");

    await atualizarModalMembros(idProjeto);

    bootstrap.Modal.getOrCreateInstance(document.getElementById("modalMembros")).show();
  } catch (erro) {
    exibirMensagem("danger", erro.message);
  }
}

// busca as pessoas do projeto e desenha o modal
async function atualizarModalMembros(idProjeto) {
  const dados = await listarMembrosApi(idProjeto);

  document.getElementById("tituloModalMembros").innerText = dados.projeto.nome;

  renderizarMembros(dados.membros, dados.podeGerenciar);

  const areaAdicionar = document.getElementById("areaAdicionar");

  // só o líder e o administrador veem a área de adicionar
  if (dados.podeGerenciar) {
    areaAdicionar.classList.remove("d-none");
    await carregarCandidatos(idProjeto);
  } else {
    areaAdicionar.classList.add("d-none");
  }
}

function renderizarMembros(membros, podeGerenciar) {
  const tabela = document.getElementById("tabelaMembros");

  tabela.innerHTML = "";

  membros.forEach((membro) => {
    // o líder não pode ser removido
    let acao = "";

    if (podeGerenciar && membro.papel !== "Líder") {
      acao = `
        <button class="btn btn-sm btn-outline-danger" onclick="removerMembro(${membro.usuarioId})">
          Remover
        </button>
      `;
    }

    tabela.innerHTML += `
      <tr>
        <td>${escaparHtml(membro.nome)}</td>
        <td>${escaparHtml(membro.email)}</td>
        <td>${escaparHtml(membro.papel)}</td>
        <td>${acao}</td>
      </tr>
    `;
  });
}

// desenha uma caixa de seleção (checkbox) para cada pessoa que ainda não está no projeto
async function carregarCandidatos(idProjeto) {
  const candidatos = await listarCandidatosApi(idProjeto);
  const lista = document.getElementById("listaCandidatos");

  document.getElementById("marcarTodos").checked = false;
  lista.innerHTML = "";

  if (candidatos.length === 0) {
    lista.innerHTML = `<p class="text-muted small mb-0">Todas as pessoas já participam deste projeto.</p>`;
    document.getElementById("botaoAdicionar").disabled = true;
    return;
  }

  document.getElementById("botaoAdicionar").disabled = false;

  candidatos.forEach((candidato) => {
    lista.innerHTML += `
      <div class="form-check">
        <input class="form-check-input caixa-candidato" type="checkbox" value="${candidato.id}" id="candidato${candidato.id}">
        <label class="form-check-label" for="candidato${candidato.id}">
          ${escaparHtml(candidato.nome)} <span class="text-muted small">(${escaparHtml(candidato.email)})</span>
        </label>
      </div>
    `;
  });
}

// marca ou desmarca todas as pessoas da lista
function marcarTodosCandidatos(marcado) {
  document.querySelectorAll(".caixa-candidato").forEach((caixa) => {
    caixa.checked = marcado;
  });
}

async function adicionarMembros() {
  const marcados = document.querySelectorAll(".caixa-candidato:checked");

  if (marcados.length === 0) {
    exibirMensagemMembros("warning", "Marque pelo menos uma pessoa para adicionar.");
    return;
  }

  const usuariosIds = Array.from(marcados).map((caixa) => Number(caixa.value));

  try {
    const resposta = await adicionarMembrosApi(projetoAberto, usuariosIds);

    await atualizarModalMembros(projetoAberto);
    exibirMensagemMembros("success", resposta.mensagem);

    carregarProjetos();
  } catch (erro) {
    exibirMensagemMembros("danger", erro.message);
  }
}

async function removerMembro(usuarioId) {
  if (!confirm("Deseja remover esta pessoa do projeto?")) {
    return;
  }

  try {
    await removerMembroApi(projetoAberto, usuarioId);

    await atualizarModalMembros(projetoAberto);
    exibirMensagemMembros("success", "Pessoa removida do projeto.");

    carregarProjetos();
  } catch (erro) {
    exibirMensagemMembros("danger", erro.message);
  }
}

function exibirMensagem(tipo, mensagem) {
  const areaMensagem = document.getElementById("areaMensagem");

  areaMensagem.className = `alert alert-${tipo}`;
  areaMensagem.innerText = mensagem;
}

function exibirMensagemMembros(tipo, mensagem) {
  const area = document.getElementById("areaMensagemMembros");

  if (mensagem === "") {
    area.className = "d-none";
    area.innerText = "";
    return;
  }

  area.className = `alert alert-${tipo}`;
  area.innerText = mensagem;
}

window.addEventListener("DOMContentLoaded", () => {
  carregarProjetos();
});
