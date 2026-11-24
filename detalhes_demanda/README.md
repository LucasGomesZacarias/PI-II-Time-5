# Detalhes, comentários e edição de demandas

A tela de detalhes consulta o servidor do projeto em `http://localhost:3000` para mostrar a demanda e os comentários. O envio de comentários usa o usuário identificado pelo login da equipe.

A tela de edição consulta a demanda e envia as alterações ao servidor. Os projetos e responsáveis aparecem pelo nome nas listas. O servidor valida os dados, verifica o perfil, o vínculo com o projeto e os feriados nacionais. Quando há mudanças, a demanda e o histórico são gravados na mesma transação. O histórico aparece na tela de detalhes para usuários identificados com acesso ao projeto. Um membro responsável também pode avançar o status da demanda, seguindo as transições permitidas.

Para testar com o Oracle, é necessário iniciar o backend e ter acesso ao banco. O fluxo atual da equipe identifica o usuário por um ID enviado pelo navegador; esse ID pode ser alterado e ainda não substitui uma sessão autenticada ou token seguro. Os testes locais simulados não comprovam a integração com o banco real.

Para permitir que o histórico registre textos de até 500 caracteres com acentos, execute uma vez o script `BackEnd/sql/ampliar_historico.sql` no banco usado pelo projeto. Ele amplia as duas colunas de valores e preserva os registros existentes.
