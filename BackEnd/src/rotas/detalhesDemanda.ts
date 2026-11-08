// Autor: Augusto Henrique Marçura

import { Express } from "express";
import { getConn } from "../db";
import { demandasTeste, comentarioTeste, usuariosTeste } from "../dados/dadosTeste";

//Reúne as rotas responsáveis pelos detalhes da demanda
export function rotasDetalhesDemanda(app: Express) {

    // Busca uma demanda pelo identificador
    app.get("/demandas/:id", async (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
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

        let conn;

        try {
            conn = await getConn();

            const resultado = await conn.execute(
                `SELECT id, titulo, descricao, tipo, prioridade, status,
                 projeto_id, responsavel_id, prazo, data_criacao,
                data_atualizacao
                FROM demandas
                WHERE id = :id`,
                {id}
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

    // Lista os comentários de uma demanda no modo de teste
    app.get("/demandas/:id/comentarios", (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ mensagem: "ID inválido"});
        }

        if (process.env.DADOS_EM_MEMORIA !== "true") {
            return res.status(503).json({
                mensagem: "Consulta de comentários no banco ainda não implementados"
            });
        }

        const demanda = demandasTeste.find(item => item.id === id);

        if (!demanda) {
            return res.status(404).json({ mensagem: "Demanda não encontrada"});
        }

        const comentarios = comentarioTeste
            .filter(item => item.demandaId === id)
            .map(item => ({
                ...item,
                autor: usuariosTeste.find(usuario => usuario.id === item.usuarioId)?.nome ?? "Usuário não encontrado"
            }));
        return res.status(200).json(comentarios);
    })

   // Registra um comentário em memória para testes.
    app.post("/demandas/:id/comentarios", (req, res) => {
        const demandaId = Number(req.params.id);
        const { usuarioId, texto } = req.body ?? {};

        if (!Number.isSafeInteger(demandaId) || demandaId <= 0) {
            return res.status(400).json({ mensagem: "ID da demanda inválido." });
        }

        if (process.env.DADOS_EM_MEMORIA !== "true") {
            return res.status(503).json({
                mensagem: "Registro de comentários no banco ainda não implementado."
            });
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
