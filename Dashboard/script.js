// Autor: Gabriel Grigoletto Ribas.
// Montagem do Dashboard: colunas por status, prioridades e tipos.
// Integração com a API (GET /dashboard): Luiz Felipe da Conceição.

const mensagemDashboard = document.querySelector("#mensagemDashboard");

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

// Preenche o total, as prioridades (com as barras) e os tipos.
function mostrarContagens(dados) {
  document.querySelector("#totalDemandas").innerText = dados.totalDemandas;

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

// Preenche cada coluna: a bolinha vermelha com as críticas e as demandas de prazo mais próximo.
function mostrarColunas(colunas) {
  document.querySelectorAll("[data-coluna]").forEach(function (elemento) {
    const dadosColuna = colunas[elemento.dataset.coluna];
    const bolinha = elemento.querySelector("[data-criticas]");
    const lista = elemento.querySelector("[data-lista]");

    // a bolinha só aparece se a coluna tiver demandas críticas
    if (dadosColuna.criticas > 0) {
      bolinha.innerText = dadosColuna.criticas;
      bolinha.classList.remove("d-none");
    } else {
      bolinha.classList.add("d-none");
    }

    lista.innerHTML = "";

    if (dadosColuna.demandas.length === 0) {
      lista.innerHTML = `<li class="coluna-vazia">Nenhuma demanda</li>`;
      return;
    }

    dadosColuna.demandas.forEach(function (demanda) {
      // a demanda crítica ganha uma bolinha vermelha ao lado do título
      const pontoCritico = demanda.prioridade === "Crítica" ? `<span class="ponto critica"></span>` : "";

      lista.innerHTML += `
        <li>
          <strong>${pontoCritico}${criarCodigo(demanda.id)} - ${escaparHtml(demanda.titulo)}</strong>
          <span>${escaparHtml(demanda.tipo)} - ${escaparHtml(demanda.prioridade)}</span>
          <span class="data-prazo">${formatarData(demanda.prazo, false)}</span>
        </li>
      `;
    });
  });
}

// Busca os dados na API e preenche a tela. Se falhar, mostra o erro para o usuário.
async function carregarDashboard() {
  try {
    const dados = await buscarDashboardApi();

    mensagemDashboard.classList.add("d-none");

    mostrarContagens(dados);
    mostrarColunas(dados.colunas);
  } catch (erro) {
    mensagemDashboard.innerText = erro.message;
    mensagemDashboard.classList.remove("d-none");
  }
}

window.addEventListener("DOMContentLoaded", carregarDashboard);
