# Testes de detalhes e comentários

Responsável: Augusto Henrique Marçura.

As rotas de detalhes e comentários fazem parte do servidor principal em `src/server.ts`. Os testes de reunião 4 usam dados fictícios em memória e abrem uma porta temporária somente enquanto estão executando. Eles não alteram o banco de dados.

Para executar os testes, na pasta `BackEnd`, com as dependências instaladas:

```bash
npx tsc --outDir .teste-detalhes
BACKEND_COMPILADO="$PWD/.teste-detalhes" node --test testes/detalhes-reuniao4.test.cjs
```

Os testes verificam consulta de demanda, listagem e criação de comentários, identificadores inválidos e JSON malformado. Esse teste isolado não substitui a verificação do servidor principal com o Oracle.
