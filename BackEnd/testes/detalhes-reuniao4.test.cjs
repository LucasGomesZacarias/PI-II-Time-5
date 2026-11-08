// Autor: Augusto Henrique Marçura. Testes HTTP das suas rotas da reunião 4.
const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const port = 31983;
const arquivo = process.env.DETALHES_SERVIDOR || path.join(__dirname, '../lib/servidorDetalhesReuniao4.js');
const servidor = spawn(process.execPath, [arquivo], { env: {...process.env, PORT: String(port)}, stdio: 'pipe' });
const pronto = new Promise((resolve, reject) => {
    servidor.stdout.once('data', resolve);
    servidor.once('exit', code => reject(new Error(`Servidor terminou: ${code}`)));
});
after(() => servidor.kill());
async function chamar(rota, body) {
    await pronto;
    const resposta = await fetch(`http://127.0.0.1:${port}${rota}`, body === undefined ? {} : {
        method: 'POST', headers: {'content-type': 'application/json'}, body: JSON.stringify(body)
    });
    return {status: resposta.status, dados: await resposta.json()};
}
test('detalhes: demanda existente, inexistente e identificador inválido', async () => {
    let r = await chamar('/demandas/1041');
    assert.equal(r.status, 200); assert.equal(r.dados.id, 1041); assert.ok(r.dados.descricao);
    assert.equal((await chamar('/demandas/99999')).status, 404);
    assert.equal((await chamar('/demandas/abc')).status, 400);
});
test('comentários vinculados à demanda e usuário e validados no servidor', async () => {
    assert.equal((await chamar('/demandas/99999/comentarios')).status, 404);
    assert.equal((await chamar('/demandas/99999/comentarios', {usuarioId: 1, texto: 'Olá'})).status, 404);
    assert.equal((await chamar('/demandas/1041/comentarios', {usuarioId: 1, texto: '   '})).status, 400);
    assert.equal((await chamar('/demandas/1041/comentarios', {usuarioId: 999, texto: 'Olá'})).status, 400);
    let r = await chamar('/demandas/1041/comentarios', {usuarioId: 1, texto: '  Comentário de teste  '});
    assert.equal(r.status, 201); assert.equal(r.dados.texto, 'Comentário de teste');
    assert.equal(r.dados.demandaId, 1041); assert.equal(r.dados.usuarioId, 1);
    assert.ok(!Number.isNaN(Date.parse(r.dados.dataHora)));
    r = await chamar('/demandas/1041/comentarios');
    assert.equal(r.status, 200); assert.equal(r.dados.length, 1); assert.equal(r.dados[0].usuarioId, 1);
});
