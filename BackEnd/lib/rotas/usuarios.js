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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotasUsuarios = rotasUsuarios;
const db_1 = require("../db");
// mesmas regras de e-mail e senha da tela de login (script.js), repetidas aqui
// porque a validação do servidor não pode depender do navegador
const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function senhaAtendeRegras(senha) {
    const possuiMaiuscula = /[A-Z]/.test(senha);
    const possuiMinuscula = /[a-z]/.test(senha);
    const possuiEspecial = /[^\p{L}\p{N}\s]/u.test(senha);
    return senha.length >= 8 && possuiMaiuscula && possuiMinuscula && possuiEspecial;
}
// cadastra as rotas da tela de login e cadastro no app do servidor
function rotasUsuarios(app) {
    // confere e-mail e senha e devolve o usuário (sem a senha)
    app.post("/login", (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        var _b;
        const { email, senha } = (_b = req.body) !== null && _b !== void 0 ? _b : {};
        // campos obrigatórios
        if (!email || !senha) {
            return res.status(400).json({ mensagem: "E-mail e senha são obrigatórios" });
        }
        let conn;
        try {
            conn = yield (0, db_1.getConn)();
            // o e-mail é guardado em minúsculo, então a busca também usa minúsculo
            const result = yield conn.execute(`SELECT id as "id", nome as "nome", email as "email", perfil as "perfil", senha as "senha"
                 FROM usuarios WHERE email = :email`, { email: String(email).trim().toLowerCase() });
            const usuario = (_a = result.rows) === null || _a === void 0 ? void 0 : _a[0];
            // mesma mensagem para e-mail inexistente e senha errada (não revela qual dos dois errou)
            if (!usuario || usuario.senha !== senha) {
                return res.status(401).json({ mensagem: "E-mail ou senha inválidos" });
            }
            // a senha nunca sai na resposta
            const { senha: _senha } = usuario, usuarioSemSenha = __rest(usuario, ["senha"]);
            return res.status(200).json(usuarioSemSenha);
        }
        catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao fazer login" });
        }
        finally {
            // devolve a conexão para o pool
            if (conn)
                yield conn.close();
        }
    }));
    // lista os usuários pré-cadastrados (sem a senha)
    app.get("/usuarios", (_req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        let conn;
        try {
            conn = yield (0, db_1.getConn)();
            const result = yield conn.execute(`SELECT id as "id", nome as "nome", email as "email", perfil as "perfil"
                 FROM usuarios ORDER BY nome`);
            return res.status(200).json((_a = result.rows) !== null && _a !== void 0 ? _a : []);
        }
        catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao buscar os usuários" });
        }
        finally {
            if (conn)
                yield conn.close();
        }
    }));
    // cadastra um novo usuário (formulário de cadastro da tela de login)
    app.post("/usuarios", (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { nome, email, senha, confirmaSenha } = (_a = req.body) !== null && _a !== void 0 ? _a : {};
        // campos obrigatórios
        if (!nome || !email || !senha) {
            return res.status(400).json({ mensagem: "Nome, e-mail e senha são obrigatórios" });
        }
        const nomeLimpo = String(nome).trim();
        const emailLimpo = String(email).trim().toLowerCase();
        const senhaTexto = String(senha);
        // nome: 5 a 100 caracteres, com nome e sobrenome
        if (nomeLimpo.length < 5 || nomeLimpo.length > 100 || nomeLimpo.split(/\s+/).length < 2) {
            return res.status(400).json({ mensagem: "Informe nome e sobrenome (de 5 a 100 caracteres)" });
        }
        if (!formatoEmail.test(emailLimpo)) {
            return res.status(400).json({ mensagem: "E-mail inválido" });
        }
        if (!senhaAtendeRegras(senhaTexto)) {
            return res.status(400).json({ mensagem: "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula e um caractere especial" });
        }
        // a confirmação só é conferida quando a tela envia
        if (confirmaSenha !== undefined && confirmaSenha !== senhaTexto) {
            return res.status(400).json({ mensagem: "As senhas não são iguais" });
        }
        let conn;
        try {
            conn = yield (0, db_1.getConn)();
            // e-mail não pode se repetir
            const existente = yield conn.execute(`SELECT id FROM usuarios WHERE email = :email`, { email: emailLimpo });
            if (existente.rows && existente.rows.length > 0) {
                return res.status(409).json({ mensagem: "Já existe um usuário com esse e-mail" });
            }
            // o perfil nunca vem da requisição: quem se cadastra pela tela entra como Membro da Equipe
            yield conn.execute(`INSERT INTO usuarios (nome, email, senha, perfil)
                 VALUES (:nome, :email, :senha, 'Membro da Equipe')`, { nome: nomeLimpo, email: emailLimpo, senha: senhaTexto }, { autoCommit: true });
            return res.status(201).json({
                mensagem: "Usuário cadastrado com sucesso!",
                usuario: { nome: nomeLimpo, email: emailLimpo, perfil: "Membro da Equipe" }
            });
        }
        catch (erro) {
            // ORA-00001: dois cadastros do mesmo e-mail ao mesmo tempo
            if ((erro === null || erro === void 0 ? void 0 : erro.errorNum) === 1) {
                return res.status(409).json({ mensagem: "Já existe um usuário com esse e-mail" });
            }
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao cadastrar o usuário" });
        }
        finally {
            if (conn)
                yield conn.close();
        }
    }));
}
//# sourceMappingURL=usuarios.js.map