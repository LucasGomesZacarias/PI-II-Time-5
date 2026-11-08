// Autor: Augusto Henrique Marçura. Testes do contrato do cliente das telas.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const codigo = fs.readFileSync(path.join(__dirname,'../../detalhes_demanda/apiReuniao5.js'),'utf8');
const modulo = import(`data:text/javascript;base64,${Buffer.from(codigo).toString('base64')}`);
test('cliente chama as rotas previstas sem definir o autor do comentário',async()=>{
 const {criarClienteApi}=await modulo; const chamadas=[];
 const api=criarClienteApi(async (url,opcoes)=>{chamadas.push({url,opcoes});return {ok:true,status:200,json:async()=>({ok:true})}});
 await api.detalhes(1041); await api.comentarios(1041); await api.comentar(1041,'Olá'); await api.editar(1041,{titulo:'Novo'});
 assert.deepEqual(chamadas.map(c=>c.url),['/demandas/1041','/demandas/1041/comentarios','/demandas/1041/comentarios','/demandas/1041']);
 assert.deepEqual(JSON.parse(chamadas[2].opcoes.body),{texto:'Olá'}); assert.equal(chamadas[3].opcoes.method,'PUT');
 assert.throws(()=>api.detalhes('../1'),{status:400});
});
test('cliente apresenta erros do servidor e falhas de rede',async()=>{
 const {criarClienteApi}=await modulo;
 const erro=criarClienteApi(async()=>({ok:false,status:404,json:async()=>({mensagem:'Demanda não encontrada'})}));
 await assert.rejects(erro.detalhes(9),{status:404,message:'Demanda não encontrada'});
 const offline=criarClienteApi(async()=>{throw Error('offline')});
 await assert.rejects(offline.comentarios(1),{status:0,message:'Não foi possível conectar ao servidor.'});
});
