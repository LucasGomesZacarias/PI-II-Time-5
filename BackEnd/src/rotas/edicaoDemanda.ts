// Autor: Augusto Henrique Marçura.
// Rota exclusiva do servidor de demonstração, sem autenticação ou banco.
import { Express } from "express";
import { demandasTeste } from "../dados/dadosTeste";

const transicoes: Record<string, string[]> = {
    "Aberta": ["Aberta", "Em andamento", "Cancelada"],
    "Em andamento": ["Em andamento", "Em revisão", "Cancelada"],
    "Em revisão": ["Em revisão", "Em andamento", "Concluída", "Cancelada"],
    "Concluída": ["Concluída"], "Cancelada": ["Cancelada"]
};

// Verifica se o perfil pode fazer a mudança de status.
export function podeAlterarStatus(
    perfil: string,
    statusAtual: string,
    novoStatus: string,
    eResponsavel: boolean
): boolean {
    const opcoes = transicoes[statusAtual];
    if (!opcoes || !opcoes.includes(novoStatus)) {
        return false;
    }
    if (perfil === "Administrador" || perfil === "Líder de Projeto") {
        return true;
    }
    if (perfil === "Membro da Equipe" && eResponsavel) {
        return statusAtual === novoStatus ||
            (statusAtual === "Aberta" && novoStatus === "Em andamento") ||
            (statusAtual === "Em andamento" && novoStatus === "Em revisão");
    }
    return false;
}

export function rotasEdicaoTeste(app: Express) {
    app.put("/demandas/:id", (req, res) => {
        const id = Number(req.params.id);
        if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ mensagem: "ID inválido." });
        const demanda = demandasTeste.find(item => item.id === id);
        if (!demanda) return res.status(404).json({ mensagem: "Demanda não encontrada." });
        const dados = req.body ?? {};
        if (typeof dados.titulo !== "string" || dados.titulo.trim().length < 2 || dados.titulo.trim().length > 100 ||
            typeof dados.descricao !== "string" || dados.descricao.trim().length < 10 || dados.descricao.trim().length > 500 ||
            typeof dados.projeto !== "string" || !dados.projeto.trim() || typeof dados.responsavel !== "string" ||
            !["Tarefa", "Defeito", "Melhoria", "Documentação"].includes(dados.tipo) ||
            !["Crítica", "Alta", "Média", "Baixa"].includes(dados.prioridade) ||
            !transicoes[demanda.status]?.includes(dados.status) ||
            typeof dados.prazo !== "string" || (dados.prazo !== "" && (!/^\d{4}-\d{2}-\d{2}$/.test(dados.prazo) || Number.isNaN(Date.parse(dados.prazo)) || new Date(dados.prazo).toISOString().slice(0, 10) !== dados.prazo))) {
            return res.status(400).json({ mensagem: "Confira os campos e a transição de status." });
        }
        const atualizacao = { titulo: dados.titulo.trim(), descricao: dados.descricao.trim(), projeto: dados.projeto.trim(),
            responsavel: dados.responsavel.trim(), tipo: dados.tipo, prioridade: dados.prioridade, status: dados.status, prazo: dados.prazo };
        const mudou = Object.entries(atualizacao).some(([campo, valor]) => demanda[campo as keyof typeof demanda] !== valor);
        if (mudou) Object.assign(demanda, atualizacao, { dataAtualizacao: new Date().toISOString() });
        return res.status(200).json({ demanda, alterada: mudou });
    });
}
