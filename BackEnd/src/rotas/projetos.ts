// Autor: Luiz Felipe da Conceição
import { Express, Request, Response } from "express";
import oracledb, { Connection } from "oracledb";
import { getConn } from "../db";
import { buscarUsuarioLogado, UsuarioLogado } from "../autenticacao";

const PAPEL_LIDER = "Líder";
const PAPEL_MEMBRO = "Membro";

// quando algo impede a rota de continuar (sem login, projeto inexistente...)
interface Falha {
    status: number;
    mensagem: string;
}

interface ContextoProjeto {
    usuario: UsuarioLogado;
    projeto: { id: number; nome: string };
    papel: string | null;  // papel de quem pede neste projeto (null se não participa)
}

interface LinhaProjeto {
    id: number;
    nome: string;
    lider: string | null;
    totalMembros: number;
    meuPapel: string | null;
}

// só o Administrador ou o Líder do projeto adiciona e remove pessoas
function podeGerenciar(usuario: UsuarioLogado, papel: string | null): boolean {
    return usuario.perfil === "Administrador" || papel === PAPEL_LIDER;
}

// confere quem está chamando e carrega o projeto da URL (/projetos/:id/...)
async function carregarProjeto(conn: Connection, req: Request): Promise<ContextoProjeto | Falha> {
    const usuario = await buscarUsuarioLogado(conn, req);

    if (!usuario) {
        return { status: 401, mensagem: "Faça login para continuar" };
    }

    const idProjeto = Number(req.params.id);

    if (!Number.isInteger(idProjeto) || idProjeto <= 0) {
        return { status: 400, mensagem: "Projeto inválido" };
    }

    const result = await conn.execute(
        `SELECT id_projeto as "id", nome as "nome" FROM Projeto WHERE id_projeto = :id`,
        { id: idProjeto }
    );
    const projeto = result.rows?.[0] as { id: number; nome: string } | undefined;

    if (!projeto) {
        return { status: 404, mensagem: "Projeto não encontrado" };
    }

    const vinculo = await conn.execute(
        `SELECT papel as "papel" FROM participa
         WHERE id_projeto = :projetoId AND id_usuario = :usuarioId AND ativo = 1`,
        { projetoId: projeto.id, usuarioId: usuario.id }
    );
    const linha = vinculo.rows?.[0] as { papel: string } | undefined;

    return { usuario, projeto, papel: linha ? linha.papel : null };
}

