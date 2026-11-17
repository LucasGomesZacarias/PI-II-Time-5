// Autor: Augusto Henrique Marçura
// Integração da tela de detalhes com a API do projeto

const id = new URLSearchParams(window.location.search).get("id");
function elemento(seletor) {
    return document.querySelector(seletor);
}
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

// O login da equipe guarda os dados do usuário nesta aba do navegador.
function usuarioDaSessao() {
    try {
        const usuario = JSON.parse(sessionStorage.getItem("usuarioLogado") || "null");
        if (usuario && Number.isSafeInteger(usuario.id) && usuario.id > 0) {
            return usuario;
        }
        return null;
    } catch {
        return null;
    }
}

// Busca os dados e permite enviar comentários pelo fluxo atual de login da equipe.
async function iniciar() {
    const aviso = elemento("#aviso-demanda");
    const formularioComentario = elemento("#formulario-comentario");
    const botaoComentario = formularioComentario.querySelector("button");
    const campoComentario = elemento("#texto-comentario");
    const mensagemComentario = elemento("#erro-comentario");
    const usuario = usuarioDaSessao();
    botaoComentario.disabled = true;
    campoComentario.disabled = true;
    elemento("#botao-editar").disabled = true;
    if (usuario) {
        mensagemComentario.textContent = "Carregando comentários...";
    } else {
        mensagemComentario.textContent = "Faça login para comentar.";
    }

    formularioComentario.addEventListener("submit", async function (evento) {
        evento.preventDefault();
        if (!usuario) return;
        const texto = campoComentario.value.trim();
        if (!texto) {
            mensagemComentario.textContent = "Escreva um comentário antes de enviar.";
            campoComentario.focus();
            return;
        }
        botaoComentario.disabled = true;
        try {
            const resposta = await fetch(`${enderecoApi}/demandas/${encodeURIComponent(id)}/comentarios`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-usuario-id": String(usuario.id) },
                body: JSON.stringify({ texto })
            });
            const dados = await resposta.json();
            if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível enviar o comentário.");
            campoComentario.value = "";
            try {
                const atualizados = await consultarApi(`/demandas/${encodeURIComponent(id)}/comentarios`);
                mostrarComentario(atualizados);
                mensagemComentario.textContent = "Comentário enviado.";
            } catch {
                mensagemComentario.textContent = "Comentário enviado, mas não foi possível atualizar a lista. Atualize a página.";
            }
        } catch (erro) {
            mensagemComentario.textContent = erro instanceof Error ? erro.message : "Não foi possível enviar o comentário.";
        } finally {
            botaoComentario.disabled = false;
        }
    });

    if (!id || !/^\d+$/.test(id) || Number(id) <= 0) {
        aviso.textContent = "Informe uma demanda válida na listagem.";
        aviso.hidden = false;
        return;
    }

    try {
        const caminho = `/demandas/${encodeURIComponent(id)}`;
        const demanda = await consultarApi(caminho);
        const comentarios = await consultarApi(`${caminho}/comentarios`);
        function data(valor) {
            if (!valor) return "Não definido";
            return new Date(valor).toLocaleDateString("pt-BR");
        }
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
        if (usuario) {
            campoComentario.disabled = false;
            botaoComentario.disabled = false;
            mensagemComentario.textContent = "";
        }
        elemento("#detalhes").hidden = false;
        elemento("#secao-comentarios").hidden = false;
        if (usuario) {
            const botaoEditar = elemento("#botao-editar");
            if (usuario.perfil === "Administrador" || usuario.perfil === "Líder de Projeto") {
                botaoEditar.disabled = false;
                botaoEditar.addEventListener("click", function () {
                    window.location.href = "/EdicaoDemanda/edicaoDemanda.html?id=" + encodeURIComponent(id);
                });
            }
            elemento("#secao-historico").hidden = false;
            try {
                const resposta = await fetch(enderecoApi + caminho + "/historico", {
                    headers: { "x-usuario-id": String(usuario.id) }
                });
                const historico = await resposta.json();
                if (!resposta.ok) throw new Error(historico.mensagem || "Não foi possível carregar o histórico.");
                mostrarHistorico(historico);
            } catch (erro) {
                elemento("#lista-historico").textContent = erro instanceof Error ? erro.message : "Não foi possível carregar o histórico.";
            }
        }
    } catch (erro) {
        aviso.textContent = erro instanceof Error ? erro.message : "Não foi possível carregar a demanda.";
        aviso.hidden = false;
    }
}

iniciar();
