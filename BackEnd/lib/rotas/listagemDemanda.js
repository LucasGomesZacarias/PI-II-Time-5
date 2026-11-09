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
Object.defineProperty(exports, "__esModule", { value: true });
exports.rotasListagemDemanda = rotasListagemDemanda;
const db_1 = require("../db");
// cadastra a rota da tela de listagem de demandas no app do servidor
function rotasListagemDemanda(app) {
    // lista as demandas com filtros, busca textual e ordenação
    // exemplo: /demandas?status=Aberta&prioridade=Alta&busca=prazo&ordenarPor=prazo&direcao=asc
    app.get("/demandas", (req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        // pega os parâmetros enviados na URL
        const { status, prioridade, tipo, responsavelId, projetoId, busca, ordenarPor, direcao } = req.query;
        // listas com os únicos valores aceitos
        const statusValidos = ["Aberta", "Em andamento", "Concluída"];
        const prioridadesValidas = ["Crítica", "Alta", "Média", "Baixa"];
        const tiposValidos = ["Tarefa", "Defeito", "Melhoria", "Documentação"];
        // colunas permitidas na ordenação (lista fixa para evitar SQL injection)
        // prioridade e status são ordenados pela importância, não em ordem alfabética
        const colunasOrdenacao = {
            prioridade: `CASE d.prioridade WHEN 'Crítica' THEN 1 WHEN 'Alta' THEN 2 WHEN 'Média' THEN 3 WHEN 'Baixa' THEN 4 ELSE 5 END`,
            dataCriacao: `d.data_criacao`,
            prazo: `d.prazo`,
            status: `CASE d.status WHEN 'Aberta' THEN 1 WHEN 'Em andamento' THEN 2 WHEN 'Concluída' THEN 3 ELSE 4 END`
        };
        // validar os filtros (cada um é opcional, mas se vier precisa ser válido)
        if (status !== undefined && !statusValidos.includes(String(status))) {
            return res.status(400).json({ mensagem: "Status inválido. Use Aberta, Em andamento ou Concluída" });
        }
        if (prioridade !== undefined && !prioridadesValidas.includes(String(prioridade))) {
            return res.status(400).json({ mensagem: "Prioridade inválida. Use Crítica, Alta, Média ou Baixa" });
        }
        if (tipo !== undefined && !tiposValidos.includes(String(tipo))) {
            return res.status(400).json({ mensagem: "Tipo inválido. Use Tarefa, Defeito, Melhoria ou Documentação" });
        }
        // o projeto e o responsável precisam ser números
        const idProjeto = projetoId !== undefined ? Number(projetoId) : null;
        const idResponsavel = responsavelId !== undefined ? Number(responsavelId) : null;
        if (idProjeto !== null && Number.isNaN(idProjeto)) {
            return res.status(400).json({ mensagem: "Projeto inválido. Informe o id numérico do projeto" });
        }
        if (idResponsavel !== null && Number.isNaN(idResponsavel)) {
            return res.status(400).json({ mensagem: "Responsável inválido. Informe o id numérico do responsável" });
        }
        // a ordenação precisa ser uma das colunas permitidas
        const campoOrdenacao = ordenarPor !== undefined ? String(ordenarPor) : "dataCriacao";
        if (!colunasOrdenacao[campoOrdenacao]) {
            return res.status(400).json({ mensagem: "Ordenação inválida. Use prioridade, dataCriacao, prazo ou status" });
        }
        // a direção precisa ser asc ou desc (padrão: mais recentes primeiro)
        const direcaoTexto = direcao !== undefined ? String(direcao).toLowerCase() : "desc";
        if (direcaoTexto !== "asc" && direcaoTexto !== "desc") {
            return res.status(400).json({ mensagem: "Direção inválida. Use asc ou desc" });
        }
        let conn;
        try {
            conn = yield (0, db_1.getConn)();
            // se filtrou por projeto, ele precisa existir no banco
            if (idProjeto !== null) {
                const projeto = yield conn.execute(`SELECT id FROM projetos WHERE id = :id`, { id: idProjeto });
                if (!projeto.rows || projeto.rows.length === 0) {
                    return res.status(404).json({ mensagem: "Projeto não encontrado" });
                }
            }
            // se filtrou por responsável, o usuário precisa existir no banco
            if (idResponsavel !== null) {
                const responsavel = yield conn.execute(`SELECT id FROM usuarios WHERE id = :id`, { id: idResponsavel });
                if (!responsavel.rows || responsavel.rows.length === 0) {
                    return res.status(404).json({ mensagem: "Responsável não encontrado" });
                }
            }
            // monta o WHERE só com os filtros que vieram na URL
            const condicoes = [];
            const binds = {};
            if (status !== undefined) {
                condicoes.push(`d.status = :status`);
                binds.status = String(status);
            }
            if (prioridade !== undefined) {
                condicoes.push(`d.prioridade = :prioridade`);
                binds.prioridade = String(prioridade);
            }
            if (tipo !== undefined) {
                condicoes.push(`d.tipo = :tipo`);
                binds.tipo = String(tipo);
            }
            if (idProjeto !== null) {
                condicoes.push(`d.projeto_id = :projetoId`);
                binds.projetoId = idProjeto;
            }
            if (idResponsavel !== null) {
                condicoes.push(`d.responsavel_id = :responsavelId`);
                binds.responsavelId = idResponsavel;
            }
            // busca textual no título ou na descrição (sem diferenciar maiúsculas de minúsculas)
            if (busca !== undefined && String(busca).trim() !== "") {
                condicoes.push(`(UPPER(d.titulo) LIKE :busca OR UPPER(d.descricao) LIKE :busca)`);
                binds.busca = "%" + String(busca).trim().toUpperCase() + "%";
            }
            const where = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";
            // o prazo pode ser nulo, então fica por último; o id desempata para a ordem ser estável
            const ordem = `ORDER BY ${colunasOrdenacao[campoOrdenacao]} ${direcaoTexto.toUpperCase()} NULLS LAST, d.id DESC`;
            // as aspas nos apelidos deixam as chaves do JSON em minúsculo/camelCase
            const result = yield conn.execute(`SELECT d.id AS "id",
                        d.titulo AS "titulo",
                        d.tipo AS "tipo",
                        d.prioridade AS "prioridade",
                        d.status AS "status",
                        p.nome AS "projeto",
                        u.nome AS "responsavel",
                        TO_CHAR(d.data_criacao, 'DD/MM/YYYY') AS "dataCriacao",
                        TO_CHAR(d.prazo, 'DD/MM/YYYY') AS "prazo"
                   FROM demandas d
                   JOIN projetos p ON p.id = d.projeto_id
                   LEFT JOIN usuarios u ON u.id = d.responsavel_id
                   ${where}
                   ${ordem}`, binds);
            // classes de cor que o componente <lista-demandas> usa
            const classesPrioridade = {
                "Crítica": "critica",
                "Alta": "alta",
                "Média": "media",
                "Baixa": "baixa"
            };
            const classesStatus = {
                "Aberta": "aberta",
                "Em andamento": "andamento",
                "Concluída": "concluida"
            };
            // monta o formato que o componente espera
            const demandas = ((_a = result.rows) !== null && _a !== void 0 ? _a : []).map(linha => { var _a, _b, _c, _d; return ({
                id: linha.id,
                codigo: "DEM-" + linha.id,
                titulo: linha.titulo,
                projeto: linha.projeto,
                tipo: linha.tipo,
                prioridade: linha.prioridade,
                classePrioridade: (_a = classesPrioridade[linha.prioridade]) !== null && _a !== void 0 ? _a : "",
                status: linha.status,
                classeStatus: (_b = classesStatus[linha.status]) !== null && _b !== void 0 ? _b : "",
                responsavel: (_c = linha.responsavel) !== null && _c !== void 0 ? _c : "Não atribuído",
                dataCriacao: linha.dataCriacao,
                prazo: (_d = linha.prazo) !== null && _d !== void 0 ? _d : "Sem prazo"
            }); });
            // sem resultados também é sucesso: devolve lista vazia
            return res.status(200).json(demandas);
        }
        catch (erro) {
            console.error(erro);
            return res.status(500).json({ mensagem: "Erro ao listar as demandas" });
        }
        finally {
            // devolve a conexão para o pool
            if (conn)
                yield conn.close();
        }
    }));
}
//# sourceMappingURL=listagemDemanda.js.map