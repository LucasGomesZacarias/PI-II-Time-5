-- Autor: Augusto Henrique Marçura.
-- Compatibilidade entre a modelagem no singular e as rotas existentes no plural.
-- Execute somente no esquema que contém USUARIO, PROJETO e DEMANDA e não
-- possui objetos chamados USUARIOS, PROJETOS e DEMANDAS.
-- Hipótese a confirmar com a equipe: DEMANDA.IDUSUARIO é o responsável.

CREATE VIEW usuarios AS
SELECT id_usuario AS id, nome, email, senha, perfil, status
FROM usuario;

CREATE VIEW projetos AS
SELECT id_projeto AS id, nome, status, descricao, data_criacao
FROM projeto;

CREATE VIEW demandas AS
SELECT id_demanda AS id, idusuario AS responsavel_id,
       idprojeto AS projeto_id, tipo, prioridade, data_criacao, prazo,
       descricao, titulo, data_atualizacao, status
FROM demanda;
