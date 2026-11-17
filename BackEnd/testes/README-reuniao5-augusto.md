# Reunião 5 — detalhes, comentários e edição

Responsável pela preparação: Augusto Henrique Marçura, com apoio de IA. Material para estudar e revisar com a equipe.

## O que foi preparado

- `src/edicao/regrasEdicao.ts`: validação dos campos, projeto, responsável, prazo e feriados, ciclo de status e cálculo do histórico. É uma função independente, ainda não ligada à API ou ao banco. O servidor deve determinar o usuário a partir de sessão autenticada, verificar suas permissões e gravar a demanda e o histórico na mesma transação. Data e hora de atualização deverão ser definidas pelo banco/servidor. A função não faz essas etapas.
- `detalhes_demanda/apiReuniao5.js`: cliente para as rotas propostas `GET /demandas/:id`, `GET /demandas/:id/comentarios`, `POST /demandas/:id/comentarios` e `PUT /demandas/:id`. Ainda não está conectado às telas nem a uma API real. O servidor deve identificar o autor do comentário pela sessão, não por um ID informado pelo navegador. O contrato deve ser combinado com o grupo.
- Testes de regras e do cliente com respostas simuladas. Eles não validam Oracle, autenticação, permissões ou funcionamento integrado.

## Para concluir a integração

1. A equipe precisa definir e versionar as tabelas de demandas, projetos, usuários, comentários e histórico, com dados de teste, além de definir como conectar ao Oracle e iniciar a API.
2. Definir sessão autenticada e autorização por perfil no servidor. O usuário autenticado deve ser obtido pelo servidor, nunca aceito como prova apenas por um ID enviado pela tela.
3. Conectar as rotas de detalhes, comentários e edição ao banco. A edição e seus registros de histórico precisam usar a mesma transação; alterações concorrentes precisam ser tratadas. O histórico deve guardar o usuário autenticado e não permitir exclusão.
4. Integrar `prepararEdicao` com consultas reais de projeto e responsável e com a função de feriados do projeto. Definir e aplicar as permissões por perfil segundo o Documento de Visão; o módulo não as implementa.
5. Usar o cliente nas telas de detalhes e edição e adaptar o formato das respostas. Testar requisições válidas e mensagens de erro na interface, além de persistência após reiniciar o servidor.
6. Registrar atividades, estimativa e horas efetivas no GitHub Projects; combinar a revisão e integração com o grupo.

Os dados em memória e localStorage usados em demonstrações anteriores não atendem ao requisito de persistência da reunião 5. Nenhuma tabela foi criada no banco da equipe.

## Testes isolados

No diretório `BackEnd`, com Node LTS e dependências instaladas:

```bash
npx tsc --outDir .teste-reuniao5
REGRAS_EDICAO="$PWD/.teste-reuniao5/edicao/regrasEdicao.js" node --test testes/edicao-regras.test.cjs
node --test testes/cliente-reuniao5.test.cjs
```
