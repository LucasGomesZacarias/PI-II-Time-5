-- Autor: Luiz Felipe da Conceição
-- Modelagem do grupo (BRModelo) + carga inicial. Substitui usuarios.sql e modelagem.sql.
-- Executar no Oracle de uma vez, num banco sem as tabelas antigas (veja limpar.sql).
-- Única diferença para a modelagem: Usuario tem a coluna perfil (usada nas permissões do sistema).

CREATE TABLE Usuario (
    id_usuario NUMBER GENERATED ALWAYS AS IDENTITY,
    nome VARCHAR2(100) NOT NULL,
    email VARCHAR2(150) NOT NULL,
    status VARCHAR2(10) DEFAULT 'Ativo' NOT NULL,
    senha VARCHAR2(255) NOT NULL,
    perfil VARCHAR2(30) DEFAULT 'Membro da Equipe' NOT NULL,
    CONSTRAINT pk_usuario PRIMARY KEY (id_usuario),
    CONSTRAINT uq_usuario_email UNIQUE (email),
    CONSTRAINT ck_usuario_status CHECK (status IN ('Ativo', 'Inativo')),
    CONSTRAINT ck_usuario_perfil CHECK (perfil IN ('Administrador', 'Líder de Projeto', 'Membro da Equipe'))
);

CREATE TABLE Projeto (
    id_projeto NUMBER GENERATED ALWAYS AS IDENTITY,
    nome VARCHAR2(100) NOT NULL,
    status VARCHAR2(20) DEFAULT 'Ativo' NOT NULL,
    descricao VARCHAR2(500),
    data_criacao TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_projeto PRIMARY KEY (id_projeto)
);

CREATE TABLE Demanda (
    id_demanda NUMBER GENERATED ALWAYS AS IDENTITY,
    idUsuario NUMBER,
    idProjeto NUMBER NOT NULL,
    tipo VARCHAR2(20) NOT NULL,
    prioridade VARCHAR2(10) NOT NULL,
    data_criacao TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    prazo DATE,
    descricao VARCHAR2(2000) NOT NULL,
    titulo VARCHAR2(200) NOT NULL,
    data_atualizacao TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    status VARCHAR2(20) DEFAULT 'Aberta' NOT NULL,
    CONSTRAINT pk_demanda PRIMARY KEY (id_demanda),
    CONSTRAINT fk_demanda_usuario FOREIGN KEY (idUsuario) REFERENCES Usuario (id_usuario),
    CONSTRAINT fk_demanda_projeto FOREIGN KEY (idProjeto) REFERENCES Projeto (id_projeto),
    CONSTRAINT ck_demanda_tipo CHECK (tipo IN ('Tarefa', 'Defeito', 'Melhoria', 'Documentação')),
    CONSTRAINT ck_demanda_prioridade CHECK (prioridade IN ('Crítica', 'Alta', 'Média', 'Baixa')),
    CONSTRAINT ck_demanda_status CHECK (status IN ('Aberta', 'Em andamento', 'Em revisão', 'Concluída', 'Cancelada'))
);

CREATE TABLE Historico_demanda (
    id_historico NUMBER GENERATED ALWAYS AS IDENTITY,
    idUsuario NUMBER NOT NULL,
    idDemanda NUMBER NOT NULL,
    data_hora TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    valor_anterior VARCHAR2(500),
    tipo_alteracao VARCHAR2(50) NOT NULL,
    valor_novo VARCHAR2(500),
    CONSTRAINT pk_historico PRIMARY KEY (id_historico),
    CONSTRAINT fk_historico_usuario FOREIGN KEY (idUsuario) REFERENCES Usuario (id_usuario),
    CONSTRAINT fk_historico_demanda FOREIGN KEY (idDemanda) REFERENCES Demanda (id_demanda)
);

CREATE TABLE Comentario (
    id_comentario NUMBER GENERATED ALWAYS AS IDENTITY,
    idUsuario NUMBER NOT NULL,
    idDemanda NUMBER NOT NULL,
    texto VARCHAR2(1000) NOT NULL,
    data_criacao TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_comentario PRIMARY KEY (id_comentario),
    CONSTRAINT fk_comentario_usuario FOREIGN KEY (idUsuario) REFERENCES Usuario (id_usuario),
    CONSTRAINT fk_comentario_demanda FOREIGN KEY (idDemanda) REFERENCES Demanda (id_demanda)
);

