# Detalhes e comentários — reunião 4

Responsável: Augusto Henrique Marçura. A implementação e o material de testes foram preparados com apoio de IA para revisão e estudo.

Esta demonstração usa uma demanda e um usuário fictícios em memória. As rotas são independentes do servidor principal do grupo; os comentários desaparecem quando o processo termina. Banco de dados e integração das telas pertencem à etapa seguinte.

## Executar

Na pasta `BackEnd`, com Node.js LTS e as dependências instaladas (`npm ci`):

```bash
npx tsc --outDir .demonstracao-detalhes
node .demonstracao-detalhes/servidorDetalhesReuniao4.js
```

O servidor escuta `http://127.0.0.1:3002`. Para executar os testes automatizados, pare o servidor e, na mesma pasta, use:

```bash
DETALHES_SERVIDOR="$PWD/.demonstracao-detalhes/servidorDetalhesReuniao4.js" node --test testes/detalhes-reuniao4.test.cjs
```

## Exemplos para apresentar

Consultar a demanda e um ID inexistente:

```bash
curl -i http://127.0.0.1:3002/demandas/1041
curl -i http://127.0.0.1:3002/demandas/99999
```

Listar comentários e adicionar um comentário válido:

```bash
curl -i http://127.0.0.1:3002/demandas/1041/comentarios
curl -i -X POST http://127.0.0.1:3002/demandas/1041/comentarios \
  -H 'Content-Type: application/json' \
  -d '{"usuarioId":1,"texto":"Comentário de teste"}'
```

Demonstrar erro de texto vazio e usuário inexistente:

```bash
curl -i -X POST http://127.0.0.1:3002/demandas/1041/comentarios \
  -H 'Content-Type: application/json' -d '{"usuarioId":1,"texto":"  "}'
curl -i -X POST http://127.0.0.1:3002/demandas/1041/comentarios \
  -H 'Content-Type: application/json' -d '{"usuarioId":999,"texto":"Teste"}'
```

As respostas esperadas são 200 para consultas, 201 para comentário criado, 400 para dados inválidos e 404 para demanda inexistente. O servidor define data e horário do comentário; o usuário informado precisa existir nos dados de teste.

O cartão da atividade é a issue #65. Estimativa e esforço real devem ser registrados conforme o tempo efetivamente trabalhado. A integração ao servidor principal e aos dados compartilhados precisa ser combinada com a equipe, sem substituir o trabalho dos colegas.
