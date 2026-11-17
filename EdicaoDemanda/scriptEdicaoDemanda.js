// Autor: Felipe Evangelista Cruz e Augusto Henrique Marçura

// A tela busca e salva os dados no servidor do projeto.
const enderecoApi = "http://localhost:3000";
const parametros = new URLSearchParams(window.location.search);
const idDemanda = parametros.get("id");
let demanda = null;
let usuario = null;
try {
    usuario = JSON.parse(sessionStorage.getItem("usuarioLogado") || "null");
} catch {
    usuario = null;
}

// pega o formulário pelo id
const formulario = document.querySelector("#formEdicao");

// pega cada campo do formulário
const campoTitulo = document.querySelector("#titulo");
const campoTipo = document.querySelector("#tipo");
const campoPrioridade = document.querySelector("#prioridade");
const campoResponsavel = document.querySelector("#responsavel");
const campoAssociado = document.querySelector("#associado");
const campoPrazo = document.querySelector("#prazo");
const campoStatus = document.querySelector("#status");
const campoDescricao = document.querySelector("#descricao");

// Carrega os dados antes de permitir a edição.
async function carregarDemanda() {
    const aviso = document.querySelector("#avisoDemanda");
    formulario.hidden = true;
    if (!usuario || !Number.isSafeInteger(usuario.id) || usuario.id <= 0) {
        aviso.textContent = "Faça login para editar a demanda.";
        aviso.hidden = false;
        return;
    }
    if (!idDemanda || !/^\d+$/.test(idDemanda) || Number(idDemanda) <= 0) {
        aviso.textContent = "Escolha uma demanda válida na listagem.";
        aviso.hidden = false;
        return;
    }
    try {
        const resposta = await fetch(enderecoApi + "/demandas/" + encodeURIComponent(idDemanda));
        const dados = await resposta.json();
        if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível carregar a demanda.");
        demanda = dados;
        document.querySelector("#dataCriacao").textContent = demanda.dataCriacao ? new Date(demanda.dataCriacao).toLocaleDateString("pt-BR") : "Não definida";
        document.querySelector("#dataAtualizada").textContent = demanda.dataAtualizacao ? new Date(demanda.dataAtualizacao).toLocaleDateString("pt-BR") : "Não definida";
        campoTitulo.value = demanda.titulo;
        campoTipo.value = demanda.tipo;
        campoPrioridade.value = demanda.prioridade;
        campoResponsavel.value = demanda.responsavelId == null ? "" : String(demanda.responsavelId);
        campoAssociado.value = String(demanda.projetoId);
        campoStatus.value = demanda.status;
        campoDescricao.value = demanda.descricao;
        campoPrazo.value = demanda.prazo ? demanda.prazo.slice(0, 10) : "";
        formulario.hidden = false;
    } catch (erro) {
        aviso.textContent = erro.message || "Não foi possível carregar a demanda.";
        aviso.hidden = false;
    }
}
carregarDemanda();

// pega cada div onde a mensagem de erro vai aparecer
const erroTitulo = document.querySelector("#erroTitulo");
const erroTipo = document.querySelector("#erroTipo");
const erroPrioridade = document.querySelector("#erroPrioridade");
const erroResponsavel = document.querySelector("#erroResponsavel");
const erroAssociado = document.querySelector("#erroAssociado");
const erroPrazo = document.querySelector("#erroPrazo");
const erroStatus = document.querySelector("#erroStatus");
const erroDescricao = document.querySelector("#erroDescricao");


// lista com todos os campos, usada para limpar o estilo de erro
const camposComErro = [
    campoTitulo,
    campoTipo,
    campoPrioridade,
    campoResponsavel,
    campoAssociado,
    campoPrazo,
    campoStatus,
    campoDescricao
];

// lista com todas as mensagens de erro, usada para apagar os textos
const mensagensDeErro = [
    erroTitulo,
    erroTipo,
    erroPrioridade,
    erroResponsavel,
    erroAssociado,
    erroPrazo,
    erroStatus,
    erroDescricao
];

// deixa o campo vermelho e mostra a mensagem de erro
function mostrarErro(campo, elementoErro, mensagem) {
    campo.classList.add("is-invalid");
    elementoErro.innerText = mensagem;
}

// tira o vermelho dos campos e apaga as mensagens
function limparErros() {
    camposComErro.forEach(function (campo) {
        campo.classList.remove("is-invalid");
    });

    mensagensDeErro.forEach(function (elementoErro) {
        elementoErro.innerText = "";
    });
}


