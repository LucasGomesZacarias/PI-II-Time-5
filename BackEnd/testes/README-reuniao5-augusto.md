# Reunião 5 — detalhes, comentários e edição

Responsável: Augusto Henrique Marçura.

As telas de detalhes e edição usam o servidor do projeto. As rotas consultam o Oracle, identificam o usuário pela sessão, verificam as permissões e registram as alterações e o histórico na mesma transação. A edição consulta a API de feriados antes de aceitar um prazo.

O arquivo `detalhes_demanda/apiReuniao5.js` é um cliente de estudo isolado; a tela integrada utiliza `detalhes_demanda/apiReal.js`.

Para executar os testes na pasta `BackEnd`, com as dependências instaladas:

```bash
npx tsc --outDir .teste-reuniao5
BACKEND_COMPILADO="$PWD/.teste-reuniao5" REGRAS_EDICAO="$PWD/.teste-reuniao5/edicao/regrasEdicao.js" node --test testes/*.test.cjs
```

Os testes das rotas usam sessões e respostas de banco simuladas; eles não alteram o Oracle. A verificação completa no navegador e no banco é feita separadamente.
