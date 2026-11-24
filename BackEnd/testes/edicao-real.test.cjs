// Autor: Augusto Henrique Marçura. Exercita as rotas sem gravar no Oracle.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const express = require('express');
const session = require('express-session');
const base = process.env.BACKEND_COMPILADO;
const banco = require(path.join(base, 'db.js'));
let gravacoes = [], falharHistorico = false, servidor, endereco;
const cookies = {};
const atual = { titulo: 'Demanda original', descricao: 'Descrição da demanda', tipo: 'Tarefa', prioridade: 'Alta', projetoId: 1, responsavelId: 2, prazo: null, status: 'Aberta' };
banco.getConn = async () => ({
    async execute(sql, valores) {
        if (sql.includes('FROM Usuario WHERE')) return { rows: valores.id === 1 ? [{ id: 1, perfil: 'Administrador' }] : valores.id === 2 ? [{ id: 2, perfil: 'Membro da Equipe' }] : [] };
        if (sql.includes('FOR UPDATE')) return { rows: valores.id === 1 ? [atual] : [] };
        if (sql.includes('SELECT idprojeto AS')) return { rows: [{ projetoId: 1 }] };
        if (sql.includes('FROM participa')) return { rows: [] };
        if (sql.includes('FROM projeto WHERE') || sql.includes('FROM usuario WHERE')) return { rows: [{}] };
        if (sql.includes('FROM historico_demanda')) return { rows: [{ campo: 'titulo', autor: 'Ana' }] };
        if (sql.includes('UPDATE demanda')) { gravacoes.push('atualizacao'); return {}; }
        if (sql.includes('INSERT INTO historico_demanda')) { if (falharHistorico) throw Error('Falha simulada'); gravacoes.push('historico'); return {}; }
        throw Error('Consulta inesperada');
    },
    async commit() { gravacoes.push('commit'); },
    async rollback() { gravacoes.push('rollback'); },
    async close() {}
});
before(async () => {
    const app = express(); app.use(express.json());
    app.use(session({ secret: 'segredo-exclusivo-para-testes-locais', resave: false, saveUninitialized: false }));
    app.post('/login-teste/:id', (req, res) => {
        const id = Number(req.params.id);
        req.session.usuario = { id, perfil: id === 1 ? 'Administrador' : 'Membro da Equipe' };
        res.json({ ok: true });
    });
    require(path.join(base, 'rotas/edicaoReal.js')).rotasEdicaoReal(app);
    servidor = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    endereco = 'http://127.0.0.1:' + servidor.address().port;
    for (const id of [1, 2]) {
        const resposta = await fetch(endereco + '/login-teste/' + id, { method: 'POST' });
        cookies[id] = resposta.headers.get('set-cookie').split(';')[0];
    }
});
after(() => servidor.close());
async function editar(idUsuario) {
    const headers = { 'Content-Type': 'application/json' };
    if (idUsuario) headers.cookie = cookies[idUsuario];
    return fetch(endereco + '/demandas/1', { method: 'PUT', headers, body: JSON.stringify({ ...atual, titulo: 'Novo título' }) });
}
test('edição exige identificação e perfil permitido', async () => {
    gravacoes = []; assert.equal((await editar()).status, 401); assert.equal((await editar(2)).status, 403); assert.deepEqual(gravacoes, []);
});
test('salva alteração e histórico na mesma transação', async () => {
    gravacoes = []; assert.equal((await editar(1)).status, 200); assert.deepEqual(gravacoes, ['atualizacao', 'historico', 'commit']);
});
test('desfaz alteração se o histórico falhar', async () => {
    gravacoes = []; falharHistorico = true; const original = console.error; console.error = () => {};
    try { assert.equal((await editar(1)).status, 500); } finally { falharHistorico = false; console.error = original; }
    assert.deepEqual(gravacoes, ['atualizacao', 'rollback']);
});
test('histórico exige identificação e retorna registros ao administrador', async () => {
    assert.equal((await fetch(endereco + '/demandas/1/historico')).status, 401);
    const resposta = await fetch(endereco + '/demandas/1/historico', { headers: { cookie: cookies[1] } });
    assert.equal(resposta.status, 200); assert.equal((await resposta.json())[0].campo, 'titulo');
});
