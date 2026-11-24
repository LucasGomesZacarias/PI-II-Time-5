-- Autor: Augusto Henrique Marçura.
-- Amplia o histórico para guardar descrições com acentos sem perder informações.
-- A alteração preserva os registros existentes e deve ser executada uma vez no Oracle.
ALTER TABLE historico_demanda MODIFY (valor_anterior VARCHAR2(2000 BYTE), valor_novo VARCHAR2(2000 BYTE));
