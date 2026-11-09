"use strict";
// BackEnd/src/rotas/dashboard.ts
// Autor: Gabriel Grigoletto Ribas
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
exports.rotasDashboard = rotasDashboard;
const db_1 = require("../db");
// Cria o objeto de contagens e mantém categorias sem demandas com valor zero.
function criarContagens(valores, linhas) {
    const contagens = {};
    valores.forEach(function (valor) {
        contagens[valor] = 0;
    });
    linhas.forEach(function (linha) {
        contagens[linha.chave] = Number(linha.quantidade);
    });
    return contagens;
}
// Registra as rotas relacionadas ao dashboard.
function rotasDashboard(app) {
    // Retorna todos os dados necessários para montar o dashboard.
    app.get("/dashboard", (_req, res) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        var _c, _d, _e, _f, _g, _h;
        let conn;
        try {
            // Abre conexão com o banco de dados.
            conn = yield (0, db_1.getConn)();
            // Executa as consultas do dashboard ao mesmo tempo.
            const [totalResult, statusResult, prioridadeResult, tipoResult, criticasResult, proximasDoPrazoResult,] = yield Promise.all([
                // Total geral de demandas cadastradas.
                conn.execute(`
          SELECT COUNT(*) AS "total"
          FROM demandas
        `),
                // Quantidade de demandas para cada status.
                conn.execute(`
          SELECT status AS "chave", COUNT(*) AS "quantidade"
          FROM demandas
          GROUP BY status
        `),
                // Quantidade de demandas para cada prioridade.
                conn.execute(`
          SELECT prioridade AS "chave", COUNT(*) AS "quantidade"
          FROM demandas
          GROUP BY prioridade
        `),
                // Quantidade de demandas para cada tipo.
                conn.execute(`
          SELECT tipo AS "chave", COUNT(*) AS "quantidade"
          FROM demandas
          GROUP BY tipo
        `),
                // Demandas críticas que ainda não foram concluídas ou canceladas.
                conn.execute(`
          SELECT
            d.id AS "id",
            d.titulo AS "titulo",
            d.tipo AS "tipo",
            d.prioridade AS "prioridade",
            d.status AS "status",
            TO_CHAR(d.prazo, 'YYYY-MM-DD') AS "prazo",
            p.nome AS "projeto",
            u.nome AS "responsavel"
          FROM demandas d
          JOIN projetos p ON p.id = d.projeto_id
          LEFT JOIN usuarios u ON u.id = d.responsavel_id
          WHERE d.prioridade = 'Crítica'
            AND d.status IN ('Aberta', 'Em andamento', 'Em revisão')
          ORDER BY d.prazo NULLS LAST, d.id
        `),
                // Demandas em aberto cujo prazo acontece entre hoje e os próximos 7 dias.
                conn.execute(`
          SELECT
            d.id AS "id",
            d.titulo AS "titulo",
            d.tipo AS "tipo",
            d.prioridade AS "prioridade",
            d.status AS "status",
            TO_CHAR(d.prazo, 'YYYY-MM-DD') AS "prazo",
            p.nome AS "projeto",
            u.nome AS "responsavel"
          FROM demandas d
          JOIN projetos p ON p.id = d.projeto_id
          LEFT JOIN usuarios u ON u.id = d.responsavel_id
          WHERE d.status IN ('Aberta', 'Em andamento', 'Em revisão')
            AND d.prazo >= TRUNC(SYSDATE)
            AND d.prazo < TRUNC(SYSDATE) + 8
          ORDER BY d.prazo, d.id
        `),
            ]);
            // Obtém o total retornado pelo banco.
            const totalDemandas = Number((_c = (_b = (_a = totalResult.rows) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.total) !== null && _c !== void 0 ? _c : 0);
            // Organiza as contagens em objetos para facilitar o uso no frontend.
            const porStatus = criarContagens(["Aberta", "Em andamento", "Em revisão", "Concluída", "Cancelada"], ((_d = statusResult.rows) !== null && _d !== void 0 ? _d : []));
            const porPrioridade = criarContagens(["Crítica", "Alta", "Média", "Baixa"], ((_e = prioridadeResult.rows) !== null && _e !== void 0 ? _e : []));
            const porTipo = criarContagens(["Tarefa", "Defeito", "Melhoria", "Documentação"], ((_f = tipoResult.rows) !== null && _f !== void 0 ? _f : []));
            // Envia todos os dados do dashboard em formato JSON.
            return res.status(200).json({
                criterios: {
                    emAberto: "Demandas com status Aberta, Em andamento ou Em revisão.",
                    proximasDoPrazo: "Demandas em aberto com prazo entre hoje e os próximos 7 dias.",
                },
                totalDemandas,
                porStatus,
                porPrioridade,
                porTipo,
                demandasCriticasEmAberto: (_g = criticasResult.rows) !== null && _g !== void 0 ? _g : [],
                demandasProximasDoPrazo: (_h = proximasDoPrazoResult.rows) !== null && _h !== void 0 ? _h : [],
            });
        }
        catch (erro) {
            // Retorna erro caso ocorra um problema ao buscar os dados.
            console.error("Erro ao buscar dados do dashboard:", erro);
            return res.status(500).json({
                mensagem: "Não foi possível carregar os dados do dashboard.",
            });
        }
        finally {
            // Fecha a conexão com o banco após finalizar as consultas.
            if (conn) {
                yield conn.close();
            }
        }
    }));
}
//# sourceMappingURL=dashboard.js.map