// executa quando o usuário clica em Salvar
formulario.addEventListener("submit", async function (event) {
    // impede o envio automático do formulário
    event.preventDefault();
    limparErros();

    // pega os valores digitados (trim tira espaços do começo e do fim)
    const titulo = campoTitulo.value.trim();
    const tipo = campoTipo.value;
    const prioridade = campoPrioridade.value;
    const responsavel = campoResponsavel.value.trim();
    const associado = campoAssociado.value.trim();
    const prazo = campoPrazo.value;
    const status = campoStatus.value;
    const descricao = campoDescricao.value.trim();

    // começa como válido e muda para false se achar algum erro
    let formValido = true;

    // título: obrigatório, entre 2 e 100 caracteres
    if (titulo === "") {
        mostrarErro(campoTitulo, erroTitulo, "O título é obrigatório.");
        formValido = false;
    } else if (titulo.length < 2) {
        mostrarErro(campoTitulo, erroTitulo, "O título deve possuir pelo menos 2 caracteres.");
        formValido = false;
    } else if (titulo.length > 100) {
        mostrarErro(campoTitulo, erroTitulo, "O título deve possuir no máximo 100 caracteres.");
        formValido = false;
    }

    // tipo: precisa ser escolhido
    if (tipo === "") {
        mostrarErro(campoTipo, erroTipo, "O tipo é obrigatório.");
        formValido = false;
    }

    // prioridade: precisa ser escolhida
    if (prioridade === "") {
        mostrarErro(campoPrioridade, erroPrioridade, "A prioridade é obrigatória.");
        formValido = false;
    }


    // projeto associado: obrigatório
    if (associado === "") {
        mostrarErro(campoAssociado, erroAssociado, "O projeto associado é obrigatório.");
        formValido = false;
    }

    // prazo: não é obrigatório, mas se for preenchido não pode ser data passada
    if (prazo !== "") {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataPrazo = new Date(prazo + "T00:00:00");

        const prazoAtual = demanda && demanda.prazo ? demanda.prazo.slice(0, 10) : "";
        if (dataPrazo < hoje && prazo !== prazoAtual) {
            mostrarErro(campoPrazo, erroPrazo, "O prazo não pode ser uma data passada.");
            formValido = false;
        }
    }

    // status: precisa ser um dos cinco status previstos no escopo
    if (status !== "Aberta" && status !== "Em andamento" && status !== "Em revisão" && status !== "Concluída" && status !== "Cancelada") {
        mostrarErro(campoStatus, erroStatus, "Selecione um status válido.");
        formValido = false;
    }

    // define os status permitidos a partir do status atual
    const transicoesPermitidas = {
        "Aberta": ["Aberta", "Em andamento", "Cancelada"],
        "Em andamento": ["Em andamento", "Em revisão", "Cancelada"],
        "Em revisão": ["Em revisão", "Em andamento", "Concluída", "Cancelada"],
        "Concluída": ["Concluída"],
        "Cancelada": ["Cancelada"]
    };

    // impede uma mudança que não esteja no ciclo de vida da demanda
    if (demanda) {
        const proximosStatus = transicoesPermitidas[demanda.status];
        if (!proximosStatus || !proximosStatus.includes(status)) {
            mostrarErro(campoStatus, erroStatus, "Essa mudança de status não é permitida");
            formValido = false;
        }
    }

    // descrição: obrigatória, entre 10 e 500 caracteres
    if (descricao === "") {
        mostrarErro(campoDescricao, erroDescricao, "A descrição é obrigatória.");
        formValido = false;
    } else if (descricao.length < 10) {
        mostrarErro(campoDescricao, erroDescricao, "A descrição deve possuir pelo menos 10 caracteres.");
        formValido = false;
    } else if (descricao.length > 500) {
        mostrarErro(campoDescricao, erroDescricao, "A descrição deve possuir no máximo 500 caracteres.");
        formValido = false;
    }

    // O servidor verifica os dados e grava a demanda junto com seu histórico.
    if (formValido && demanda && usuario) {
        const projetoId = Number(associado);
        const responsavelId = responsavel === "" ? null : Number(responsavel);
        if (!Number.isSafeInteger(projetoId) || projetoId <= 0) {
            mostrarErro(campoAssociado, erroAssociado, "Informe um ID de projeto válido.");
            return;
        }
        if (responsavelId !== null && (!Number.isSafeInteger(responsavelId) || responsavelId <= 0)) {
            mostrarErro(campoResponsavel, erroResponsavel, "Informe um ID de responsável válido.");
            return;
        }
        const dados = {
            titulo: titulo, tipo: tipo, prioridade: prioridade, responsavelId: responsavelId,
            projetoId: projetoId, prazo: prazo || null, status: status, descricao: descricao
        };
        const botao = formulario.querySelector('button[type="submit"]');
        botao.disabled = true;
        try {
            const resposta = await fetch(enderecoApi + "/demandas/" + encodeURIComponent(idDemanda), {
                method: "PUT",
                headers: { "Content-Type": "application/json", "x-usuario-id": String(usuario.id) },
                body: JSON.stringify(dados)
            });
            const resultado = await resposta.json();
            if (!resposta.ok) throw new Error(resultado.mensagem || "Não foi possível salvar a demanda.");
            window.alert(resultado.mensagem);
            await carregarDemanda();
        } catch (erro) {
            window.alert(erro.message || "Não foi possível salvar a demanda.");
        } finally {
            botao.disabled = false;
        }
    }
});
