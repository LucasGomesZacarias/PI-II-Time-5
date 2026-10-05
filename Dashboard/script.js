// Autor: Gabriel Grigoletto Ribas.
// Validação e busca das demandas críticas exibidas no Dashboard.

// Localiza o formulário, seus campos e as linhas da tabela.
const formularioBusca = document.querySelector("#formBuscaDemanda");
const campoBusca = document.querySelector("#buscaDemanda");
const botaoLimpar = document.querySelector("#limparBusca");
const mensagemBusca = document.querySelector("#mensagemBusca");
const linhasDemandas = document.querySelectorAll("#tabelaDemandas tbody tr");

// Impede o envio do formulário e valida o texto digitado.
formularioBusca.addEventListener("submit", function (evento) {
  evento.preventDefault();

  const termo = campoBusca.value.trim().toLowerCase();
  mensagemBusca.classList.add("erro-busca");

  if (termo === "") {
    mensagemBusca.innerText = "Digite o código ou o título de uma demanda.";
    return;
  }

  if (termo.length < 3) {
    mensagemBusca.innerText = "Digite pelo menos 3 caracteres para buscar.";
    return;
  }

  if (termo.length > 80) {
    mensagemBusca.innerText = "A busca deve ter no máximo 80 caracteres.";
    return;
  }

  // Procura o termo no código e no título de cada linha, sem alterar os dados.
  let quantidadeEncontrada = 0;

  linhasDemandas.forEach(function (linha) {
    const codigoETitulo = linha.querySelector("td").innerText.toLowerCase();

    if (codigoETitulo.includes(termo)) {
      linha.classList.remove("linha-oculta");
      quantidadeEncontrada++;
    } else {
      linha.classList.add("linha-oculta");
    }
  });

  // Apresenta uma mensagem clara para zero, um ou vários resultados.
  if (quantidadeEncontrada === 0) {
    mensagemBusca.innerText = "Nenhuma demanda crítica encontrada.";
  } else if (quantidadeEncontrada === 1) {
    mensagemBusca.classList.remove("erro-busca");
    mensagemBusca.innerText = "1 demanda crítica encontrada.";
  } else {
    mensagemBusca.classList.remove("erro-busca");
    mensagemBusca.innerText = quantidadeEncontrada + " demandas críticas encontradas.";
  }
});

// Limpa o campo e mostra novamente todas as demandas críticas da tabela.
botaoLimpar.addEventListener("click", function () {
  campoBusca.value = "";
  mensagemBusca.innerText = "";
  mensagemBusca.classList.remove("erro-busca");

  linhasDemandas.forEach(function (linha) {
    linha.classList.remove("linha-oculta");
  });
});
