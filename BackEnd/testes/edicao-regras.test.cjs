// Autor: Augusto Henrique Marçura. Testes das regras independentes de edição.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {prepararEdicao} = require(process.env.REGRAS_EDICAO);
const atual = {titulo:'Demanda original',descricao:'Descrição para a demanda',tipo:'Tarefa',prioridade:'Alta',projetoId:1,responsavelId:1,prazo:null,status:'Aberta'};
const deps = {projetoExiste:async id=>id===1,usuarioExiste:async id=>id===1,feriadoNacional:async d=>d==='2027-01-01'?'Confraternização':null};
const edicao = mudancas => prepararEdicao(atual, {...atual,...mudancas}, 1, deps);
test('edição registra os campos alterados e o usuário fornecido pelo servidor',async()=>{
 const r=await edicao({titulo:' Novo título ',prioridade:'Crítica',status:'Em andamento'});
 assert.equal(r.demanda.titulo,'Novo título'); assert.deepEqual(r.historico.map(x=>x.campo),['titulo','prioridade','status']); assert.ok(r.historico.every(x=>x.usuarioId===1));
 assert.equal((await edicao({})).historico.length,0);
});
test('valida transições, entidades e prazos',async()=>{
 for(const e of [{status:'Concluída'},{projetoId:2},{responsavelId:3},{prazo:'2027-02-30'},{prazo:'2027-01-01'}]) await assert.rejects(edicao(e),{status:400});
 await assert.rejects(prepararEdicao(atual,atual,0,deps),{status:401});
 await assert.rejects(prepararEdicao(atual,{...atual,prazo:'2027-01-02'},1,{...deps,feriadoNacional:async()=>{throw Error('fora do ar')}}),{status:503});
});
