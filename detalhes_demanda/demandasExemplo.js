// Autor da integração: Augusto Henrique Marçura.
// Dados de demonstração usados apenas pela tela de detalhes.
const CHAVE_ARMAZENAMENTO = "nexo-demandas-exemplo-v1";

const demandasIniciais = [
    {
        id: 1041, codigo: "DEM-1041", titulo: "Corrigir validação de prazo",
        descricao: "Corrigir a validação do prazo de finalização para considerar feriados nacionais.",
        projeto: "Nexo", tipo: "Defeito", prioridade: "Crítica", status: "Aberta",
        responsavel: "Ana Ferreira", dataCriacao: "10/09/2026", dataAtualizacao: "10/09/2026",
        prazo: "14/09/2026", comentarios: [], historico: []
    },
    {
        id: 1045, codigo: "DEM-1045", titulo: "Implementar filtro no painel",
        descricao: "Adicionar filtros para facilitar a consulta das demandas no painel.",
        projeto: "Alpha ERP", tipo: "Melhoria", prioridade: "Média", status: "Em andamento",
        responsavel: "Caio Lima", dataCriacao: "11/09/2026", dataAtualizacao: "11/09/2026",
        prazo: "19/09/2026", comentarios: [], historico: []
    },
    {
        id: 1042, codigo: "DEM-1042", titulo: "Corrigir validação de prazo em feriados nacionais",
        descricao: "Corrigir a validação do prazo de finalização para impedir datas que sejam feriados nacionais.",
        projeto: "Sistema de Acompanhamento de Demandas", tipo: "Defeito", prioridade: "Alta",
        status: "Em andamento", responsavel: "Ana Ferreira", dataCriacao: "10/09/2026",
        dataAtualizacao: "12/09/2026", prazo: "18/09/2026",
        comentarios: [{ autor: "Ana Ferreira", texto: "Validação da API em desenvolvimento", data: "12/09/2026 - 14:30" }],
        historico: [{ data: "12/09/2026 - 14:10", texto: "Ana Ferreira alterou o status de Aberta para Em andamento." }]
    }
];

function copia(dados) {
    return JSON.parse(JSON.stringify(dados));
}

// Recupera alterações locais; dados inválidos não substituem os exemplos originais.
export function listarDemandasExemplo() {
    try {
        const dados = JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO));
        if (Array.isArray(dados) && dados.every(item => Number.isInteger(item.id))) {
            return dados;
        }
    } catch (_) {
        // O navegador pode bloquear o armazenamento ou conter dados antigos inválidos.
    }
    return copia(demandasIniciais);
}

export function buscarDemandaExemplo(id) {
    return listarDemandasExemplo().find(demanda => String(demanda.id) === String(id)) ?? null;
}

// Persiste a edição somente na tela de detalhes deste navegador.
export function salvarDemandaExemplo(demandaAtualizada) {
    const demandas = listarDemandasExemplo();
    const indice = demandas.findIndex(demanda => demanda.id === demandaAtualizada.id);
    if (indice < 0) return false;

    demandas[indice] = demandaAtualizada;
    try {
        localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(demandas));
        return true;
    } catch (_) {
        return false;
    }
}
