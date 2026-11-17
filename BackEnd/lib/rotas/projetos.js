"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotasProjetos = rotasProjetos;
const oracledb_1 = __importDefault(require("oracledb"));
const db_1 = require("../db");
const autenticacao_1 = require("../autenticacao");
const PAPEL_LIDER = "Líder";
const PAPEL_MEMBRO = "Membro";
// só o Administrador ou o Líder do projeto adiciona e remove pessoas
function podeGerenciar(usuario, papel) {
    return usuario.perfil === "Administrador" || papel === PAPEL_LIDER;
}
// confere quem está chamando e carrega o projeto da URL (/projetos/:id/...)
function carregarProjeto(conn, req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const usuario = yield (0, autenticacao_1.buscarUsuarioLogado)(conn, req);
        if (!usuario) {
            return { status: 401, mensagem: "Faça login para continuar" };
        }
        const idProjeto = Number(req.params.id);
        if (!Number.isInteger(idProjeto) || idProjeto <= 0) {
            return { status: 400, mensagem: "Projeto inválido" };
        }
        const result = yield conn.execute(`SELECT id_projeto as "id", nome as "nome" FROM Projeto WHERE id_projeto = :id`, { id: idProjeto });
        const projeto = (_a = result.rows) === null || _a === void 0 ? void 0 : _a[0];
        if (!projeto) {
            return { status: 404, mensagem: "Projeto não encontrado" };
        }
        const vinculo = yield conn.execute(`SELECT papel as "papel" FROM participa
         WHERE id_projeto = :projetoId AND id_usuario = :usuarioId AND ativo = 1`, { projetoId: projeto.id, usuarioId: usuario.id });
        const linha = (_b = vinculo.rows) === null || _b === void 0 ? void 0 : _b[0];
        return { usuario, projeto, papel: linha ? linha.papel : null };
    });
}
// cadastra as rotas da tela de Projetos no app do servidor
function rotasProjetos(app) {
    // lista os projetos de quem está logado (o Administrador vê todos)
    app.get("/projetos/resumo", (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        let conn;
        try {
            conn = yield (0, db_1.getConn)();
            const usuario = yield (0, autenticacao_1.buscarUsuarioLogado)(conn, req);
            if (!usuario) {
                return res.status(401).json({ mensagem: "Faça login para ver os projetos" });
            }
            // os outros perfis só veem os projetos em que participam
            let filtro = "";
            if (usuario.perfil !== "Administrador") {
                filtro = `WHERE EXISTS (SELECT 1 FROM participa v
                                        WHERE v.id_projeto = p.id_projeto AND v.id_usuario = :usuarioId AND v.ativo = 1)`;
            }
            const result = yield conn.execute(`SELECT p.id_projeto as "id", p.nome as "nome",
                        (SELECT u.nome FROM participa l JOIN Usuario u ON u.id_usuario = l.id_usuario
                         WHERE l.id_projeto = p.id_projeto AND l.papel = :papelLider AND l.ativo = 1 AND ROWNUM = 1) as "lider",
                        (SELECT COUNT(*) FROM participa m
                         WHERE m.id_projeto = p.id_projeto AND m.ativo = 1) as "totalMembros",
                        (SELECT e.papel FROM participa e
                         WHERE e.id_projeto = p.id_projeto AND e.id_usuario = :usuarioId AND e.ativo = 1) as "meuPapel"
                 FROM Projeto p
                 ${filtro}
                 ORDER BY p.nome`, { usuarioId: usuario.id, papelLider: PAPEL_LIDER });
            const projetos = ((_a = result.rows) !== null && _a !== void 0 ? _a : []).map((linha) => (Object.assign(Object.assign({}, linha), { podeGerenciar: podeGerenciar(usuario, linha.meuPapel) })));
            return res.status(200).json(projetos);
        }
        catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao listar os projetos" });
        }
        finally {
            if (conn)
                yield conn.close();
        }
    }));
    // cria um projeto: quem cria vira o Líder dele
    app.post("/projetos", (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { nome } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        if (!nome) {
            return res.status(400).json({ mensagem: "O nome do projeto é obrigatório", campo: "nome" });
        }
        const nomeLimpo = String(nome).trim();
        if (nomeLimpo.length < 3 || nomeLimpo.length > 100) {
            return res.status(400).json({ mensagem: "O nome do projeto deve ter de 3 a 100 caracteres", campo: "nome" });
        }
        let conn;
        try {
            conn = yield (0, db_1.getConn)();
            const usuario = yield (0, autenticacao_1.buscarUsuarioLogado)(conn, req);
            if (!usuario) {
                return res.status(401).json({ mensagem: "Faça login para criar um projeto" });
            }
            // o nome não pode se repetir (sem diferenciar maiúsculas)
            const existente = yield conn.execute(`SELECT id_projeto FROM Projeto WHERE LOWER(nome) = :nome`, { nome: nomeLimpo.toLowerCase() });
            if (existente.rows && existente.rows.length > 0) {
                return res.status(409).json({ mensagem: "Já existe um projeto com esse nome", campo: "nome" });
            }
            // projeto e vínculo do Líder entram juntos: se um falhar, nenhum fica
            const insercao = yield conn.execute(`INSERT INTO Projeto (nome) VALUES (:nome) RETURNING id_projeto INTO :id`, { nome: nomeLimpo, id: { dir: oracledb_1.default.BIND_OUT, type: oracledb_1.default.NUMBER } });
            const idProjeto = insercao.outBinds.id[0];
            yield conn.execute(`INSERT INTO participa (id_projeto, id_usuario, papel) VALUES (:projetoId, :usuarioId, :papel)`, { projetoId: idProjeto, usuarioId: usuario.id, papel: PAPEL_LIDER });
            // se quem criou não é o Administrador, o Administrador entra no projeto como Membro
            if (usuario.perfil !== "Administrador") {
                yield conn.execute(`INSERT INTO participa (id_projeto, id_usuario, papel)
                     SELECT :projetoId, id_usuario, :papel FROM Usuario WHERE perfil = 'Administrador'`, { projetoId: idProjeto, papel: PAPEL_MEMBRO });
            }
            yield conn.commit();
            return res.status(201).json({
                mensagem: "Projeto criado com sucesso",
                projeto: { id: idProjeto, nome: nomeLimpo }
            });
        }
        catch (erro) {
            console.error(erro);
            if (conn)
                yield conn.rollback();
            return res.status(500).json({ mensagem: "Erro ao criar o projeto" });
        }
        finally {
            if (conn)
                yield conn.close();
        }
    }));
    // lista as pessoas do projeto
    app.get("/projetos/:id/membros", (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        let conn;
        try {
            conn = yield (0, db_1.getConn)();
            const contexto = yield carregarProjeto(conn, req);
            if ("status" in contexto) {
                return res.status(contexto.status).json({ mensagem: contexto.mensagem });
            }
            if (contexto.usuario.perfil !== "Administrador" && !contexto.papel) {
                return res.status(403).json({ mensagem: "Você não participa deste projeto" });
            }
            // ordem alfabética do papel: Líder aparece antes de Membro
            const result = yield conn.execute(`SELECT u.id_usuario as "usuarioId", u.nome as "nome", u.email as "email", v.papel as "papel"
                 FROM participa v JOIN Usuario u ON u.id_usuario = v.id_usuario
                 WHERE v.id_projeto = :projetoId AND v.ativo = 1
                 ORDER BY v.papel, u.nome`, { projetoId: contexto.projeto.id });
            return res.status(200).json({
                projeto: contexto.projeto,
                podeGerenciar: podeGerenciar(contexto.usuario, contexto.papel),
                membros: (_a = result.rows) !== null && _a !== void 0 ? _a : []
            });
        }
        catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao listar os membros" });
        }
        finally {
            if (conn)
                yield conn.close();
        }
    }));
    // lista quem ainda pode ser adicionado ao projeto (só nome e e-mail)
    app.get("/projetos/:id/candidatos", (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        let conn;
        try {
            conn = yield (0, db_1.getConn)();
            const contexto = yield carregarProjeto(conn, req);
            if ("status" in contexto) {
                return res.status(contexto.status).json({ mensagem: contexto.mensagem });
            }
            if (!podeGerenciar(contexto.usuario, contexto.papel)) {
                return res.status(403).json({ mensagem: "Só o Administrador ou o líder do projeto pode adicionar pessoas" });
            }
            const result = yield conn.execute(`SELECT u.id_usuario as "id", u.nome as "nome", u.email as "email"
                 FROM Usuario u
                 WHERE NOT EXISTS (SELECT 1 FROM participa v
                                   WHERE v.id_projeto = :projetoId AND v.id_usuario = u.id_usuario AND v.ativo = 1)
                 ORDER BY u.nome`, { projetoId: contexto.projeto.id });
            return res.status(200).json((_a = result.rows) !== null && _a !== void 0 ? _a : []);
        }
        catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao listar as pessoas" });
        }
        finally {
            if (conn)
                yield conn.close();
        }
    }));
    // o líder (ou o Administrador) adiciona uma ou várias pessoas ao projeto como Membro
    app.post("/projetos/:id/membros", (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        var _b;
        const { usuariosIds } = (_b = req.body) !== null && _b !== void 0 ? _b : {};
        // precisa ser uma lista com pelo menos uma pessoa
        if (!Array.isArray(usuariosIds) || usuariosIds.length === 0) {
            return res.status(400).json({ mensagem: "Marque pelo menos uma pessoa para adicionar", campo: "usuariosIds" });
        }
        // só números inteiros, sem repetir
        const ids = Array.from(new Set(usuariosIds.map(Number)));
        if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
            return res.status(400).json({ mensagem: "Lista de pessoas inválida", campo: "usuariosIds" });
        }
        let conn;
        try {
            conn = yield (0, db_1.getConn)();
            const contexto = yield carregarProjeto(conn, req);
            if ("status" in contexto) {
                return res.status(contexto.status).json({ mensagem: contexto.mensagem });
            }
            if (!podeGerenciar(contexto.usuario, contexto.papel)) {
                return res.status(403).json({ mensagem: "Só o Administrador ou o líder do projeto pode adicionar pessoas" });
            }
            // confere todas as pessoas antes de gravar qualquer uma (entram todas ou nenhuma)
            const paraReativar = [];
            const paraInserir = [];
            for (const idUsuario of ids) {
                const usuario = yield conn.execute(`SELECT id_usuario FROM Usuario WHERE id_usuario = :id`, { id: idUsuario });
                if (!usuario.rows || usuario.rows.length === 0) {
                    return res.status(404).json({ mensagem: "Uma das pessoas escolhidas não foi encontrada", campo: "usuariosIds" });
                }
                const vinculo = yield conn.execute(`SELECT ativo as "ativo" FROM participa WHERE id_projeto = :projetoId AND id_usuario = :usuarioId`, { projetoId: contexto.projeto.id, usuarioId: idUsuario });
                const existente = (_a = vinculo.rows) === null || _a === void 0 ? void 0 : _a[0];
                if (existente && existente.ativo === 1) {
                    return res.status(409).json({ mensagem: "Uma das pessoas escolhidas já participa do projeto", campo: "usuariosIds" });
                }
                if (existente) {
                    // já participou antes: só volta a ficar ativa
                    paraReativar.push(idUsuario);
                }
                else {
                    paraInserir.push(idUsuario);
                }
            }
            for (const idUsuario of paraReativar) {
                yield conn.execute(`UPDATE participa SET ativo = 1 WHERE id_projeto = :projetoId AND id_usuario = :usuarioId`, { projetoId: contexto.projeto.id, usuarioId: idUsuario });
            }
            for (const idUsuario of paraInserir) {
                yield conn.execute(`INSERT INTO participa (id_projeto, id_usuario, papel) VALUES (:projetoId, :usuarioId, :papel)`, { projetoId: contexto.projeto.id, usuarioId: idUsuario, papel: PAPEL_MEMBRO });
            }
            yield conn.commit();
            const mensagem = ids.length === 1 ? "Pessoa adicionada ao projeto" : `${ids.length} pessoas adicionadas ao projeto`;
            return res.status(201).json({ mensagem });
        }
        catch (erro) {
            console.error(erro);
            if (conn)
                yield conn.rollback();
            return res.status(500).json({ mensagem: "Erro ao adicionar as pessoas" });
        }
        finally {
            if (conn)
                yield conn.close();
        }
    }));
    // tira uma pessoa do projeto sem apagar o registro (ativo passa para 0)
    app.patch("/projetos/:id/membros/:usuarioId/remover", (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const idUsuario = Number(req.params.usuarioId);
        let conn;
        try {
            conn = yield (0, db_1.getConn)();
            const contexto = yield carregarProjeto(conn, req);
            if ("status" in contexto) {
                return res.status(contexto.status).json({ mensagem: contexto.mensagem });
            }
            if (!podeGerenciar(contexto.usuario, contexto.papel)) {
                return res.status(403).json({ mensagem: "Só o Administrador ou o líder do projeto pode remover pessoas" });
            }
            const vinculo = yield conn.execute(`SELECT papel as "papel" FROM participa
                 WHERE id_projeto = :projetoId AND id_usuario = :usuarioId AND ativo = 1`, { projetoId: contexto.projeto.id, usuarioId: idUsuario });
            const existente = (_a = vinculo.rows) === null || _a === void 0 ? void 0 : _a[0];
            if (!existente) {
                return res.status(404).json({ mensagem: "Essa pessoa não participa do projeto" });
            }
            if (existente.papel === PAPEL_LIDER) {
                return res.status(400).json({ mensagem: "O líder não pode ser removido do projeto" });
            }
            // o Administrador nunca pode ser removido de um projeto
            const alvo = yield conn.execute(`SELECT perfil as "perfil" FROM Usuario WHERE id_usuario = :id`, { id: idUsuario });
            const usuarioAlvo = (_b = alvo.rows) === null || _b === void 0 ? void 0 : _b[0];
            if (usuarioAlvo && usuarioAlvo.perfil === "Administrador") {
                return res.status(400).json({ mensagem: "O Administrador não pode ser removido do projeto" });
            }
            yield conn.execute(`UPDATE participa SET ativo = 0 WHERE id_projeto = :projetoId AND id_usuario = :usuarioId`, { projetoId: contexto.projeto.id, usuarioId: idUsuario }, { autoCommit: true });
            return res.status(200).json({ mensagem: "Pessoa removida do projeto" });
        }
        catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao remover a pessoa" });
        }
        finally {
            if (conn)
                yield conn.close();
        }
    }));
}
//# sourceMappingURL=projetos.js.map