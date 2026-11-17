// Autor: Augusto Henrique Marçura. Dados fictícios para testar detalhes e comentários.
export const demandasTeste = [{
    id: 1041,
    titulo: "Corrigir validação de prazo",
    descricao: "Verificar o prazo de finalização da demanda.",
    tipo: "Defeito",
    prioridade: "Crítica",
    status: "Aberta",
    projeto: "Nexo",
    responsavel: "Ana Ferreira",
    dataCriacao: "2026-09-10",
    dataAtualizacao: "2026-09-10",
    prazo: "2026-09-14"
}];
export const usuariosTeste = [{ id: 1, nome: "Usuário de teste" }];
export interface ComentarioTeste {
    demandaId: number;
    usuarioId: number;
    texto: string;
    dataHora: string;
}
// Dados permanecem em memória somente enquanto o servidor estiver ativo.
export const comentarioTeste: ComentarioTeste[] = [];