-- Relação "participa" (usuário N:N projeto), com o papel de cada pessoa no projeto.
-- Quem cria o projeto entra como Líder; para tirar alguém, ativo vira 0 (sem exclusão física).
CREATE TABLE participa (
    id_usuario NUMBER NOT NULL,
    id_projeto NUMBER NOT NULL,
    papel VARCHAR2(20) DEFAULT 'Membro' NOT NULL,
    ativo NUMBER(1) DEFAULT 1 NOT NULL,
    data_vinculo TIMESTAMP DEFAULT SYSTIMESTAMP NOT NULL,
    CONSTRAINT pk_participa PRIMARY KEY (id_usuario, id_projeto),
    CONSTRAINT fk_participa_usuario FOREIGN KEY (id_usuario) REFERENCES Usuario (id_usuario),
    CONSTRAINT fk_participa_projeto FOREIGN KEY (id_projeto) REFERENCES Projeto (id_projeto),
    CONSTRAINT ck_participa_papel CHECK (papel IN ('Líder', 'Membro')),
    CONSTRAINT ck_participa_ativo CHECK (ativo IN (0, 1))
);

-- ===== Carga inicial =====

-- Usuários pré-cadastrados (senhas só para teste)
INSERT INTO Usuario (nome, email, senha, perfil) VALUES ('Ana Administradora', 'admin@nexo.com', 'Admin@123', 'Administrador');
INSERT INTO Usuario (nome, email, senha, perfil) VALUES ('Lucas Lider', 'lider@nexo.com', 'Lider@123', 'Líder de Projeto');
INSERT INTO Usuario (nome, email, senha, perfil) VALUES ('Maria Membro', 'membro@nexo.com', 'Membro@123', 'Membro da Equipe');

-- Projeto Nexo, Lucas Lider como Líder e Maria Membro como Membro
INSERT INTO Projeto (nome) VALUES ('Nexo');

INSERT INTO participa (id_projeto, id_usuario, papel)
SELECT p.id_projeto, u.id_usuario, 'Líder' FROM Projeto p, Usuario u
WHERE p.nome = 'Nexo' AND u.email = 'lider@nexo.com';

INSERT INTO participa (id_projeto, id_usuario, papel)
SELECT p.id_projeto, u.id_usuario, 'Membro' FROM Projeto p, Usuario u
WHERE p.nome = 'Nexo' AND u.email = 'membro@nexo.com';

-- Demandas de exemplo (para filtros, buscas e indicadores do dashboard)
INSERT INTO Demanda (titulo, descricao, tipo, prioridade, status, idProjeto, idUsuario, prazo)
SELECT 'Corrigir erro no login', 'O login retorna erro 500 com e-mail em maiúsculo.', 'Defeito', 'Crítica', 'Em andamento', p.id_projeto, u.id_usuario, TRUNC(SYSDATE) + 3
FROM Projeto p, Usuario u WHERE p.nome = 'Nexo' AND u.email = 'membro@nexo.com';

INSERT INTO Demanda (titulo, descricao, tipo, prioridade, status, idProjeto, idUsuario, prazo)
SELECT 'Criar tela de projetos', 'Listar projetos e atribuir pessoas ao projeto.', 'Tarefa', 'Alta', 'Aberta', p.id_projeto, u.id_usuario, TRUNC(SYSDATE) + 5
FROM Projeto p, Usuario u WHERE p.nome = 'Nexo' AND u.email = 'lider@nexo.com';

INSERT INTO Demanda (titulo, descricao, tipo, prioridade, status, idProjeto, idUsuario, prazo)
SELECT 'Documentar a API', 'Descrever as rotas no README.', 'Documentação', 'Baixa', 'Em revisão', p.id_projeto, u.id_usuario, TRUNC(SYSDATE) + 10
FROM Projeto p, Usuario u WHERE p.nome = 'Nexo' AND u.email = 'membro@nexo.com';

COMMIT;
