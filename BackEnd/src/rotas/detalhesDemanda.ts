// Autor: Augusto Henrique Marçura

import { Express } from "express";
import { rotasEdicaoReal } from "./edicaoReal";
import { getConn } from "../db";
import { buscarUsuarioLogado } from "../autenticacao";
import { podeFazer } from "../permissoes";
import { demandasTeste, comentarioTeste, usuariosTeste } from "../dados/dadosTeste";

// Aceita apenas identificadores inteiros positivos.
function lerId(valor: string): number | null {
    if (!/^\d+$/.test(valor)) return null;
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

// Busca as alterações registradas para uma demanda
 export async function buscarHistorico(demandaId: number){
    const conexao = await getConn();

    try{
        const resultado = await conexao.execute(
    `SELECT h.tipo_alteracao AS "campo",
            h.valor_anterior AS "valorAnterior",
            h.valor_novo AS "valorNovo",
            h.data_hora AS "dataAlteracao",
            u.nome AS "autor"
    FROM historico_demanda h
    JOIN usuario u ON u.id_usuario = h.idusuario
    WHERE h.iddemanda = :demandaId
    ORDER BY h.data_hora, h.id_historico`,
                { demandaId }
        );

        return resultado.rows || [];
    } finally {
        await conexao.close();
    }
}

//Reúne as rotas responsáveis pelos detalhes da demanda
export function rotasDetalhesDemanda(app: Express) {
    rotasEdicaoReal(app);

    // Reunião 4: busca uma demanda pelo identificador.
    app.get("/demandas/:id", async (req, res) => {
        const id = lerId(req.params.id);

        if (id === null) {
            return res.status(400).json({ mensagem: "ID inválido"});
        }

        // No modo de teste, procura a demanda no array em memória
        if (process.env.DADOS_EM_MEMORIA === "true") {
            const demanda = demandasTeste.find(item => item.id === id);

            if (!demanda) {
                return res.status(404).json({
                    mensagem: "Demanda não encontrada"
                });
            }
            return res.status(200).json(demanda);
        }

        // A consulta ao Oracle foi preparada, mas depende do esquema e da integração da equipe.
        let conn;

        try {
            conn = await getConn();

            const resultado = await conn.execute(
        `SELECT id_demanda AS "id",
                titulo AS "titulo",
                descricao AS "descricao",
                tipo AS "tipo",
                prioridade AS "prioridade",
                status AS "status",
                idprojeto AS "projetoId",
                idusuario AS "responsavelId",
                prazo AS "prazo",
                data_criacao AS "dataCriacao",
                data_atualizacao AS "dataAtualizacao"
        FROM demanda
        WHERE id_demanda = :id`,
            { id }
            );

            if (!resultado.rows || resultado.rows.length === 0) {
                return res.status(404).json({ mensagem: "Demanda não encontrada" });
            }

            return res.status(200).json(resultado.rows[0]);
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao buscar a demanda "});
        } finally {
            if (conn) await conn.close();
        }
    });

    // Reunião 4: lista os comentários da demanda.
    app.get("/demandas/:id/comentarios", async (req, res) => {
        const id = lerId(req.params.id);

        if (id === null) {
            return res.status(400).json({ mensagem: "ID inválido"});
        }

        if (process.env.DADOS_EM_MEMORIA !== "true") {
            let conn;

            try {
                conn = await getConn();

                const demanda = await conn.execute(
                    `SELECT id_demanda FROM demanda WHERE id_demanda = :id`,
                    { id }
                );

                if (!demanda.rows || demanda.rows.length === 0) {
                    return res.status(404).json({
                        mensagem: "Demanda não encontrada"
                    });
                }

                const resultado = await conn.execute(
            `SELECT c.id_comentario AS "id",
                    c.iddemanda AS "demandaId",
                    c.idusuario AS "usuarioId",
                    u.nome AS "autor",
                    c.texto AS "texto",
                    c.data_criacao AS "dataHora"
            FROM comentario c
            JOIN usuario u ON u.id_usuario = c.idusuario
            WHERE c.iddemanda = :id
            ORDER BY c.data_criacao, c.id_comentario`,
                        { id }
                );

                return res.status(200).json(resultado.rows ?? []);
            } catch (erro) {
                console.error(erro);
                return res.status(500).json({
                    mensagem: "Erro ao buscar comentários"
                });
            } finally {
                if (conn) await conn.close();
            }
        }

        const demanda = demandasTeste.find(item => item.id === id);

        if (!demanda) {
            return res.status(404).json({ mensagem: "Demanda não encontrada"});
        }

        // Filtra pela demanda e acrescenta o nome do usuário de teste a cada comentário.
        const comentarios = comentarioTeste
            .filter(item => item.demandaId === id)
            .map(item => ({
                ...item,
                autor: usuariosTeste.find(usuario => usuario.id === item.usuarioId)?.nome ?? "Usuário não encontrado"
            }));
        return res.status(200).json(comentarios);
    })

    // Reunião 4: registra um comentário vinculado à demanda.
    app.post("/demandas/:id/comentarios", async (req, res) => {
        const demandaId = lerId(req.params.id);
        const { usuarioId, texto } = req.body ?? {};

        if (demandaId === null) {
            return res.status(400).json({ mensagem: "ID da demanda inválido." });
        }

        if (process.env.DADOS_EM_MEMORIA !== "true") {
    if (typeof texto !== "string" || !texto.trim()) {
        return res.status(400).json({
            mensagem: "O comentário não pode estar vazio."
        });
    }

    const textoLimpo = texto.trim();

    if (Buffer.byteLength(textoLimpo, "utf8") > 1000) {
        return res.status(400).json({
            mensagem: "O comentário é muito longo."
        });
    }

    let conn;

    try {
        conn = await getConn();

        const usuario = await buscarUsuarioLogado(conn, req);
        if (!usuario) {
            return res.status(401).json({ mensagem: "Faça login para comentar." });
        }
        if (!podeFazer(usuario.perfil, "comentar")) {
            return res.status(403).json({ mensagem: "Você não tem permissão para comentar." });
        }

        const demanda = await conn.execute(
            `SELECT idprojeto AS "projetoId" FROM demanda WHERE id_demanda = :id`,
            { id: demandaId }
        );

        if (!demanda.rows || demanda.rows.length === 0) {
            return res.status(404).json({
                mensagem: "Demanda não encontrada."
            });
        }

        if (usuario.perfil !== "Administrador") {
            const projetoId = (demanda.rows[0] as { projetoId: number }).projetoId;
            const vinculo = await conn.execute(
                `SELECT 1 FROM participa
                 WHERE id_projeto = :projetoId AND id_usuario = :usuarioId AND ativo = 1`,
                { projetoId, usuarioId: usuario.id }
            );
            if (!vinculo.rows || vinculo.rows.length === 0) {
                return res.status(403).json({ mensagem: "Você não participa do projeto desta demanda." });
            }
        }

        await conn.execute(
            `INSERT INTO comentario (iddemanda, idusuario, texto)
             VALUES (:demandaId, :usuarioId, :texto)`,
            { demandaId, usuarioId: usuario.id, texto: textoLimpo },
            { autoCommit: true }
        );

        return res.status(201).json({
            mensagem: "Comentário criado com sucesso."
        });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({
            mensagem: "Erro ao criar comentário."
        });
    } finally {
        if (conn) await conn.close();
    }
}

        const demanda = demandasTeste.find(item => item.id === demandaId);

        if (!demanda) {
            return res.status(404).json({ mensagem: "Demanda não encontrada." });
        }

        if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
            return res.status(400).json({ mensagem: "Usuário inválido." });
        }

        const usuario = usuariosTeste.find(item => item.id === usuarioId);

        if (!usuario) {
            return res.status(400).json({ mensagem: "Usuário não encontrado." });
        }

        if (typeof texto !== "string" || !texto.trim()) {
            return res.status(400).json({ mensagem: "O comentário não pode estar vazio." });
        }

        // A data é definida pelo servidor; o comentário fica apenas na memória do processo.
        const comentario = {
            demandaId,
            usuarioId,
            texto: texto.trim(),
            dataHora: new Date().toISOString()
        };

        comentarioTeste.push(comentario);
        return res.status(201).json({ ...comentario, autor: usuario.nome });
    });

}
