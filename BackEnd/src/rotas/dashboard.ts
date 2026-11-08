// BackEnd/src/rotas/dashboard.ts
// Autor: Gabriel Grigoletto Ribas

import { Express, Request, Response } from "express";
import { getConn } from "../db";

// Representa cada linha retornada pelas consultas de contagem.
type LinhaContagem = {
  chave: string;
  quantidade: number;
};

// Cria o objeto de contagens e mantém categorias sem demandas com valor zero.
function criarContagens(valores: string[], linhas: LinhaContagem[]) {
  const contagens: Record<string, number> = {};

  valores.forEach(function (valor) {
    contagens[valor] = 0;
  });

  linhas.forEach(function (linha) {
    contagens[linha.chave] = Number(linha.quantidade);
  });

  return contagens;
}

// Registra as rotas relacionadas ao dashboard.
export function rotasDashboard(app: Express) {
  // Retorna todos os dados necessários para montar o dashboard.
  app.get("/dashboard", async (_req: Request, res: Response) => {
    let conn;

    try {
      // Abre conexão com o banco de dados.
      conn = await getConn();

      // Executa as consultas do dashboard ao mesmo tempo.
      const [
        totalResult,
        statusResult,
        prioridadeResult,
        tipoResult,
        criticasResult,
        proximasDoPrazoResult,
      ] = await Promise.all([
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
      const totalDemandas = Number(
        (totalResult.rows?.[0] as { total: number } | undefined)?.total ?? 0
      );

      // Organiza as contagens em objetos para facilitar o uso no frontend.
      const porStatus = criarContagens(
        ["Aberta", "Em andamento", "Em revisão", "Concluída", "Cancelada"],
        (statusResult.rows ?? []) as LinhaContagem[]
      );

      const porPrioridade = criarContagens(
        ["Crítica", "Alta", "Média", "Baixa"],
        (prioridadeResult.rows ?? []) as LinhaContagem[]
      );

      const porTipo = criarContagens(
        ["Tarefa", "Defeito", "Melhoria", "Documentação"],
        (tipoResult.rows ?? []) as LinhaContagem[]
      );

      // Envia todos os dados do dashboard em formato JSON.
      return res.status(200).json({
        criterios: {
          emAberto:
            "Demandas com status Aberta, Em andamento ou Em revisão.",
          proximasDoPrazo:
            "Demandas em aberto com prazo entre hoje e os próximos 7 dias.",
        },
        totalDemandas,
        porStatus,
        porPrioridade,
        porTipo,
        demandasCriticasEmAberto: criticasResult.rows ?? [],
        demandasProximasDoPrazo: proximasDoPrazoResult.rows ?? [],
      });
    } catch (erro) {
      // Retorna erro caso ocorra um problema ao buscar os dados.
      console.error("Erro ao buscar dados do dashboard:", erro);

      return res.status(500).json({
        mensagem: "Não foi possível carregar os dados do dashboard.",
      });
    } finally {
      // Fecha a conexão com o banco após finalizar as consultas.
      if (conn) {
        await conn.close();
      }
    }
  });
}