// Autor: Augusto Henrique Marçura.
// Seleciona a demanda da URL e mantém a tela sincronizada com os dados locais.
import { buscarDemandaExemplo, salvarDemandaExemplo } from "./demandasExemplo.js";

const id = new URLSearchParams(window.location.search).get("id");
let demanda = /^\d+$/.test(id ?? "") ? buscarDemandaExemplo(id) : null;

const elemento = seletor => document.querySelector(seletor);
const formulario = elemento("#formulario-edicao");
const avisoEdicao = elemento("#aviso-edicao");

function mostrarAviso(mensagem) {
    avisoEdicao.textContent = mensagem;
    avisoEdicao.hidden = !mensagem;
}

function dataParaCampo(data) {
    if (!data) return "";
    const [dia, mes, ano] = data.split("/");
    return `${ano}-${mes}-${dia}`;
}

function dataParaTela(data) {
    if (!data) return "Não definido";
    const [ano, mes, dia] = data.split("-");
    return `${dia}/${mes}/${ano}`;
}

// Cria os comentários e o histórico como texto, sem interpretar HTML dos dados.
function preencherRegistros(container, registros, classe, campos) {
    container.replaceChildren();
    if (!registros?.length) {
        const vazio = document.createElement("p");
        vazio.textContent = "Nenhum registro até o momento.";
        container.append(vazio);
        return;
    }

    for (const registro of registros) {
        const bloco = document.createElement("div");
        bloco.className = classe;
        for (const [chave, classeCampo] of campos) {
            const paragrafo = document.createElement("p");
            paragrafo.className = classeCampo;
            paragrafo.textContent = registro[chave] ?? "";
            bloco.append(paragrafo);
        }
        container.append(bloco);
    }
}

function renderizar() {
    const campos = {
        "#codigo-demanda": demanda.codigo,
        "#titulo-demanda": demanda.titulo,
        "#status-demanda": demanda.status,
        "#prioridade-demanda": demanda.prioridade,
        "#tipo-demanda": demanda.tipo,
        "#descricao-demanda": demanda.descricao,
        "#projeto-demanda": demanda.projeto,
        "#responsavel-demanda": demanda.responsavel || "Não definido",
        "#criacao-demanda": demanda.dataCriacao,
        "#atualizacao-demanda": demanda.dataAtualizacao,
        "#prazo-demanda": demanda.prazo || "Não definido"
    };
    for (const [seletor, valor] of Object.entries(campos)) {
        elemento(seletor).textContent = valor;
    }

    preencherRegistros(elemento("#lista-comentarios"), demanda.comentarios, "comentario", [
        ["autor", "autor"], ["texto", ""], ["data", "data"]
    ]);
    preencherRegistros(elemento("#lista-historico"), demanda.historico, "alteracao", [
        ["data", "data"], ["texto", ""]
    ]);
}

if (!demanda) {
    const aviso = elemento("#aviso-demanda");
    aviso.textContent = "Demanda não encontrada. Volte à listagem e escolha uma demanda válida.";
    aviso.hidden = false;
} else {
    for (const seletor of ["#detalhes", "#secao-comentarios", "#secao-historico"]) {
        elemento(seletor).hidden = false;
    }
    renderizar();

    elemento("#botao-editar").addEventListener("click", () => {
        elemento("#titulo").value = demanda.titulo;
        elemento("#descricao").value = demanda.descricao;
        elemento("#responsavel").value = demanda.responsavel;
        elemento("#prazo").value = dataParaCampo(demanda.prazo);
        mostrarAviso("");
        formulario.hidden = false;
        elemento("#titulo").focus();
    });

    elemento("#botao-cancelar").addEventListener("click", () => {
        formulario.hidden = true;
        mostrarAviso("");
        elemento("#botao-editar").focus();
    });

    formulario.addEventListener("submit", evento => {
        evento.preventDefault();
        const titulo = elemento("#titulo").value.trim();
        const descricao = elemento("#descricao").value.trim();
        if (!titulo || !descricao) {
            mostrarAviso("Preencha o título e a descrição.");
            return;
        }

        const agora = new Date();
        const alteracoes = {
            titulo,
            descricao,
            responsavel: elemento("#responsavel").value.trim(),
            prazo: dataParaTela(elemento("#prazo").value)
        };
        if (!elemento("#prazo").value) alteracoes.prazo = "";
        const camposAlterados = Object.entries(alteracoes)
            .filter(([campo, valor]) => demanda[campo] !== valor)
            .map(([campo]) => ({ titulo: "título", descricao: "descrição", responsavel: "responsável", prazo: "prazo" })[campo]);
        if (camposAlterados.length === 0) {
            formulario.hidden = true;
            elemento("#botao-editar").focus();
            return;
        }

        const data = agora.toLocaleDateString("pt-BR");
        const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        const atualizada = {
            ...demanda,
            ...alteracoes,
            dataAtualizacao: data,
            historico: [
                ...(demanda.historico ?? []),
                { data: `${data} - ${hora}`, texto: `Campos alterados na demonstração local: ${camposAlterados.join(", ")}.` }
            ]
        };
        if (!salvarDemandaExemplo(atualizada)) {
            mostrarAviso("Não foi possível salvar neste navegador. Verifique o armazenamento local.");
            return;
        }

        demanda = atualizada;
        renderizar();
        formulario.hidden = true;
        elemento("#botao-editar").focus();
    });

}
