// Autor: Augusto Henrique Marçura. Testa o fluxo da tela com respostas simuladas.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const codigo = fs.readFileSync(path.join(__dirname, "../../detalhes_demanda/apiReal.js"), "utf8");

async function abrirTela(usuario, respostaPost = { status: 201, dados: { mensagem: "Criado" } }, respostaLista = null) {
    const elementos = {};
    const envios = [];
    const consultas = [];
    function el(seletor) {
        if (!elementos[seletor]) elementos[seletor] = {
            textContent: "", value: "", hidden: true, disabled: false, children: [],
            addEventListener(_evento, funcao) { this.enviar = funcao; },
            querySelector() { return el("#botao-comentario"); },
            append(...itens) { this.children.push(...itens); }, focus() {}
        };
        return elementos[seletor];
    }
    const contexto = {
        URLSearchParams, Number, Date, Error, String, JSON, encodeURIComponent,
        window: { location: { search: "?id=1" } },
        sessionStorage: { getItem() { return usuario ? JSON.stringify(usuario) : null; } },
        document: { querySelector: el, createElement() { return { textContent: "", children: [], append(...itens) { this.children.push(...itens); } }; } },
        fetch: async (url, opcoes) => {
            consultas.push({ url, opcoes });
            if (url.endsWith('/sessao')) {
                return { ok: !!usuario, json: async () => usuario || { mensagem: 'Faça login' } };
            }
            if (opcoes && opcoes.method === "POST") {
                envios.push(opcoes);
                return { ok: respostaPost.status < 400, json: async () => respostaPost.dados };
            }
            if (url.endsWith("/comentarios") && respostaLista) {
                return { ok: respostaLista.status < 400, json: async () => respostaLista.dados };
            }
            return { ok: true, json: async () => url.endsWith("/comentarios") ? [] : { id: 1, titulo: "Demanda", projetoNome: "Projeto Nexo", responsavelNome: "Maria" } };
        }
    };
    vm.runInNewContext(codigo, contexto);
    await new Promise(resolve => setImmediate(resolve));
    return { el, envios, consultas };
}

test("sem login, impede a escrita e orienta o usuário", async () => {
    const { el } = await abrirTela(null);
    assert.equal(el("#texto-comentario").disabled, true);
    assert.match(el("#erro-comentario").textContent, /login/i);
});

test("mostra o erro de acesso e bloqueia o envio quando a leitura é negada", async () => {
    const { el } = await abrirTela({ id: 7 }, undefined, { status: 403, dados: { mensagem: "Você não participa deste projeto." } });
    assert.equal(el("#erro-comentario").textContent, "Você não participa deste projeto.");
    assert.equal(el("#texto-comentario").disabled, true);
    assert.equal(el("#botao-comentario").disabled, true);
});

test("mostra data e horário de cada comentário", async () => {
    const dataHora = "2026-11-23T12:34:00Z";
    const { el } = await abrirTela({ id: 7 }, undefined, { status: 200, dados: [{ autor: "Pessoa", texto: "Olá", dataHora }] });
    const bloco = el("#lista-comentarios").children[0];
    assert.equal(bloco.children[2].textContent, new Date(dataHora).toLocaleString("pt-BR"));
});

test("com login, envia o texto e identifica o usuário pelo fluxo da equipe", async () => {
    const { el, envios, consultas } = await abrirTela({ id: 7 });
    assert.equal(el("#texto-comentario").disabled, false);
    assert.equal(el("#projeto-demanda").textContent, "Projeto Nexo");
    assert.equal(el("#responsavel-demanda").textContent, "Maria");
    el("#texto-comentario").value = " Meu comentário ";
    await el("#formulario-comentario").enviar({ preventDefault() {} });
    assert.equal(envios[0].headers["x-usuario-id"], undefined);
    const consultasComentarios = consultas.filter(item => item.url.endsWith('/comentarios') && (!item.opcoes || item.opcoes.method !== 'POST'));
    assert.ok(consultasComentarios.length >= 2);
    assert.equal(consultasComentarios[0].opcoes, undefined);
    assert.equal(consultasComentarios[1].opcoes, undefined);
    assert.deepEqual(JSON.parse(envios[0].body), { texto: "Meu comentário" });
    assert.equal(el("#texto-comentario").value, "");
});

test("exibe o erro da API e mantém o texto", async () => {
    const { el } = await abrirTela({ id: 7 }, { status: 403, dados: { mensagem: "Sem acesso ao projeto" } });
    el("#texto-comentario").value = "Comentário";
    await el("#formulario-comentario").enviar({ preventDefault() {} });
    assert.equal(el("#erro-comentario").textContent, "Sem acesso ao projeto");
    assert.equal(el("#texto-comentario").value, "Comentário");
});
