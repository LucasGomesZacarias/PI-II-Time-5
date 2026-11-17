// Autor: Augusto Henrique Marçura. Testa o fluxo da tela com respostas simuladas.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const codigo = fs.readFileSync(path.join(__dirname, "../../detalhes_demanda/apiReal.js"), "utf8");

async function abrirTela(usuario, respostaPost = { status: 201, dados: { mensagem: "Criado" } }) {
    const elementos = {};
    const envios = [];
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
        document: { querySelector: el, createElement() { return { textContent: "", append() {} }; } },
        fetch: async (url, opcoes) => {
            if (opcoes && opcoes.method === "POST") {
                envios.push(opcoes);
                return { ok: respostaPost.status < 400, json: async () => respostaPost.dados };
            }
            return { ok: true, json: async () => url.endsWith("/comentarios") ? [] : { id: 1, titulo: "Demanda" } };
        }
    };
    vm.runInNewContext(codigo, contexto);
    await new Promise(resolve => setImmediate(resolve));
    return { el, envios };
}

test("sem login, impede a escrita e orienta o usuário", async () => {
    const { el } = await abrirTela(null);
    assert.equal(el("#texto-comentario").disabled, true);
    assert.match(el("#erro-comentario").textContent, /login/i);
});

test("com login, envia o texto e identifica o usuário pelo fluxo da equipe", async () => {
    const { el, envios } = await abrirTela({ id: 7 });
    assert.equal(el("#texto-comentario").disabled, false);
    el("#texto-comentario").value = " Meu comentário ";
    await el("#formulario-comentario").enviar({ preventDefault() {} });
    assert.equal(envios[0].headers["x-usuario-id"], "7");
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
