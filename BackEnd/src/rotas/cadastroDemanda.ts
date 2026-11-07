// Autor: Felipe Evangelista Cruz
import { Express, Request, Response } from "express";
import { getConn } from "../db";

// cadastra as rotas da tela de cadastro de demanda no app do servidor
export function rotasCadastroDemanda(app: Express) {

    // lista os projetos pré-cadastrados no banco
    app.get("/projetos", async (req: Request, res: Response) => {
        let conn;

        try {
            conn = await getConn();

            // as aspas nos apelidos deixam as chaves do JSON em minúsculo (id e nome)
            const result = await conn.execute(`SELECT id as "id", nome as "nome" FROM projetos ORDER BY nome`);

            return res.status(200).json(result.rows ?? []);
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao buscar os projetos" });
        } finally {
            // devolve a conexão para o pool
            if (conn) await conn.close();
        }
    });

    // cadastra uma nova demanda no banco
    app.post("/demandas", async (req: Request, res: Response) => {
        // pega os dados enviados pela tela
        const { titulo, descricao, tipo, prioridade, projetoId, responsavelId, prazo } = req.body;

        // listas com os únicos valores aceitos
        const tiposValidos = ["Tarefa", "Defeito", "Melhoria", "Documentação"];
        const prioridadesValidas = ["Crítica", "Alta", "Média", "Baixa"];

        // validar campos obrigatórios
        if (!titulo || !descricao || !tipo || !prioridade || !projetoId) {
            return res.status(400).json({ mensagem: "Título, descrição, tipo, prioridade e projeto são obrigatórios" });
        }

        // o tipo precisa ser um dos valores aceitos
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({ mensagem: "Tipo inválido. Use Tarefa, Defeito, Melhoria ou Documentação" });
        }

        // a prioridade precisa ser um dos valores aceitos
        if (!prioridadesValidas.includes(prioridade)) {
            return res.status(400).json({ mensagem: "Prioridade inválida. Use Crítica, Alta, Média ou Baixa" });
        }

        // o projeto e o responsável precisam ser números
        const idProjeto = Number(projetoId);
        const idResponsavel = responsavelId ? Number(responsavelId) : null;

        if (Number.isNaN(idProjeto)) {
            return res.status(400).json({ mensagem: "Projeto não encontrado" });
        }

        if (Number.isNaN(idResponsavel)) {
            return res.status(400).json({ mensagem: "Responsável não encontrado" });
        }

        // o prazo é opcional, mas se for informado precisa estar no formato AAAA-MM-DD e ser uma data válida
        let prazoDemanda = null;

        if (prazo) {
            const dataPrazo = new Date(prazo + "T00:00:00");
            const formatoCorreto = /^\d{4}-\d{2}-\d{2}$/.test(prazo);

            if (!formatoCorreto || Number.isNaN(dataPrazo.getTime())) {
                return res.status(400).json({ mensagem: "Prazo inválido. Use o formato AAAA-MM-DD" });
            }

            prazoDemanda = prazo;
        }

        let conn;

        try {
            conn = await getConn();

            // verifica se o projeto informado existe no banco
            const projeto = await conn.execute(`SELECT id FROM projetos WHERE id = :id`, { id: idProjeto });

            if (!projeto.rows || projeto.rows.length === 0) {
                return res.status(400).json({ mensagem: "Projeto não encontrado" });
            }

            // o responsável é opcional, mas se for informado o usuário precisa existir no banco
            if (idResponsavel !== null) {
                const responsavel = await conn.execute(`SELECT id FROM usuarios WHERE id = :id`, { id: idResponsavel });

                if (!responsavel.rows || responsavel.rows.length === 0) {
                    return res.status(400).json({ mensagem: "Responsável não encontrado" });
                }
            }

            // grava a demanda: o status e as datas são definidos aqui, mesmo que venham na requisição
            await conn.execute(
                `INSERT INTO demandas (titulo, descricao, tipo, prioridade, status, projeto_id, responsavel_id, prazo, data_criacao, data_atualizacao)
                 VALUES (:titulo, :descricao, :tipo, :prioridade, 'Aberta', :projetoId, :responsavelId, TO_DATE(:prazo, 'YYYY-MM-DD'), SYSTIMESTAMP, SYSTIMESTAMP)`,
                { titulo, descricao, tipo, prioridade, projetoId: idProjeto, responsavelId: idResponsavel, prazo: prazoDemanda },
                { autoCommit: true }
            );

            return res.status(201).json({ mensagem: "Demanda cadastrada com sucesso!" });
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao cadastrar a demanda" });
        } finally {
            // devolve a conexão para o pool
            if (conn) await conn.close();
        }
    });
}