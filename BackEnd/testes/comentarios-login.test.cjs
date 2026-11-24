// Autor: Augusto Henrique Marçura. Testa a integração de comentários sem alterar o banco.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const express = require("express");
const base = process.env.BACKEND_COMPILADO;
if (!base) throw new Error("Informe BACKEND_COMPILADO com a pasta do backend compilado.");

const banco = require(path.join(base, "db.js"));
let insercao;
let servidor;
let endereco;

// Simula as respostas do Oracle para testar regras sem gravar comentários reais.
banco.getConn = async () => ({
    async execute(sql, binds) {
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
    require(path.join(base, "rotas/detalhesDemanda.js")).rotasDetalhesDemanda(app);
    servidor = await new Promise(resolve => {
        const instancia = app.listen(0, "127.0.0.1", () => resolve(instancia));
    });
    endereco = `http://127.0.0.1:${servidor.address().port}`;
});
after(() => servidor && servidor.close());

async function comentar(idUsuario, corpo) {
    const headers = { "Content-Type": "application/json" };
    if (idUsuario != null) headers["x-usuario-id"] = String(idUsuario);
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

test("usa o usuário do cabeçalho, não o ID informado no corpo", async () => {
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
        if (id) headers["x-usuario-id"] = String(id);
        return fetch(endereco + "/demandas/1/comentarios", { headers });
    }
    assert.equal((await listar(null)).status, 401);
    assert.equal((await listar(2)).status, 403);
    assert.equal((await listar(3)).status, 200);
    assert.equal((await listar(1)).status, 200);
});
