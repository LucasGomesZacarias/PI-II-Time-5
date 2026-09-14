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
