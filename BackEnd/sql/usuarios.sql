-- Autor: Luiz Felipe da Conceição
-- Tabela de usuários e carga inicial (um usuário de cada perfil).
-- Executar no Oracle antes de subir o servidor.

CREATE TABLE usuarios (
    id            NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome          VARCHAR2(100) NOT NULL,
    email         VARCHAR2(150) NOT NULL,
    senha         VARCHAR2(255) NOT NULL,
    perfil        VARCHAR2(30)  DEFAULT 'Membro da Equipe' NOT NULL,
    data_criacao  TIMESTAMP     DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT uk_usuarios_email UNIQUE (email),
    CONSTRAINT ck_usuarios_perfil CHECK (perfil IN ('Administrador', 'Líder de Projeto', 'Membro da Equipe'))
);

-- Usuários pré-cadastrados (senhas só para teste)
INSERT INTO usuarios (nome, email, senha, perfil) VALUES ('Ana Administradora', 'admin@nexo.com', 'Admin@123', 'Administrador');
INSERT INTO usuarios (nome, email, senha, perfil) VALUES ('Lucas Lider', 'lider@nexo.com', 'Lider@123', 'Líder de Projeto');
INSERT INTO usuarios (nome, email, senha, perfil) VALUES ('Maria Membro', 'membro@nexo.com', 'Membro@123', 'Membro da Equipe');

COMMIT;

UPDATE usuarios SET senha = '$2b$12$Hr9Y9yR1vFTyakSzjwcGLO0YUSjnpFPrrhDuQD9SWwfdSkXC1wLPe' WHERE email = 'admin@nexo.com';
UPDATE usuarios SET senha = '$2b$12$/QAhMfB8oTUus2bKjWCD3OrcGMYEUIyrePLkhelCY5xtsOuE3gg5O' WHERE email = 'lider@nexo.com';
UPDATE usuarios SET senha = '$2b$12$afui98M5udGlhFQoCm3pLeIrPxDMm/Y9YJXbVYcC7w2GJdkR2r9cK' WHERE email = 'membro@nexo.com';
COMMIT;


