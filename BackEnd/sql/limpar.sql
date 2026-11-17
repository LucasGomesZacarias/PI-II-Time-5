-- Autor: Luiz Felipe da Conceição
-- Apaga as tabelas ANTIGAS (nomes no plural) para recriar o banco com o schema.sql.
-- ATENÇÃO: apaga todos os dados e o PURGE não permite recuperar. Execute uma única vez.
-- Ordem: tabelas filhas primeiro, por causa das chaves estrangeiras.
-- Se alguma disser "table or view does not exist" (ORA-00942), ela já foi apagada: siga em frente.

DROP TABLE historico_demandas PURGE;
DROP TABLE comentarios PURGE;
DROP TABLE demandas PURGE;
DROP TABLE usuarios_projetos PURGE;
DROP TABLE projetos PURGE;
DROP TABLE usuarios PURGE;
