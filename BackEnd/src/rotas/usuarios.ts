// Autor: Luiz Felipe da Conceição
import { Express, Request, Response } from "express";
import { getConn } from "../db";
import bcrypt from "bcryptjs";
import { exigirLogin } from "../autenticacao";

// mesmas regras de e-mail e senha da tela de login (script.js), repetidas aqui
// porque a validação do servidor não pode depender do navegador
const formatoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function senhaAtendeRegras(senha: string): boolean {
    const possuiMaiuscula = /[A-Z]/.test(senha);
    const possuiMinuscula = /[a-z]/.test(senha);
    const possuiEspecial = /[^\p{L}\p{N}\s]/u.test(senha);

    return senha.length >= 8 && possuiMaiuscula && possuiMinuscula && possuiEspecial;
}

// cadastra as rotas da tela de login e cadastro no app do servidor
export function rotasUsuarios(app: Express) {

    // confere e-mail e senha e devolve o usuário (sem a senha)
    app.post("/login", async (req: Request, res: Response) => {
        const { email, senha } = req.body ?? {};

        // campos obrigatórios (o "campo" diz à tela qual input marcar)
        if (!email) {
            return res.status(400).json({ mensagem: "O e-mail é obrigatório", campo: "email" });
        }

        if (!senha) {
            return res.status(400).json({ mensagem: "A senha é obrigatória", campo: "senha" });
        }

        let conn;

        try {
            conn = await getConn();

            // o e-mail é guardado em minúsculo, então a busca também usa minúsculo
            const result = await conn.execute(
                `SELECT id_usuario as "id", nome as "nome", email as "email", perfil as "perfil", status as "status", senha as "senha"
                 FROM Usuario WHERE email = :email`,
                { email: String(email).trim().toLowerCase() }
            );

            const usuario = result.rows?.[0] as any;

            // mesma mensagem para e-mail inexistente e senha errada (não revela qual dos dois errou)
            if (!usuario || !(await bcrypt.compare(String(senha), usuario.senha))) {
                return res.status(401).json({ mensagem: "E-mail ou senha inválidos" });
            }

            // usuário inativo não entra (ninguém é apagado, só fica Inativo)
            if (usuario.status === "Inativo") {
                return res.status(403).json({ mensagem: "Usuário inativo. Procure o administrador", campo: "email" });
            }

            // a senha e o status não saem na resposta
            const { senha: _senha, status: _status, ...usuarioSemSenha } = usuario;

            // cria outra sessão (novo identificador) depois do login
            return req.session.regenerate((erro) => {
                if (erro) {
                    return res.status(500).json({ mensagem: "Erro ao fazer login" });
                }

                // guarda quem entrou na sessão (sem a senha)
                req.session.usuario = usuarioSemSenha;

                // espera gravar a sessão antes da tela abrir a próxima página
                return req.session.save((erro) => {
                    if (erro) {
                        return res.status(500).json({ mensagem: "Erro ao fazer login" });
                    }
                    return res.status(200).json(req.session.usuario);
                });
            });
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao fazer login" });
        } finally {
            // devolve a conexão para o pool
            if (conn) await conn.close();
        }
    });

    // devolve quem está logado (a tela usa para mostrar o nome)
    app.get("/sessao", exigirLogin, (req: Request, res: Response) => {
        return res.json(req.session.usuario);
    });

    // encerra a sessão e apaga o cookie
    app.post("/logout", exigirLogin, (req: Request, res: Response) => {
        req.session.destroy((erro) => {
            if (erro) {
                return res.status(500).json({ mensagem: "Erro ao sair" });
            }
            res.clearCookie("nexo.sid");
            return res.json({ mensagem: "Sessão encerrada." });
        });
    });

    // lista os usuários pré-cadastrados (sem a senha)
    app.get("/usuarios", async (_req: Request, res: Response) => {
        let conn;

        try {
            conn = await getConn();

            const result = await conn.execute(
                `SELECT id_usuario as "id", nome as "nome", email as "email", perfil as "perfil"
                 FROM Usuario ORDER BY nome`
            );

            return res.status(200).json(result.rows ?? []);
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao buscar os usuários" });
        } finally {
            if (conn) await conn.close();
        }
    });

    // cadastra um novo usuário (formulário de cadastro da tela de login)
    app.post("/usuarios", async (req: Request, res: Response) => {
        const { nome, email, senha, confirmaSenha } = req.body ?? {};

        // campos obrigatórios (o "campo" diz à tela qual input marcar)
        if (!nome) {
            return res.status(400).json({ mensagem: "O nome é obrigatório", campo: "nome" });
        }

        if (!email) {
            return res.status(400).json({ mensagem: "O e-mail é obrigatório", campo: "email" });
        }

        if (!senha) {
            return res.status(400).json({ mensagem: "A senha é obrigatória", campo: "senha" });
        }

        const nomeLimpo = String(nome).trim();
        const emailLimpo = String(email).trim().toLowerCase();
        const senhaTexto = String(senha);

        // nome: 5 a 100 caracteres, com nome e sobrenome
        if (nomeLimpo.length < 5 || nomeLimpo.length > 100 || nomeLimpo.split(/\s+/).length < 2) {
            return res.status(400).json({ mensagem: "Informe nome e sobrenome (de 5 a 100 caracteres)", campo: "nome" });
        }

        if (!formatoEmail.test(emailLimpo)) {
            return res.status(400).json({ mensagem: "Informe um endereço de e-mail válido", campo: "email" });
        }

        if (!senhaAtendeRegras(senhaTexto)) {
            return res.status(400).json({ mensagem: "A senha deve ter no mínimo 8 caracteres, uma letra maiúscula, uma minúscula e um caractere especial" });
        }

        if (bcrypt.truncates(senhaTexto)) {
            return res.status(400).json({ mensagem: "A senha deve ter no máximo 72 bytes" });
        }

        // a confirmação só é conferida quando a tela envia
        if (confirmaSenha !== undefined && confirmaSenha !== senhaTexto) {
            return res.status(400).json({ mensagem: "As senhas não são iguais", campo: "confirmaSenha" });
        }

        const senhaHash = await bcrypt.hash(senhaTexto, 12);

        let conn;

        try {
            conn = await getConn();

            // e-mail não pode se repetir
            const existente = await conn.execute(`SELECT id_usuario FROM Usuario WHERE email = :email`, { email: emailLimpo });

            if (existente.rows && existente.rows.length > 0) {
                return res.status(409).json({ mensagem: "Já existe um usuário com esse e-mail", campo: "email" });
            }

            // o perfil nunca vem da requisição: quem se cadastra pela tela entra como Membro da Equipe
            await conn.execute(
                `INSERT INTO Usuario (nome, email, senha, perfil)
                 VALUES (:nome, :email, :senha, 'Membro da Equipe')`,
                { nome: nomeLimpo, email: emailLimpo, senha: senhaHash },
                { autoCommit: true }
            );

            return res.status(201).json({
                mensagem: "Usuário cadastrado com sucesso!",
                usuario: { nome: nomeLimpo, email: emailLimpo, perfil: "Membro da Equipe" }
            });
        } catch (erro: any) {
            // ORA-00001: dois cadastros do mesmo e-mail ao mesmo tempo
            if (erro?.errorNum === 1) {
                return res.status(409).json({ mensagem: "Já existe um usuário com esse e-mail", campo: "email" });
            }

            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao cadastrar o usuário" });
        } finally {
            if (conn) await conn.close();
        }
    });
}