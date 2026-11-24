// Autor: Augusto Henrique Marçura. Edição e histórico no servidor da equipe.
import { Express } from "express";
import { Connection } from "oracledb";
import { getConn } from "../db";
import { buscarUsuarioLogado } from "../autenticacao";
import { ehPerfilValido, ehStatusValido, podeFazer, validarTransicao, Status } from "../permissoes";
import { buscarFeriadoNacional } from "../feriados";
import { DemandaEditavel, ErroEdicao, prepararEdicao } from "../edicao/regrasEdicao";

async function participa(conn: Connection, projetoId: number, usuarioId: number): Promise<boolean> {
    const resultado = await conn.execute(
        "SELECT 1 FROM participa WHERE id_projeto = :projetoId AND id_usuario = :usuarioId AND ativo = 1",
        { projetoId, usuarioId }
    );
    return !!resultado.rows && resultado.rows.length > 0;
}

export function rotasEdicaoReal(app: Express) {
    // Atualiza somente o status; membros não podem alterar os demais campos.
    app.patch("/demandas/:id/status", async (req, res) => {
        const id = Number(req.params.id);
        const novoStatus = req.body && req.body.status;
        if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ mensagem: "ID inválido." });
        }
        if (typeof novoStatus !== "string" || !ehStatusValido(novoStatus)) {
            return res.status(400).json({ mensagem: "Status inválido." });
        }
        let conn;
        try {
            conn = await getConn();
            const usuario = await buscarUsuarioLogado(conn, req);
            if (!usuario) return res.status(401).json({ mensagem: "Faça login para alterar o status." });
            if (!ehPerfilValido(usuario.perfil)) return res.status(403).json({ mensagem: "Perfil inválido." });
            const resultado = await conn.execute(
                `SELECT idprojeto AS "projetoId", idusuario AS "responsavelId", status AS "status"
                 FROM demanda WHERE id_demanda = :id FOR UPDATE`, { id }
            );
            if (!resultado.rows || resultado.rows.length === 0) return res.status(404).json({ mensagem: "Demanda não encontrada." });
            const demanda = resultado.rows[0] as { projetoId: number; responsavelId: number | null; status: Status };
            if (!ehStatusValido(demanda.status)) return res.status(400).json({ mensagem: "Status atual inválido." });
            const vinculado = usuario.perfil === "Administrador" || await participa(conn, demanda.projetoId, usuario.id);
            if (!vinculado) return res.status(403).json({ mensagem: "Você não participa deste projeto." });
            const regra = validarTransicao(usuario.perfil, demanda.status, novoStatus as Status, {
                vinculadoAoProjeto: vinculado,
                atribuidaAoUsuario: demanda.responsavelId === usuario.id
            });
            if (!regra.permitido) return res.status(403).json({ mensagem: regra.motivo });
            await conn.execute('UPDATE demanda SET status = :status, data_atualizacao = SYSTIMESTAMP WHERE id_demanda = :id', { status: novoStatus, id });
            await conn.execute(
                `INSERT INTO historico_demanda (idusuario, iddemanda, tipo_alteracao, valor_anterior, valor_novo)
                 VALUES (:usuarioId, :demandaId, 'status', :anterior, :novo)`,
                { usuarioId: usuario.id, demandaId: id, anterior: demanda.status, novo: novoStatus }
            );
            await conn.commit();
            return res.status(200).json({ mensagem: "Status atualizado com sucesso." });
        } catch (erro) {
            if (conn) await conn.rollback();
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao atualizar o status." });
        } finally {
            if (conn) await conn.close();
        }
    });
    app.get("/demandas/:id/historico", async (req, res) => {
        const id = Number(req.params.id);
        if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ mensagem: "ID inválido." });
        }
        let conn;
        try {
            conn = await getConn();
            const usuario = await buscarUsuarioLogado(conn, req);
            if (!usuario) return res.status(401).json({ mensagem: "Faça login para ver o histórico." });
            if (!ehPerfilValido(usuario.perfil) || !podeFazer(usuario.perfil, "ver_historico")) {
                return res.status(403).json({ mensagem: "Você não tem permissão para ver o histórico." });
            }
            const resultado = await conn.execute('SELECT idprojeto AS "projetoId" FROM demanda WHERE id_demanda = :id', { id });
            if (!resultado.rows || resultado.rows.length === 0) return res.status(404).json({ mensagem: "Demanda não encontrada." });
            const demanda = resultado.rows[0] as { projetoId: number };
            if (usuario.perfil !== "Administrador" && !(await participa(conn, demanda.projetoId, usuario.id))) {
                return res.status(403).json({ mensagem: "Você não participa deste projeto." });
            }
            const historico = await conn.execute(
                `SELECT h.tipo_alteracao AS "campo", h.valor_anterior AS "valorAnterior", h.valor_novo AS "valorNovo",
                        h.data_hora AS "dataAlteracao", u.nome AS "autor"
                 FROM historico_demanda h JOIN usuario u ON u.id_usuario = h.idusuario
                 WHERE h.iddemanda = :id ORDER BY h.data_hora, h.id_historico`, { id }
            );
            return res.status(200).json(historico.rows || []);
        } catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao buscar histórico." });
        } finally {
            if (conn) await conn.close();
        }
    });

    app.put("/demandas/:id", async (req, res) => {
        const id = Number(req.params.id);
        if (!/^\d+$/.test(req.params.id) || !Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({ mensagem: "ID inválido." });
        }
        let conn;
        try {
            conn = await getConn();
            const usuario = await buscarUsuarioLogado(conn, req);
            if (!usuario) return res.status(401).json({ mensagem: "Faça login para editar." });
            if (!ehPerfilValido(usuario.perfil) || !podeFazer(usuario.perfil, "editar_demanda")) {
                return res.status(403).json({ mensagem: "Você não tem permissão para editar demandas." });
            }
            const resultado = await conn.execute(
                `SELECT titulo AS "titulo", descricao AS "descricao", tipo AS "tipo", prioridade AS "prioridade",
                        idprojeto AS "projetoId", idusuario AS "responsavelId", TO_CHAR(prazo, 'YYYY-MM-DD') AS "prazo", status AS "status"
                 FROM demanda WHERE id_demanda = :id FOR UPDATE`, { id }
            );
            if (!resultado.rows || resultado.rows.length === 0) return res.status(404).json({ mensagem: "Demanda não encontrada." });
            const atual = resultado.rows[0] as DemandaEditavel;
            const vinculado = usuario.perfil === "Administrador" || await participa(conn, atual.projetoId, usuario.id);
            if (!vinculado) return res.status(403).json({ mensagem: "Você não participa deste projeto." });
            const entrada = req.body as DemandaEditavel;
            const preparado = await prepararEdicao(atual, entrada, usuario.id, {
                projetoExiste: async function (projetoId) {
                    const r = await conn!.execute('SELECT id_projeto FROM projeto WHERE id_projeto = :id', { id: projetoId });
                    return !!r.rows && r.rows.length > 0;
                },
                usuarioExiste: async function (usuarioId) {
                    const r = await conn!.execute('SELECT id_usuario FROM usuario WHERE id_usuario = :id', { id: usuarioId });
                    return !!r.rows && r.rows.length > 0;
                },
                feriadoNacional: buscarFeriadoNacional
            });
            if (usuario.perfil !== "Administrador" && preparado.demanda.projetoId !== atual.projetoId &&
                !(await participa(conn, preparado.demanda.projetoId, usuario.id))) {
                return res.status(403).json({ mensagem: "Você não participa do projeto escolhido." });
            }
            if (atual.status !== preparado.demanda.status) {
                const transicao = validarTransicao(usuario.perfil, atual.status as Status, preparado.demanda.status as Status, { vinculadoAoProjeto: vinculado });
                if (!transicao.permitido) return res.status(403).json({ mensagem: transicao.motivo });
            }
            // O histórico guarda o texto inteiro, incluindo caracteres acentuados.
            for (const alteracao of preparado.historico) {
                const anterior = alteracao.anterior === null ? "" : String(alteracao.anterior);
                const novo = alteracao.novo === null ? "" : String(alteracao.novo);
                if (Buffer.byteLength(anterior, "utf8") > 2000 || Buffer.byteLength(novo, "utf8") > 2000) {
                    return res.status(400).json({ mensagem: "A alteração é longa demais para o histórico do banco." });
                }
            }
            if (preparado.historico.length === 0) return res.status(200).json({ mensagem: "Nenhum dado foi alterado.", alterada: false });
            const d = preparado.demanda;
            await conn.execute(
                `UPDATE demanda SET titulo = :titulo, descricao = :descricao, tipo = :tipo, prioridade = :prioridade,
                 idprojeto = :projetoId, idusuario = :responsavelId, prazo = TO_DATE(:prazo, 'YYYY-MM-DD'),
                 status = :status, data_atualizacao = SYSTIMESTAMP WHERE id_demanda = :id`,
                { titulo: d.titulo, descricao: d.descricao, tipo: d.tipo, prioridade: d.prioridade,
                  projetoId: d.projetoId, responsavelId: d.responsavelId, prazo: d.prazo, status: d.status, id: id }
            );
            for (const alteracao of preparado.historico) {
                await conn.execute(
                    `INSERT INTO historico_demanda (idusuario, iddemanda, tipo_alteracao, valor_anterior, valor_novo)
                     VALUES (:usuarioId, :demandaId, :campo, :anterior, :novo)`,
                    { usuarioId: usuario.id, demandaId: id, campo: alteracao.campo,
                      anterior: alteracao.anterior === null ? null : String(alteracao.anterior),
                      novo: alteracao.novo === null ? null : String(alteracao.novo) }
                );
            }
            await conn.commit();
            return res.status(200).json({ mensagem: "Demanda atualizada com sucesso.", alterada: true });
        } catch (erro) {
            if (conn) await conn.rollback();
            if (erro instanceof ErroEdicao) return res.status(erro.status).json({ mensagem: erro.message });
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao editar a demanda." });
        } finally {
            if (conn) await conn.close();
        }
    });
}
