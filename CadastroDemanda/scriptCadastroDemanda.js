// Autor: Felipe Evangelista Cruz

// pega o formulário pelo id
const formulario = document.querySelector("#formCadastro");

// pega cada campo do formulário
const campoTitulo = document.querySelector("#titulo");
const campoTipo = document.querySelector("#tipo");
const campoPrioridade = document.querySelector("#prioridade");
const campoResponsavel = document.querySelector("#responsavel");
const campoAssociado = document.querySelector("#associado");
const campoPrazo = document.querySelector("#prazo");
const campoDescricao = document.querySelector("#descricao");

// pega cada div onde a mensagem de erro vai aparecer
const erroTitulo = document.querySelector("#erroTitulo");
const erroTipo = document.querySelector("#erroTipo");
const erroPrioridade = document.querySelector("#erroPrioridade");
const erroResponsavel = document.querySelector("#erroResponsavel");
const erroAssociado = document.querySelector("#erroAssociado");
const erroPrazo = document.querySelector("#erroPrazo");
const erroDescricao = document.querySelector("#erroDescricao");

// pega a div onde a mensagem de sucesso ou de erro da API vai aparecer
const areaMensagem = document.querySelector("#areaMensagem");

// pega o botão de cadastrar (usado para evitar clique duplo)
const botaoCadastrar = document.querySelector("#botaoCadastrar");

// endereço onde a API está rodando
const API_BASE_URL = "http://localhost:3000";


// lista com todos os campos, usada para limpar o estilo de erro
const camposComErro = [
    campoTitulo,
    campoTipo,
    campoPrioridade,
    campoResponsavel,
    campoAssociado,
    campoPrazo,
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

    // apaga também a mensagem da API do envio anterior
    areaMensagem.className = "";
    areaMensagem.innerText = "";
}

// mostra a mensagem da API (tipo: success ou danger, são as cores do Bootstrap)
function exibirMensagem(tipo, mensagem) {
    areaMensagem.className = "alert alert-" + tipo;
    areaMensagem.innerText = mensagem;
}

// lê a resposta da API e gera um erro com a mensagem dela quando o status não é de sucesso
async function tratarRespostaApi(resposta) {
    let dados = {};

    try {
        dados = await resposta.json();
    } catch (erro) {
        // a resposta não veio em JSON
        dados = {};
    }

    if (!resposta.ok) {
        throw new Error(dados.mensagem || "Erro ao realizar a requisição.");
    }

    return dados;
}

// faz o fetch na API e devolve a resposta já tratada
async function chamarApi(url, opcoes) {
    let resposta;

    try {
        resposta = await fetch(url, opcoes);
    } catch (erro) {
        // cai aqui quando o servidor está desligado ou não responde
        throw new Error("Não foi possível conectar com o servidor.");
    }

    return await tratarRespostaApi(resposta);
}

// GET /projetos
async function listarProjetosApi() {
    return await chamarApi(API_BASE_URL + "/projetos");
}

// GET /usuarios
async function listarUsuariosApi() {
    return await chamarApi(API_BASE_URL + "/usuarios");
}

// POST /demandas
async function cadastrarDemandaApi(demanda) {
    return await chamarApi(API_BASE_URL + "/demandas", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(demanda)
    });
}

// coloca os projetos do banco na lista de projeto associado
async function carregarProjetos() {
    try {
        const projetos = await listarProjetosApi();

        projetos.forEach(function (projeto) {
            const opcao = document.createElement("option");
            opcao.value = projeto.id;
            opcao.innerText = projeto.nome;
            campoAssociado.appendChild(opcao);
        });
    } catch (erro) {
        exibirMensagem("danger", "Não foi possível carregar os projetos: " + erro.message);
    }
}

// coloca os usuários do banco na lista de responsável
async function carregarResponsaveis() {
    try {
        const usuarios = await listarUsuariosApi();

        usuarios.forEach(function (usuario) {
            const opcao = document.createElement("option");
            opcao.value = usuario.id;
            opcao.innerText = usuario.nome;
            campoResponsavel.appendChild(opcao);
        });
    } catch (erro) {
        // o responsável é opcional, então se a lista não carregar o formulário continua funcionando
        console.error(erro);
    }
}


// executa quando o usuário clica em Cadastrar
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

        if (dataPrazo < hoje) {
            mostrarErro(campoPrazo, erroPrazo, "O prazo não pode ser uma data passada.");
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


    // se achou algum erro, não envia para a API
    if (!formValido) {
        return;
    }

    // desliga o botão enquanto envia, para não cadastrar duas vezes
    botaoCadastrar.disabled = true;

    try {
        // monta o objeto com os dados que a API espera
        const demanda = {
            titulo: titulo,
            descricao: descricao,
            tipo: tipo,
            prioridade: prioridade,
            projetoId: associado,
            responsavelId: responsavel,
            prazo: prazo
        };

        const resposta = await cadastrarDemandaApi(demanda);

        // deu certo: mostra a mensagem e limpa o formulário
        exibirMensagem("success", resposta.mensagem);
        formulario.reset();
    } catch (erro) {
        // deu erro na API: mostra a mensagem para o usuário
        exibirMensagem("danger", erro.message);
    } finally {
        botaoCadastrar.disabled = false;
    }
});

// carrega as listas de projeto e de responsável quando a página abre
carregarProjetos();
carregarResponsaveis();