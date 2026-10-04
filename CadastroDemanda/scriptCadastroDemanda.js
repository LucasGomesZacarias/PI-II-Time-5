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
}


// executa quando o usuário clica em Cadastrar
formulario.addEventListener("submit", function (event) {
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

    
    // if (formValido) {
    //
    // }
});