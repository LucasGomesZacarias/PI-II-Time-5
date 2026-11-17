"use strict";
// Autor: Luiz Felipe da Conceição
// Regras de perfis e permissões (Documento de Visão, item 2.1, e ciclo de vida, item 2.2.4).
// Este arquivo só tem regras: não usa banco nem Express, por isso é simples de testar.
// As rotas e o middleware consultam estas funções para saber o que cada perfil pode fazer.
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATUS = exports.PERFIS = void 0;
exports.ehPerfilValido = ehPerfilValido;
exports.ehStatusValido = ehStatusValido;
exports.podeFazer = podeFazer;
exports.acoesDoPerfil = acoesDoPerfil;
exports.validarTransicao = validarTransicao;
exports.PERFIS = ["Administrador", "Líder de Projeto", "Membro da Equipe"];
exports.STATUS = ["Aberta", "Em andamento", "Em revisão", "Concluída", "Cancelada"];
// O que cada perfil pode fazer, conforme o item 2.1 do Documento de Visão
const PERMISSOES = {
    "Administrador": [
        "ver_todos_os_projetos",
        "ver_usuarios",
        "criar_demanda",
        "editar_demanda",
        "alterar_responsavel",
        "alterar_prioridade",
        "alterar_prazo",
        "comentar",
        "ver_historico"
    ],
    "Líder de Projeto": [
        "criar_demanda",
        "editar_demanda",
        "alterar_responsavel",
        "alterar_prioridade",
        "alterar_prazo",
        "comentar",
        "ver_historico"
    ],
    // O documento não lista criar nem editar demanda para o Membro (a confirmar com a professora)
    "Membro da Equipe": [
        "comentar",
        "ver_historico"
    ]
};
// Ciclo de vida (item 2.2.4): para onde cada status pode ir.
// Não pode concluir direto de "Em andamento" nem voltar para "Aberta".
// Cancelar vale a qualquer momento, menos se a demanda já estiver concluída.
const TRANSICOES_DO_CICLO = {
    "Aberta": ["Em andamento", "Cancelada"],
    "Em andamento": ["Em revisão", "Cancelada"],
    "Em revisão": ["Concluída", "Em andamento", "Cancelada"],
    "Concluída": [],
    "Cancelada": []
};
// Os únicos dois passos que o Membro da Equipe pode dar
const TRANSICOES_DO_MEMBRO = [
    ["Aberta", "Em andamento"],
    ["Em andamento", "Em revisão"]
];
// Confere se o texto é um perfil válido (útil para valores vindos do banco ou da requisição)
function ehPerfilValido(valor) {
    return exports.PERFIS.includes(valor);
}
// Confere se o texto é um status válido
function ehStatusValido(valor) {
    return exports.STATUS.includes(valor);
}
// Diz se o perfil pode fazer a ação
function podeFazer(perfil, acao) {
    return PERMISSOES[perfil].includes(acao);
}
// Lista tudo o que o perfil pode fazer (usada para mostrar a matriz na demonstração)
function acoesDoPerfil(perfil) {
    return [...PERMISSOES[perfil]];
}
// Diz se o perfil pode mudar a demanda de um status para outro.
// Primeiro vale o ciclo de vida (vale para todos); depois as regras de cada perfil.
function validarTransicao(perfil, de, para, contexto = {}) {
    // 1) mesmo status
    if (de === para) {
        return { permitido: false, motivo: "A demanda já está nesse status" };
    }
    // 2) ciclo de vida: vale para qualquer perfil
    const statusPermitidos = TRANSICOES_DO_CICLO[de];
    if (!statusPermitidos.includes(para)) {
        if (de === "Concluída") {
            return { permitido: false, motivo: "Uma demanda concluída não pode mudar de status" };
        }
        if (de === "Cancelada") {
            return { permitido: false, motivo: "Uma demanda cancelada não pode mudar de status" };
        }
        if (para === "Aberta") {
            return { permitido: false, motivo: "Uma demanda não pode voltar para Aberta" };
        }
        if (de === "Em andamento" && para === "Concluída") {
            return { permitido: false, motivo: "Antes de concluir, a demanda precisa passar por Em revisão" };
        }
        return { permitido: false, motivo: `Transição inválida: de "${de}" para "${para}"` };
    }
    // 3) Administrador faz qualquer passo válido do ciclo
    if (perfil === "Administrador") {
        return { permitido: true };
    }
    // 4) Líder de Projeto faz qualquer passo válido, mas só nos projetos em que está vinculado
    if (perfil === "Líder de Projeto") {
        if (!contexto.vinculadoAoProjeto) {
            return { permitido: false, motivo: "O Líder de Projeto só altera demandas dos projetos aos quais está vinculado" };
        }
        return { permitido: true };
    }
    // 5) Membro da Equipe: só os dois passos dele, e só nas demandas atribuídas a ele
    const passoDoMembro = TRANSICOES_DO_MEMBRO.some(function (passo) {
        return passo[0] === de && passo[1] === para;
    });
    if (!passoDoMembro) {
        if (para === "Cancelada") {
            return { permitido: false, motivo: "O Membro da Equipe não pode cancelar demandas" };
        }
        if (para === "Concluída") {
            return { permitido: false, motivo: "O Membro da Equipe não pode concluir demandas" };
        }
        return { permitido: false, motivo: "O Membro da Equipe só pode passar de Aberta para Em andamento e de Em andamento para Em revisão" };
    }
    if (!contexto.atribuidaAoUsuario) {
        return { permitido: false, motivo: "O Membro da Equipe só altera o status das demandas atribuídas a ele" };
    }
    return { permitido: true };
}
//# sourceMappingURL=permissoes.js.map