// LUIZ FELIPE DA CONCEICAO

//Troca entre login e cadastro
const card = document.querySelector(".card");
const botaoFacaLogin = document.querySelector("#btnFacaLogin");
const botaoFacaCadastro = document.querySelector("#btnFacaCadastro");

botaoFacaLogin.addEventListener("click", function () {
    card.classList.remove("cadastroActive");
    card.classList.add("loginActive");
});

botaoFacaCadastro.addEventListener("click", function () {
    card.classList.remove("loginActive");
    card.classList.add("cadastroActive");
});

//Formularios
const formularioLogin = document.querySelector("#formularioLogin");
const formularioCadastro = document.querySelector("#formularioCadastro");

//Campos do login
const campoEmailLogin = document.querySelector("#email_id");
const campoSenhaLogin = document.querySelector("#senha_id");

//Campos do cadastro
const campoNome = document.querySelector("#nome_id");
const campoEmailCadastro = document.querySelector("#emailCadastro_id");
const campoSenhaCadastro = document.querySelector("#senhaCadastro_id");
const campoConfirmaSenha = document.querySelector("#confirmaSenha_id");

//Mensagens de erro do login
const erroEmailLogin = document.querySelector("#erroEmailLogin");
const erroSenhaLogin = document.querySelector("#erroSenhaLogin");

//Mensagens de erro do cadastro
const erroNome = document.querySelector("#erroNome");
const erroEmailCadastro = document.querySelector("#erroEmailCadastro");
const erroSenhaCadastro = document.querySelector("#erroSenhaCadastro");
const erroConfirmaSenha = document.querySelector("#erroConfirmaSenha");

//Mensagens de sucesso
const mensagemLogin = document.querySelector("#mensagemLogin");
const mensagemCadastro = document.querySelector("#mensagemCadastro");

//Listas para limpar os erros
const camposLogin = [
    campoEmailLogin,
    campoSenhaLogin
];

const mensagensErroLogin = [
    erroEmailLogin,
    erroSenhaLogin
];

const camposCadastro = [
    campoNome,
    campoEmailCadastro,
    campoSenhaCadastro,
    campoConfirmaSenha
];

const mensagensErroCadastro = [
    erroNome,
    erroEmailCadastro,
    erroSenhaCadastro,
    erroConfirmaSenha
];

//Formato do email 
const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

//Mostra o erro no campo
function mostrarErro(campo, elementoErro, mensagem) {
    campo.classList.add("is-invalid");
    elementoErro.innerText = mensagem;
}

//Limpa os erros do formulario
function limparErros(campos, mensagensDeErro, mensagemSucesso) {
    campos.forEach(function (campo) {
        campo.classList.remove("is-invalid");
    });

    mensagensDeErro.forEach(function (elementoErro) {
        elementoErro.innerText = "";
    });

    mensagemSucesso.innerText = "";
}

//Valida email 
function validarEmail(campo, email) {
    if (email === "") {
        return "O e-mail é obrigatório.";
    }

    if (campo.validity.typeMismatch || !formatoEmail.test(email)) {
        return "Informe um endereço de e-mail válido.";
    }

    return "";
}

//Valida senha (8 caracteres, maiuscula, minuscula e especial)
function senhaAtendeRegras(senha) {
    const possuiMaiuscula = /[A-Z]/.test(senha);
    const possuiMinuscula = /[a-z]/.test(senha);
    const possuiEspecial = /[^\p{L}\p{N}\s]/u.test(senha);

    return senha.length >= 8 && possuiMaiuscula && possuiMinuscula && possuiEspecial;
}

//Login
formularioLogin.addEventListener("submit", function (event) {
    event.preventDefault();
    limparErros(camposLogin, mensagensErroLogin, mensagemLogin);

    const email = campoEmailLogin.value.trim().toLowerCase();
    const senha = campoSenhaLogin.value;

    let formValido = true;

    //Valida email
    const erroDoEmail = validarEmail(campoEmailLogin, email);

    if (erroDoEmail !== "") {
        mostrarErro(campoEmailLogin, erroEmailLogin, erroDoEmail);
        formValido = false;
    }

    //Valida senha
    if (senha === "") {
        mostrarErro(campoSenhaLogin, erroSenhaLogin, "A senha é obrigatória.");
        formValido = false;
    }

    if (!formValido) {
        return;
    }

    //Dados validos (ainda sem servidor)
    console.log({ email });
    mensagemLogin.innerText = "Dados válidos. A autenticação será conectada ao servidor em uma próxima etapa.";
});

//Cadastro
formularioCadastro.addEventListener("submit", function (event) {
    event.preventDefault();
    limparErros(camposCadastro, mensagensErroCadastro, mensagemCadastro);

    const nome = campoNome.value.trim();
    const email = campoEmailCadastro.value.trim().toLowerCase();
    const senha = campoSenhaCadastro.value;
    const confirmaSenha = campoConfirmaSenha.value;

    let formValido = true;

    //Valida nome
    if (nome === "") {
        mostrarErro(campoNome, erroNome, "O nome é obrigatório.");
        formValido = false;
    } else if (nome.length < 5) {
        mostrarErro(campoNome, erroNome, "O nome deve possuir pelo menos 5 caracteres.");
        formValido = false;
    } else if (nome.length > 100) {
        mostrarErro(campoNome, erroNome, "O nome deve possuir no máximo 100 caracteres.");
        formValido = false;
    } else if (nome.split(/\s+/).length < 2) {
        mostrarErro(campoNome, erroNome, "Informe nome e sobrenome.");
        formValido = false;
    }

    //Valida email
    const erroDoEmail = validarEmail(campoEmailCadastro, email);

    if (erroDoEmail !== "") {
        mostrarErro(campoEmailCadastro, erroEmailCadastro, erroDoEmail);
        formValido = false;
    }

    //Valida senha
    if (senha === "") {
        mostrarErro(campoSenhaCadastro, erroSenhaCadastro, "A senha é obrigatória.");
        formValido = false;
    } else if (!senhaAtendeRegras(senha)) {
        mostrarErro(campoSenhaCadastro, erroSenhaCadastro, "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula e um caractere especial.");
        formValido = false;
    }

    //Confirma senha
    if (confirmaSenha === "") {
        mostrarErro(campoConfirmaSenha, erroConfirmaSenha, "Confirme a sua senha.");
        formValido = false;
    } else if (confirmaSenha !== senha) {
        mostrarErro(campoConfirmaSenha, erroConfirmaSenha, "As senhas não são iguais.");
        formValido = false;
    }

    if (!formValido) {
        return;
    }

    //Dados validos 
    console.log({ nome, email });
    mensagemCadastro.innerText = "Dados válidos. O cadastro será conectado ao servidor em uma próxima etapa.";
});
