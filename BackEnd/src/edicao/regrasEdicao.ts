// Autor: Augusto Henrique Marçura. Regras de edição preparadas para a integração da reunião 5.
// Devem ser chamadas no servidor após autenticação e autorização, dentro da transação do banco.
export interface DemandaEditavel {
    titulo: string; descricao: string; tipo: string; prioridade: string; projetoId: number;
    responsavelId: number | null; prazo: string | null; status: string;
}
export interface Alteracao {
    campo: keyof DemandaEditavel;
    anterior: string | number | null;
    novo: string | number | null;
    usuarioId: number;
}
export interface DependenciasEdicao {
    projetoExiste(id: number): Promise<boolean>;
    usuarioExiste(id: number): Promise<boolean>;
    feriadoNacional(data: string): Promise<string | null>;
}
export class ErroEdicao extends Error {
    constructor(public readonly status: number, mensagem: string) { super(mensagem); }
}
const transicoes: Record<string, string[]> = {
    "Aberta": ["Aberta", "Em andamento", "Cancelada"],
    "Em andamento": ["Em andamento", "Em revisão", "Cancelada"],
    "Em revisão": ["Em revisão", "Em andamento", "Concluída", "Cancelada"],
    "Concluída": ["Concluída"], "Cancelada": ["Cancelada"]
};
const campos = ["titulo", "descricao", "tipo", "prioridade", "projetoId", "responsavelId", "prazo", "status"] as const;
function dataValida(valor: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(valor) && !Number.isNaN(Date.parse(valor)) && new Date(valor).toISOString().slice(0, 10) === valor;
}

// Calcula a alteração sem gravar nada; o chamador deve salvar dados e histórico atomicamente.
export async function prepararEdicao(atual: DemandaEditavel, entrada: DemandaEditavel, usuarioId: number, deps: DependenciasEdicao): Promise<{ demanda: DemandaEditavel; historico: Alteracao[] }> {
    if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) throw new ErroEdicao(401, "Usuário autenticado necessário.");
    if (!entrada || typeof entrada.titulo !== "string" || entrada.titulo.trim().length < 2 || entrada.titulo.trim().length > 100 ||
        typeof entrada.descricao !== "string" || entrada.descricao.trim().length < 10 || entrada.descricao.trim().length > 500)
        throw new ErroEdicao(400, "Confira o título e a descrição.");
    if (!["Tarefa", "Defeito", "Melhoria", "Documentação"].includes(entrada.tipo) || !["Crítica", "Alta", "Média", "Baixa"].includes(entrada.prioridade))
        throw new ErroEdicao(400, "Tipo ou prioridade inválidos.");
    if (!transicoes[atual.status]?.includes(entrada.status)) throw new ErroEdicao(400, "Transição de status não permitida.");
    if (!Number.isSafeInteger(entrada.projetoId) || entrada.projetoId <= 0 || !(await deps.projetoExiste(entrada.projetoId)))
        throw new ErroEdicao(400, "Projeto não encontrado.");
    if (entrada.responsavelId !== null && (!Number.isSafeInteger(entrada.responsavelId) || entrada.responsavelId <= 0 || !(await deps.usuarioExiste(entrada.responsavelId))))
        throw new ErroEdicao(400, "Responsável não encontrado.");
    if (entrada.prazo !== null) {
        if (typeof entrada.prazo !== "string" || !dataValida(entrada.prazo)) throw new ErroEdicao(400, "Prazo inválido.");
        // Consulte também quando o prazo não mudou; a API externa deve falhar de forma explícita.
        let feriado: string | null;
        try { feriado = await deps.feriadoNacional(entrada.prazo); }
        catch { throw new ErroEdicao(503, "Não foi possível verificar os feriados nacionais."); }
        if (feriado) throw new ErroEdicao(400, `Prazo cai em feriado nacional: ${feriado}.`);
    }
    const demanda = {...entrada, titulo: entrada.titulo.trim(), descricao: entrada.descricao.trim()};
    const historico: Alteracao[] = campos.filter(campo => atual[campo] !== demanda[campo]).map(campo => ({
        campo, anterior: atual[campo], novo: demanda[campo], usuarioId
    }));
    return { demanda, historico };
}
