// Autor: Gabriel Grigoletto Ribas.
// Validação e busca das demandas críticas exibidas no Dashboard.
// Integração com a API (GET /dashboard): Luiz Felipe da Conceição.

// Localiza o formulário, seus campos e a mensagem de erro da API.
const formularioBusca = document.querySelector("#formBuscaDemanda");
const campoBusca = document.querySelector("#buscaDemanda");
const botaoLimpar = document.querySelector("#limparBusca");
const mensagemBusca = document.querySelector("#mensagemBusca");
const mensagemDashboard = document.querySelector("#mensagemDashboard");

// As linhas da tabela são criadas depois que a API responde, por isso são buscadas a cada uso.
function linhasDemandas() {
  return document.querySelectorAll("#tabelaCriticas tr");
}

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

  linhasDemandas().forEach(function (linha) {
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

  linhasDemandas().forEach(function (linha) {
    linha.classList.remove("linha-oculta");
  });
});

// Códigos, títulos e nomes vêm do banco: escapa antes de colocar no HTML.
function escaparHtml(texto) {
  const trocas = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

  return String(texto).replace(/[&<>"']/g, function (caractere) {
    return trocas[caractere];
  });
}

// Transforma AAAA-MM-DD em DD/MM/AAAA (ou DD/MM quando o ano não é necessário).
function formatarData(data, comAno) {
  if (!data) {
    return "Sem prazo";
  }

  const partes = data.split("-");

  if (comAno) {
    return partes[2] + "/" + partes[1] + "/" + partes[0];
  }

  return partes[2] + "/" + partes[1];
}

// Mesmo código usado na listagem de demandas.
function criarCodigo(id) {
  return "DEM-" + id;
}

// Preenche os números dos cards, das prioridades (com as barras) e dos tipos.
function mostrarContagens(dados) {
  document.querySelector("#totalDemandas").innerText = dados.totalDemandas;

  document.querySelectorAll("[data-status]").forEach(function (elemento) {
    elemento.innerText = dados.porStatus[elemento.dataset.status];
  });

  document.querySelectorAll("[data-tipo]").forEach(function (linha) {
    linha.querySelector("strong").innerText = dados.porTipo[linha.dataset.tipo];
  });

  // As barras são proporcionais à prioridade que tem mais demandas.
  const maior = Math.max(...Object.values(dados.porPrioridade));

  document.querySelectorAll("[data-prioridade]").forEach(function (linha) {
    const quantidade = dados.porPrioridade[linha.dataset.prioridade];
    const largura = maior > 0 ? (quantidade / maior) * 100 : 0;

    linha.querySelector("strong").innerText = quantidade;
    linha.querySelector(".preenchimento").style.width = largura + "%";
  });
}

// Monta a tabela das demandas críticas em aberto.
function mostrarCriticas(demandas) {
  const corpo = document.querySelector("#tabelaCriticas");

  corpo.innerHTML = "";

  if (demandas.length === 0) {
    corpo.innerHTML = `
      <tr>
        <td colspan="4" class="text-center">Nenhuma demanda crítica em aberto.</td>
      </tr>
    `;
    return;
  }

  demandas.forEach(function (demanda) {
    corpo.innerHTML += `
      <tr>
        <td><span class="tag critica-tag">Crítica</span> ${criarCodigo(demanda.id)} - ${escaparHtml(demanda.titulo)}</td>
        <td>${escaparHtml(demanda.projeto)}</td>
        <td>${demanda.responsavel ? escaparHtml(demanda.responsavel) : "Sem responsável"}</td>
        <td>${formatarData(demanda.prazo, true)}</td>
      </tr>
    `;
  });
}

// Monta a lista das demandas com prazo nos próximos 7 dias.
function mostrarPrazos(demandas) {
  const lista = document.querySelector("#listaPrazos");

  lista.innerHTML = "";

  if (demandas.length === 0) {
    lista.innerHTML = `
      <li>
        <div><span>Nenhuma demanda com prazo nos próximos 7 dias.</span></div>
      </li>
    `;
    return;
  }

  demandas.forEach(function (demanda) {
    lista.innerHTML += `
      <li>
        <div>
          <strong>${criarCodigo(demanda.id)} - ${escaparHtml(demanda.titulo)}</strong>
          <span>${escaparHtml(demanda.tipo)} - ${escaparHtml(demanda.prioridade)} - ${escaparHtml(demanda.status)}</span>
        </div>
        <span class="data-prazo">${formatarData(demanda.prazo, false)}</span>
      </li>
    `;
  });
}

// Busca os dados na API e preenche a tela. Se falhar, mostra o erro para o usuário.
async function carregarDashboard() {
  try {
    const dados = await buscarDashboardApi();

    mensagemDashboard.classList.add("d-none");

    mostrarContagens(dados);
    mostrarCriticas(dados.demandasCriticasEmAberto);
    mostrarPrazos(dados.demandasProximasDoPrazo);
  } catch (erro) {
    mensagemDashboard.innerText = erro.message;
    mensagemDashboard.classList.remove("d-none");
  }
}

window.addEventListener("DOMContentLoaded", carregarDashboard);
