// Autor: Augusto Henrique Marçura. Testa a ação de status na tela de detalhes.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const codigo = fs.readFileSync(path.join(__dirname, '../../detalhes_demanda/apiReal.js'), 'utf8');
async function abrir(responsavelId, respostaStatus) {
    const elementos = {};
    const envios = [];
    let atualizou = false;
    function el(seletor) {
        if (!elementos[seletor]) elementos[seletor] = {
            value: '', textContent: '', hidden: true, disabled: false,
            addEventListener(tipo, funcao) { this[tipo] = funcao; },
            querySelector() { return el('#botao-' + seletor); },
            append(item) { if (item.value) this.value = item.value; }, focus() {}
        };
        return elementos[seletor];
    }
    const contexto = {
        URLSearchParams, Number, Date, Error, String, JSON, encodeURIComponent,
        window: { location: { search: '?id=1', reload() { atualizou = true; } } },
        sessionStorage: { getItem() { return JSON.stringify({ id: 2, perfil: 'Membro da Equipe' }); } },
        document: { querySelector: el, createElement() { return { textContent: '', append() {} }; } },
        fetch: async (url, opcoes) => {
            if (opcoes && opcoes.method === 'PATCH') {
                envios.push(opcoes);
                return { ok: respostaStatus.status < 400, json: async () => respostaStatus.dados };
            }
            if (url.endsWith('/comentarios') || url.endsWith('/historico')) return { ok: true, json: async () => [] };
            return { ok: true, json: async () => ({ id: 1, status: 'Aberta', responsavelId }) };
        }
    };
    vm.runInNewContext(codigo, contexto);
    await new Promise(resolve => setImmediate(resolve));
    return { el, envios, atualizou: () => atualizou };
}
test('membro responsável consegue solicitar apenas o próximo status', async () => {
    const tela = await abrir(2, { status: 200, dados: { mensagem: 'Atualizado' } });
    assert.equal(tela.el('#secao-status').hidden, false);
    assert.equal(tela.el('#novo-status').value, 'Em andamento');
    await tela.el('#formulario-status').submit({ preventDefault() {} });
    assert.equal(tela.envios[0].headers['x-usuario-id'], '2');
    assert.equal(JSON.parse(tela.envios[0].body).status, 'Em andamento');
    assert.equal(tela.atualizou(), true);
});
test('demanda de outro responsável não mostra a ação de status', async () => {
    const tela = await abrir(8, { status: 200, dados: {} });
    assert.equal(tela.el('#secao-status').hidden, true);
});
test('erro ao atualizar fica visível e permite tentar de novo', async () => {
    const tela = await abrir(2, { status: 403, dados: { mensagem: 'Acesso negado' } });
    await tela.el('#formulario-status').submit({ preventDefault() {} });
    assert.equal(tela.el('#mensagem-status').textContent, 'Acesso negado');
    assert.equal(tela.el('#botao-#formulario-status').disabled, false);
    assert.equal(tela.atualizou(), false);
});
