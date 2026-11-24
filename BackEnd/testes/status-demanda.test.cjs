// Autor: Augusto Henrique Marçura. Testes das permissões para mudança de status.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const express = require('express');
const session = require('express-session');
const banco = require(path.join(process.env.BACKEND_COMPILADO, 'db.js'));
let servidor, endereco, operacoes = [];
let falharHistorico = false;
const cookies = {};
const perfis = { 1: 'Administrador', 2: 'Membro da Equipe', 3: 'Membro da Equipe', 4: 'Líder de Projeto', 5: 'Líder de Projeto' };
banco.getConn = async () => ({
    async execute(sql, dados) {
        if (sql.includes('FROM Usuario WHERE')) return { rows: perfis[dados.id] ? [{ id: dados.id, perfil: perfis[dados.id] }] : [] };
        if (sql.includes('FOR UPDATE')) return { rows: dados.id === 1 ? [{ projetoId: 10, responsavelId: 2, status: 'Aberta' }] : [] };
        if (sql.includes('FROM participa')) return { rows: dados.usuarioId === 2 || dados.usuarioId === 3 || dados.usuarioId === 4 ? [{}] : [] };
        if (sql.includes('UPDATE demanda')) { operacoes.push('atualiza'); return {}; }
        if (sql.includes('INSERT INTO historico_demanda')) { if (falharHistorico) throw Error('Falha simulada'); operacoes.push('historico'); return {}; }
        throw Error('Consulta inesperada');
    },
    async commit() { operacoes.push('commit'); },
    async rollback() { operacoes.push('rollback'); },
    async close() {}
});
before(async () => {
    const app = express(); app.use(express.json());
    app.use(session({ secret: 'segredo-exclusivo-para-testes-locais', resave: false, saveUninitialized: false }));
    app.post('/login-teste/:id', (req, res) => {
        const id = Number(req.params.id);
        req.session.usuario = { id, perfil: perfis[id] };
        res.json({ ok: true });
    });
    require(path.join(process.env.BACKEND_COMPILADO, 'rotas/edicaoReal.js')).rotasEdicaoReal(app);
    servidor = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    endereco = 'http://127.0.0.1:' + servidor.address().port;
    for (const id of [1, 2, 3, 4, 5]) {
        const resposta = await fetch(endereco + '/login-teste/' + id, { method: 'POST' });
        cookies[id] = resposta.headers.get('set-cookie').split(';')[0];
    }
});
after(() => servidor.close());
async function mudar(usuario, status, extras = {}) {
    const headers = { 'content-type': 'application/json' };
    if (usuario) headers.cookie = cookies[usuario];
    return fetch(endereco + '/demandas/1/status', { method: 'PATCH', headers, body: JSON.stringify({ ...extras, status }) });
}
test('membro responsável avança status e gera histórico', async () => {
    operacoes = [];
    assert.equal((await mudar(2, 'Em andamento', { prioridade: 'Baixa' })).status, 200);
    assert.deepEqual(operacoes, ['atualiza', 'historico', 'commit']);
});
test('impede transições e usuários não permitidos', async () => {
    operacoes = [];
    assert.equal((await mudar(null, 'Em andamento')).status, 401);
    assert.equal((await mudar(2, 'Cancelada')).status, 403);
    assert.equal((await mudar(3, 'Em andamento')).status, 403);
    assert.equal((await mudar(5, 'Em andamento')).status, 403);
    assert.equal((await mudar(1, 'Concluída')).status, 403);
    assert.deepEqual(operacoes, []);
});
test('líder vinculado pode fazer transição válida', async () => {
    operacoes = [];
    assert.equal((await mudar(4, 'Em andamento')).status, 200);
    assert.deepEqual(operacoes, ['atualiza', 'historico', 'commit']);
});
test('falha no histórico desfaz a alteração', async () => {
    operacoes = []; falharHistorico = true; const erro = console.error; console.error = () => {};
    try { assert.equal((await mudar(2, 'Em andamento')).status, 500); }
    finally { falharHistorico = false; console.error = erro; }
    assert.deepEqual(operacoes, ['atualiza', 'rollback']);
});
