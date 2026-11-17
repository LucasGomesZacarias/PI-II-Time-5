// Testa o formulário com respostas simuladas da API.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const codigo = fs.readFileSync(path.join(__dirname, '../../EdicaoDemanda/scriptEdicaoDemanda.js'), 'utf8');
test('carrega a demanda e envia alterações para o servidor', async () => {
    const elementos = {};
    const envios = [];
    const alertas = [];
    const demanda = { titulo: 'Título original', descricao: 'Descrição original válida', tipo: 'Tarefa', prioridade: 'Alta', responsavelId: 2, projetoId: 1, status: 'Aberta', prazo: null };
    function elemento(seletor) {
        if (!elementos[seletor]) elementos[seletor] = { value: '', textContent: '', innerText: '', hidden: false, disabled: false,
            classList: { add() {}, remove() {} }, addEventListener(tipo, fn) { this[tipo] = fn; }, querySelector() { return elemento('#botao'); } };
        return elementos[seletor];
    }
    const contexto = { URLSearchParams, Number, Date, JSON, String, Error, encodeURIComponent,
        window: { location: { search: '?id=1' }, alert: msg => alertas.push(msg) },
        sessionStorage: { getItem: () => JSON.stringify({ id: 1 }) },
        document: { querySelector: elemento },
        fetch: async (url, opcoes) => {
            if (opcoes && opcoes.method === 'PUT') { envios.push({ url, opcoes }); return { ok: true, json: async () => ({ mensagem: 'Salvo' }) }; }
            return { ok: true, json: async () => demanda };
        }
    };
    vm.runInNewContext(codigo, contexto);
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(elemento('#titulo').value, 'Título original');
    elemento('#titulo').value = 'Título alterado';
    await elemento('#formEdicao').submit({ preventDefault() {} });
    assert.equal(envios.length, 1);
    assert.equal(envios[0].opcoes.headers['x-usuario-id'], '1');
    assert.equal(JSON.parse(envios[0].opcoes.body).titulo, 'Título alterado');
    assert.deepEqual(alertas, ['Salvo']);
});
