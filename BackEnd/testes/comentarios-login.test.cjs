// Autor: Augusto Henrique Marçura. Testa a integração de comentários sem alterar o banco.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const express = require("express");
const session = require("express-session");
const base = process.env.BACKEND_COMPILADO;
if (!base) throw new Error("Informe BACKEND_COMPILADO com a pasta do backend compilado.");

const banco = require(path.join(base, "db.js"));
let insercao;
let servidor;
let endereco;
const cookies = {};

// Simula as respostas do Oracle para testar regras sem gravar comentários reais.
banco.getConn = async () => ({
    async execute(sql, binds) {
        if (sql.includes("FROM demanda d")) {
            return { rows: binds.id === 1 ? [{ id: 1, projetoId: 10, projetoNome: "Projeto Nexo", responsavelNome: "Maria" }] : [] };
        }
        if (sql.includes("FROM Usuario WHERE id_usuario")) {
            if (binds.id === 1) return { rows: [{ id: 1, perfil: "Administrador" }] };
            if (binds.id === 2) return { rows: [{ id: 2, perfil: "Membro da Equipe" }] };
            if (binds.id === 3) return { rows: [{ id: 3, perfil: "Membro da Equipe" }] };
            return { rows: [] };
        }
        if (sql.includes("FROM demanda WHERE id_demanda")) {
            return { rows: binds.id === 1 ? [{ projetoId: 10 }] : [] };
        }
        if (sql.includes("FROM participa")) return { rows: binds.usuarioId === 3 ? [{}] : [] };
        if (sql.includes("FROM comentario c")) return { rows: [{ autor: "Pessoa", texto: "Olá", dataHora: "2026-11-23T12:00:00Z" }] };
        if (sql.includes("INSERT INTO comentario")) {
            insercao = binds;
            return { rowsAffected: 1 };
        }
        throw new Error("Consulta inesperada no teste");
    },
    async close() {}
});

before(async () => {
    delete process.env.DADOS_EM_MEMORIA;
    const app = express();
    app.use(express.json());
    app.use(session({ secret: "segredo-exclusivo-para-testes-locais", resave: false, saveUninitialized: false }));
    app.post("/login-teste/:id", (req, res) => {
        const id = Number(req.params.id);
        const perfis = { 1: "Administrador", 2: "Membro da Equipe", 3: "Membro da Equipe" };
        req.session.usuario = { id, perfil: perfis[id] };
        res.json({ ok: true });
    });
    require(path.join(base, "rotas/detalhesDemanda.js")).rotasDetalhesDemanda(app);
    servidor = await new Promise(resolve => {
        const instancia = app.listen(0, "127.0.0.1", () => resolve(instancia));
    });
    endereco = `http://127.0.0.1:${servidor.address().port}`;
    for (const id of [1, 2, 3]) {
        const resposta = await fetch(endereco + "/login-teste/" + id, { method: "POST" });
        cookies[id] = resposta.headers.get("set-cookie").split(";")[0];
    }
});
after(() => servidor && servidor.close());

async function comentar(idUsuario, corpo) {
    const headers = { "Content-Type": "application/json" };
    if (idUsuario != null) headers.cookie = cookies[idUsuario];
    const resposta = await fetch(endereco + "/demandas/1/comentarios", {
        method: "POST", headers, body: JSON.stringify(corpo)
    });
    return { status: resposta.status, dados: await resposta.json() };
}

test("exige identificador do login para comentar", async () => {
    assert.equal((await comentar(null, { texto: "Olá", usuarioId: 1 })).status, 401);
});

test("impede membro sem vínculo com o projeto", async () => {
    assert.equal((await comentar(2, { texto: "Olá" })).status, 403);
});

test("usa o usuário da sessão, não o ID informado no corpo", async () => {
    insercao = null;
    assert.equal((await comentar(1, { texto: "Olá", usuarioId: 2 })).status, 201);
    assert.equal(insercao.usuarioId, 1);
});

test("recusa texto vazio sem gravar", async () => {
    insercao = null;
    assert.equal((await comentar(1, { texto: "   " })).status, 400);
    assert.equal(insercao, null);
});

test("leitura exige usuário e vínculo com o projeto", async () => {
    async function listar(id) {
        const headers = {};
        if (id) headers.cookie = cookies[id];
        return fetch(endereco + "/demandas/1/comentarios", { headers });
    }
    assert.equal((await listar(null)).status, 401);
    assert.equal((await listar(2)).status, 403);
    assert.equal((await listar(3)).status, 200);
    assert.equal((await listar(1)).status, 200);
});

test("ignora identificação forjada no cabeçalho sem uma sessão", async () => {
    const resposta = await fetch(endereco + "/demandas/1/comentarios", { headers: { "x-usuario-id": "1" } });
    assert.equal(resposta.status, 401);
});

test("detalhes exigem login e vínculo com o projeto", async () => {
    async function detalhes(usuario, id = 1) {
        const headers = {};
        if (usuario) headers.cookie = cookies[usuario];
        return fetch(endereco + "/demandas/" + id, { headers });
    }
    assert.equal((await detalhes(null)).status, 401);
    assert.equal((await detalhes(2)).status, 403);
    assert.equal((await detalhes(3)).status, 200);
    const resposta = await detalhes(1);
    assert.equal(resposta.status, 200);
    const dados = await resposta.json();
    assert.equal(dados.projetoNome, "Projeto Nexo");
    assert.equal(dados.responsavelNome, "Maria");
    assert.equal((await detalhes(1, 999)).status, 404);
});