// cadastra as rotas da tela de Projetos no app do servidor
export function rotasProjetos(app: Express) {

    // lista os projetos de quem está logado (o Administrador vê todos)
    app.get("/projetos/resumo", async (req: Request, res: Response) => {
        let conn;

        try {
            conn = await getConn();

            const usuario = await buscarUsuarioLogado(conn, req);

            if (!usuario) {
                return res.status(401).json({ mensagem: "Faça login para ver os projetos" });
            }

            // os outros perfis só veem os projetos em que participam
            let filtro = "";

            if (usuario.perfil !== "Administrador") {
                filtro = `WHERE EXISTS (SELECT 1 FROM participa v
                                        WHERE v.id_projeto = p.id_projeto AND v.id_usuario = :usuarioId AND v.ativo = 1)`;
            }

            const result = await conn.execute(
                `SELECT p.id_projeto as "id", p.nome as "nome",
                        (SELECT u.nome FROM participa l JOIN Usuario u ON u.id_usuario = l.id_usuario
                         WHERE l.id_projeto = p.id_projeto AND l.papel = :papelLider AND l.ativo = 1 AND ROWNUM = 1) as "lider",
                        (SELECT COUNT(*) FROM participa m
                         WHERE m.id_projeto = p.id_projeto AND m.ativo = 1) as "totalMembros",
                        (SELECT e.papel FROM participa e
                         WHERE e.id_projeto = p.id_projeto AND e.id_usuario = :usuarioId AND e.ativo = 1) as "meuPapel"
                 FROM Projeto p
                 ${filtro}
                 ORDER BY p.nome`,
                { usuarioId: usuario.id, papelLider: PAPEL_LIDER }
            );

            const projetos = ((result.rows ?? []) as LinhaProjeto[]).map((linha) => ({
                ...linha,
                podeGerenciar: podeGerenciar(usuario, linha.meuPapel)
            }));

            return res.status(200).json(projetos);
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao listar os projetos" });
        } finally {
            if (conn) await conn.close();
        }
    });

    // cria um projeto: quem cria vira o Líder dele
    app.post("/projetos", async (req: Request, res: Response) => {
        const { nome } = req.body ?? {};

        if (!nome) {
            return res.status(400).json({ mensagem: "O nome do projeto é obrigatório", campo: "nome" });
        }

        const nomeLimpo = String(nome).trim();

        if (nomeLimpo.length < 3 || nomeLimpo.length > 100) {
            return res.status(400).json({ mensagem: "O nome do projeto deve ter de 3 a 100 caracteres", campo: "nome" });
        }

        let conn;

        try {
            conn = await getConn();

            const usuario = await buscarUsuarioLogado(conn, req);

            if (!usuario) {
                return res.status(401).json({ mensagem: "Faça login para criar um projeto" });
            }

            // o nome não pode se repetir (sem diferenciar maiúsculas)
            const existente = await conn.execute(
                `SELECT id_projeto FROM Projeto WHERE LOWER(nome) = :nome`,
                { nome: nomeLimpo.toLowerCase() }
            );

            if (existente.rows && existente.rows.length > 0) {
                return res.status(409).json({ mensagem: "Já existe um projeto com esse nome", campo: "nome" });
            }

            // projeto e vínculo do Líder entram juntos: se um falhar, nenhum fica
            const insercao = await conn.execute(
                `INSERT INTO Projeto (nome) VALUES (:nome) RETURNING id_projeto INTO :id`,
                { nome: nomeLimpo, id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }
            );
            const idProjeto = (insercao.outBinds as { id: number[] }).id[0];

            await conn.execute(
                `INSERT INTO participa (id_projeto, id_usuario, papel) VALUES (:projetoId, :usuarioId, :papel)`,
                { projetoId: idProjeto, usuarioId: usuario.id, papel: PAPEL_LIDER }
            );

            // se quem criou não é o Administrador, o Administrador entra no projeto como Membro
            if (usuario.perfil !== "Administrador") {
                await conn.execute(
                    `INSERT INTO participa (id_projeto, id_usuario, papel)
                     SELECT :projetoId, id_usuario, :papel FROM Usuario WHERE perfil = 'Administrador'`,
                    { projetoId: idProjeto, papel: PAPEL_MEMBRO }
                );
            }

            await conn.commit();

            return res.status(201).json({
                mensagem: "Projeto criado com sucesso",
                projeto: { id: idProjeto, nome: nomeLimpo }
            });
        } catch (erro) {
            console.error(erro);
            if (conn) await conn.rollback();
            return res.status(500).json({ mensagem: "Erro ao criar o projeto" });
        } finally {
            if (conn) await conn.close();
        }
    });

    // lista as pessoas do projeto
    app.get("/projetos/:id/membros", async (req: Request, res: Response) => {
        let conn;

        try {
            conn = await getConn();

            const contexto = await carregarProjeto(conn, req);

            if ("status" in contexto) {
                return res.status(contexto.status).json({ mensagem: contexto.mensagem });
            }

            if (contexto.usuario.perfil !== "Administrador" && !contexto.papel) {
                return res.status(403).json({ mensagem: "Você não participa deste projeto" });
            }

            // ordem alfabética do papel: Líder aparece antes de Membro
            const result = await conn.execute(
                `SELECT u.id_usuario as "usuarioId", u.nome as "nome", u.email as "email", v.papel as "papel"
                 FROM participa v JOIN Usuario u ON u.id_usuario = v.id_usuario
                 WHERE v.id_projeto = :projetoId AND v.ativo = 1
                 ORDER BY v.papel, u.nome`,
                { projetoId: contexto.projeto.id }
            );

            return res.status(200).json({
                projeto: contexto.projeto,
                podeGerenciar: podeGerenciar(contexto.usuario, contexto.papel),
                membros: result.rows ?? []
            });
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao listar os membros" });
        } finally {
            if (conn) await conn.close();
        }
    });

    // lista quem ainda pode ser adicionado ao projeto (só nome e e-mail)
    app.get("/projetos/:id/candidatos", async (req: Request, res: Response) => {
        let conn;

        try {
            conn = await getConn();

            const contexto = await carregarProjeto(conn, req);

            if ("status" in contexto) {
                return res.status(contexto.status).json({ mensagem: contexto.mensagem });
            }

            if (!podeGerenciar(contexto.usuario, contexto.papel)) {
                return res.status(403).json({ mensagem: "Só o Administrador ou o líder do projeto pode adicionar pessoas" });
            }

            const result = await conn.execute(
                `SELECT u.id_usuario as "id", u.nome as "nome", u.email as "email"
                 FROM Usuario u
                 WHERE NOT EXISTS (SELECT 1 FROM participa v
                                   WHERE v.id_projeto = :projetoId AND v.id_usuario = u.id_usuario AND v.ativo = 1)
                 ORDER BY u.nome`,
                { projetoId: contexto.projeto.id }
            );

            return res.status(200).json(result.rows ?? []);
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao listar as pessoas" });
        } finally {
            if (conn) await conn.close();
        }
    });

    // o líder (ou o Administrador) adiciona uma ou várias pessoas ao projeto como Membro
    app.post("/projetos/:id/membros", async (req: Request, res: Response) => {
        const { usuariosIds } = req.body ?? {};

        // precisa ser uma lista com pelo menos uma pessoa
        if (!Array.isArray(usuariosIds) || usuariosIds.length === 0) {
            return res.status(400).json({ mensagem: "Marque pelo menos uma pessoa para adicionar", campo: "usuariosIds" });
        }

        // só números inteiros, sem repetir
        const ids: number[] = Array.from(new Set(usuariosIds.map(Number)));

        if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
            return res.status(400).json({ mensagem: "Lista de pessoas inválida", campo: "usuariosIds" });
        }

        let conn;

        try {
            conn = await getConn();

            const contexto = await carregarProjeto(conn, req);

            if ("status" in contexto) {
                return res.status(contexto.status).json({ mensagem: contexto.mensagem });
            }

            if (!podeGerenciar(contexto.usuario, contexto.papel)) {
                return res.status(403).json({ mensagem: "Só o Administrador ou o líder do projeto pode adicionar pessoas" });
            }

            // confere todas as pessoas antes de gravar qualquer uma (entram todas ou nenhuma)
            const paraReativar: number[] = [];
            const paraInserir: number[] = [];

            for (const idUsuario of ids) {
                const usuario = await conn.execute(`SELECT id_usuario FROM Usuario WHERE id_usuario = :id`, { id: idUsuario });

                if (!usuario.rows || usuario.rows.length === 0) {
                    return res.status(404).json({ mensagem: "Uma das pessoas escolhidas não foi encontrada", campo: "usuariosIds" });
                }

                const vinculo = await conn.execute(
                    `SELECT ativo as "ativo" FROM participa WHERE id_projeto = :projetoId AND id_usuario = :usuarioId`,
                    { projetoId: contexto.projeto.id, usuarioId: idUsuario }
                );
                const existente = vinculo.rows?.[0] as { ativo: number } | undefined;

                if (existente && existente.ativo === 1) {
                    return res.status(409).json({ mensagem: "Uma das pessoas escolhidas já participa do projeto", campo: "usuariosIds" });
                }

                if (existente) {
                    // já participou antes: só volta a ficar ativa
                    paraReativar.push(idUsuario);
                } else {
                    paraInserir.push(idUsuario);
                }
            }

            for (const idUsuario of paraReativar) {
                await conn.execute(
                    `UPDATE participa SET ativo = 1 WHERE id_projeto = :projetoId AND id_usuario = :usuarioId`,
                    { projetoId: contexto.projeto.id, usuarioId: idUsuario }
                );
            }

            for (const idUsuario of paraInserir) {
                await conn.execute(
                    `INSERT INTO participa (id_projeto, id_usuario, papel) VALUES (:projetoId, :usuarioId, :papel)`,
                    { projetoId: contexto.projeto.id, usuarioId: idUsuario, papel: PAPEL_MEMBRO }
                );
            }

            await conn.commit();

            const mensagem = ids.length === 1 ? "Pessoa adicionada ao projeto" : `${ids.length} pessoas adicionadas ao projeto`;

            return res.status(201).json({ mensagem });
        } catch (erro) {
            console.error(erro);
            if (conn) await conn.rollback();
            return res.status(500).json({ mensagem: "Erro ao adicionar as pessoas" });
        } finally {
            if (conn) await conn.close();
        }
    });

    // tira uma pessoa do projeto sem apagar o registro (ativo passa para 0)
    app.patch("/projetos/:id/membros/:usuarioId/remover", async (req: Request, res: Response) => {
        const idUsuario = Number(req.params.usuarioId);

        let conn;

        try {
            conn = await getConn();

            const contexto = await carregarProjeto(conn, req);

            if ("status" in contexto) {
                return res.status(contexto.status).json({ mensagem: contexto.mensagem });
            }

            if (!podeGerenciar(contexto.usuario, contexto.papel)) {
                return res.status(403).json({ mensagem: "Só o Administrador ou o líder do projeto pode remover pessoas" });
            }

            const vinculo = await conn.execute(
                `SELECT papel as "papel" FROM participa
                 WHERE id_projeto = :projetoId AND id_usuario = :usuarioId AND ativo = 1`,
                { projetoId: contexto.projeto.id, usuarioId: idUsuario }
            );
            const existente = vinculo.rows?.[0] as { papel: string } | undefined;

            if (!existente) {
                return res.status(404).json({ mensagem: "Essa pessoa não participa do projeto" });
            }

            if (existente.papel === PAPEL_LIDER) {
                return res.status(400).json({ mensagem: "O líder não pode ser removido do projeto" });
            }

            // o Administrador nunca pode ser removido de um projeto
            const alvo = await conn.execute(
                `SELECT perfil as "perfil" FROM Usuario WHERE id_usuario = :id`,
                { id: idUsuario }
            );
            const usuarioAlvo = alvo.rows?.[0] as { perfil: string } | undefined;

            if (usuarioAlvo && usuarioAlvo.perfil === "Administrador") {
                return res.status(400).json({ mensagem: "O Administrador não pode ser removido do projeto" });
            }

            await conn.execute(
                `UPDATE participa SET ativo = 0 WHERE id_projeto = :projetoId AND id_usuario = :usuarioId`,
                { projetoId: contexto.projeto.id, usuarioId: idUsuario },
                { autoCommit: true }
            );

            return res.status(200).json({ mensagem: "Pessoa removida do projeto" });
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao remover a pessoa" });
        } finally {
            if (conn) await conn.close();
        }
    });
}
