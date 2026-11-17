// Autor: Augusto Henrique Marçura
// Integração da tela de detalhes com a API do projeto

const id = new URLSearchParams(window.location.search).get("id");
const elemento = seletor => document.querySelector(seletor);
const enderecoApi = "http://localhost:3000";

// Consulta a API e mostra uma mensagem se ocorrer algum erro
async function consultarApi(caminho){
    const resposta = await fetch(enderecoApi + caminho);
    const dados = await resposta.json();

    if(!resposta.ok){
        throw new Error(dados.mensagem || "Erro ao consultar a API");
    }
    return dados;
}

// Mostra na tela os comentários recebidos da API
function mostrarComentario(comentarios){
    const lista = elemento("#lista-comentarios");
    lista.textContent = "";

    if(comentarios.length === 0){
        lista.textContent = "Nenhum comentário até o momento";
        return;
    }

    for(const comentario of comentarios){
        const bloco = document.createElement("div");
        bloco.className = "comentario";

        const autor = document.createElement("p");
        autor.className = "autor";
        autor.textContent = comentario.autor;

        const texto = document.createElement("p");
        texto.textContent = comentario.texto;

        const data = document.createElement("p");
        data.className = "data";
        data.textContent = new Date(comentario.dataHora).toLocaleDateString("pt-BR");

        bloco.append(autor, texto, data);
        lista.append(bloco);
    }
}

// Mostra na tela as alterações recebidas da API
function mostrarHistorico(historico){
    const lista = elemento("#lista-historico");
    lista.textContent = "";

    if(historico.length === 0){
        lista.textContent = "Nenhuma alteração registrada";
        return;
    }

    for(const alteracao of historico){
        const bloco = document.createElement("div");
        bloco.className = "alteracao";

        const descricao = document.createElement("p");
        descricao.textContent = alteracao.autor + " alterou " + alteracao.campo + " de " + (alteracao.valorAnterior || "não definido") + " para " + (alteracao.valorNovo || "não definido") + ".";

        const data = document.createElement("p");
        data.className = "data";
        data.textContent = new Date(alteracao.dataAlteracao).toLocaleString("pt-BR");

        bloco.append(descricao, data);
        lista.append(bloco);
    }
}

// Busca dados reais; a edição e o envio dependem da integração com o login.
async function iniciar() {
    const aviso = elemento("#aviso-demanda");
    const formularioComentario = elemento("#formulario-comentario");
    formularioComentario.addEventListener("submit", evento => evento.preventDefault());
    formularioComentario.querySelector("button").disabled = true;
    elemento("#texto-comentario").disabled = true;
    elemento("#botao-editar").disabled = true;
    elemento("#erro-comentario").textContent = "O envio de comentários depende da integração com o login.";

    if (!/^\d+$/.test(id ?? "") || Number(id) <= 0) {
        aviso.textContent = "Informe uma demanda válida na listagem.";
        aviso.hidden = false;
        return;
    }

    try {
        const caminho = `/demandas/${encodeURIComponent(id)}`;
        const demanda = await consultarApi(caminho);
        const comentarios = await consultarApi(`${caminho}/comentarios`);
        const data = valor => valor ? new Date(valor).toLocaleDateString("pt-BR") : "Não definido";
        elemento("#codigo-demanda").textContent = `DEM-${demanda.id}`;
        elemento("#titulo-demanda").textContent = demanda.titulo;
        elemento("#status-demanda").textContent = demanda.status;
        elemento("#prioridade-demanda").textContent = demanda.prioridade;
        elemento("#tipo-demanda").textContent = demanda.tipo;
        elemento("#descricao-demanda").textContent = demanda.descricao;
        elemento("#projeto-demanda").textContent = demanda.projetoId != null ? `Projeto ${demanda.projetoId}` : "Não definido";
        elemento("#responsavel-demanda").textContent = demanda.responsavelId != null ? `Usuário ${demanda.responsavelId}` : "Não definido";
        elemento("#criacao-demanda").textContent = data(demanda.dataCriacao);
        elemento("#atualizacao-demanda").textContent = data(demanda.dataAtualizacao);
        elemento("#prazo-demanda").textContent = data(demanda.prazo);
        mostrarComentario(comentarios);
        elemento("#detalhes").hidden = false;
        elemento("#secao-comentarios").hidden = false;
        aviso.textContent = "Consulta ao banco. A edição ainda está em integração.";
        aviso.hidden = false;
    } catch (erro) {
        aviso.textContent = erro instanceof Error ? erro.message : "Não foi possível carregar a demanda.";
        aviso.hidden = false;
    }
}

iniciar();
