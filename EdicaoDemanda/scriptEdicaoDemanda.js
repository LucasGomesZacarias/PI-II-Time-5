// Autor: Felipe Evangelista Cruz e Augusto Henrique Marçura

// importa a busca das demandas de demonstração
import { buscarDemandaExemplo, salvarDemandaExemplo } from "../detalhes_demanda/demandasExemplo.js";

// identifica a demanda informada no endereço da página
const parametros = new URLSearchParams(window.location.search);
const idDemanda = parametros.get("id");

// procura a demanda pelo ID recebido no endereço
let demanda = buscarDemandaExemplo(idDemanda);
console.log("Demanda encontrada:", demanda);

console.log("ID da demanda selecionada:", idDemanda);


// pega o formulário pelo id
const formulario = document.querySelector("#formEdicao");

// pega cada campo do formulário
const campoTitulo = document.querySelector("#titulo");
const campoTipo = document.querySelector("#tipo");
const campoPrioridade = document.querySelector("#prioridade");
const campoResponsavel = document.querySelector("#responsavel");
const campoAssociado = document.querySelector("#associado");
const campoPrazo = document.querySelector("#prazo");
const campoStatus = document.querySelector("#status");
const campoDescricao = document.querySelector("#descricao");

// preenche o formulário com os dados da demanda encontrada
if (demanda) {

    // exibe as datas da demanda carregada
    document.querySelector("#dataCriacao").textContent = demanda.dataCriacao;
    document.querySelector("#dataAtualizada").textContent = demanda.dataAtualizacao;

    campoTitulo.value = demanda.titulo;
    campoTipo.value = demanda.tipo;
    campoPrioridade.value = demanda.prioridade;
    campoResponsavel.value = demanda.responsavel || "";
    campoAssociado.value = demanda.projeto;
    campoStatus.value = demanda.status;
    campoDescricao.value = demanda.descricao;

    // converte a data de dia/mês/ano para o formato aceito pelo campo date
    if (demanda.prazo) {
        const [dia, mes, ano] = demanda.prazo.split("/");
        campoPrazo.value = `${ano}-${mes}-${dia}`;
    }
} else {
    // impede a edição quando não existe uma demanda para o ID informado
    const aviso = document.querySelector("#avisoDemanda");
    aviso.textContent = "Demanda não encontrada. Volte à listagem e escolha uma demanda válida";
    aviso.hidden = false;
    formulario.hidden = true;
}

// pega cada div onde a mensagem de erro vai aparecer
const erroTitulo = document.querySelector("#erroTitulo");
const erroTipo = document.querySelector("#erroTipo");
const erroPrioridade = document.querySelector("#erroPrioridade");
const erroResponsavel = document.querySelector("#erroResponsavel");
const erroAssociado = document.querySelector("#erroAssociado");
const erroPrazo = document.querySelector("#erroPrazo");
const erroStatus = document.querySelector("#erroStatus");
const erroDescricao = document.querySelector("#erroDescricao");


// lista com todos os campos, usada para limpar o estilo de erro
const camposComErro = [
    campoTitulo,
    campoTipo,
    campoPrioridade,
    campoResponsavel,
    campoAssociado,
    campoPrazo,
    campoStatus,
    campoDescricao
];

// lista com todas as mensagens de erro, usada para apagar os textos
const mensagensDeErro = [
    erroTitulo,
    erroTipo,
    erroPrioridade,
    erroResponsavel,
    erroAssociado,
    erroPrazo,
    erroStatus,
    erroDescricao
];

// deixa o campo vermelho e mostra a mensagem de erro
function mostrarErro(campo, elementoErro, mensagem) {
    campo.classList.add("is-invalid");
    elementoErro.innerText = mensagem;
}

// tira o vermelho dos campos e apaga as mensagens
function limparErros() {
    camposComErro.forEach(function (campo) {
        campo.classList.remove("is-invalid");
    });

    mensagensDeErro.forEach(function (elementoErro) {
        elementoErro.innerText = "";
    });
}


// executa quando o usuário clica em Salvar
formulario.addEventListener("submit", function (event) {
    // impede o envio automático do formulário
    event.preventDefault();
    limparErros();

    // pega os valores digitados (trim tira espaços do começo e do fim)
    const titulo = campoTitulo.value.trim();
    const tipo = campoTipo.value;
    const prioridade = campoPrioridade.value;
    const responsavel = campoResponsavel.value.trim();
    const associado = campoAssociado.value.trim();
    const prazo = campoPrazo.value;
    const status = campoStatus.value;
    const descricao = campoDescricao.value.trim();

    // começa como válido e muda para false se achar algum erro
    let formValido = true;

    // título: obrigatório, entre 2 e 100 caracteres
    if (titulo === "") {
        mostrarErro(campoTitulo, erroTitulo, "O título é obrigatório.");
        formValido = false;
    } else if (titulo.length < 2) {
        mostrarErro(campoTitulo, erroTitulo, "O título deve possuir pelo menos 2 caracteres.");
        formValido = false;
    } else if (titulo.length > 100) {
        mostrarErro(campoTitulo, erroTitulo, "O título deve possuir no máximo 100 caracteres.");
        formValido = false;
    }

    // tipo: precisa ser escolhido
    if (tipo === "") {
        mostrarErro(campoTipo, erroTipo, "O tipo é obrigatório.");
        formValido = false;
    }

    // prioridade: precisa ser escolhida
    if (prioridade === "") {
        mostrarErro(campoPrioridade, erroPrioridade, "A prioridade é obrigatória.");
        formValido = false;
    }


    // projeto associado: obrigatório
    if (associado === "") {
        mostrarErro(campoAssociado, erroAssociado, "O projeto associado é obrigatório.");
        formValido = false;
    }

    // prazo: não é obrigatório, mas se for preenchido não pode ser data passada
    if (prazo !== "") {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const dataPrazo = new Date(prazo + "T00:00:00");

        if (dataPrazo < hoje) {
            mostrarErro(campoPrazo, erroPrazo, "O prazo não pode ser uma data passada.");
            formValido = false;
        }
    }

    // status: precisa ser um dos cinco status previstos no escopo
    if (status !== "Aberta" && status !== "Em andamento" && status !== "Em revisão" && status !== "Concluída" && status !== "Cancelada") {
        mostrarErro(campoStatus, erroStatus, "Selecione um status válido.");
        formValido = false;
    }

    // define os status permitidos a partir do status atual
    const transicoesPermitidas = {
        "Aberta": ["Aberta", "Em andamento", "Cancelada"],
        "Em andamento": ["Em andamento", "Em revisão", "Cancelada"],
        "Em revisão": ["Em revisão", "Em andamento", "Concluída", "Cancelada"],
        "Concluída": ["Concluída"],
        "Cancelada": ["Cancelada"]
    };

    // impede uma mudança que não esteja no ciclo de vida da demanda
    if (demanda && !transicoesPermitidas[demanda.status]?.includes(status)) {
        mostrarErro(campoStatus, erroStatus, "Essa mudança de status não é permitida");
        formValido = false;
    }

    // descrição: obrigatória, entre 10 e 500 caracteres
    if (descricao === "") {
        mostrarErro(campoDescricao, erroDescricao, "A descrição é obrigatória.");
        formValido = false;
    } else if (descricao.length < 10) {
        mostrarErro(campoDescricao, erroDescricao, "A descrição deve possuir pelo menos 10 caracteres.");
        formValido = false;
    } else if (descricao.length > 500) {
        mostrarErro(campoDescricao, erroDescricao, "A descrição deve possuir no máximo 500 caracteres.");
        formValido = false;
    }

    // só continua quando todos os campos passaram pela validação
    if (formValido) {
        const demandaAtualizada = {
            ...demanda,
            titulo,
            tipo,
            prioridade,
            responsavel,
            projeto: associado,
            prazo: prazo ? prazo.split("-").reverse().join("/") : "",
            status,
            descricao,
            dataAtualizacao: new Date().toLocaleDateString("pt-BR")
        };

        // compara os dados anteriores com os dados preenchidos
        const nomesDosCampos = {
            titulo: "título",
            tipo: "tipo",
            prioridade: "prioridade",
            responsavel: "responsável",
            projeto: "projeto",
            prazo: "prazo",
            status: "status",
            descricao: "descrição"
        };
        const camposAlterados = Object.keys(nomesDosCampos).filter(function (campo) {
            return (demanda[campo] || "") !== (demandaAtualizada[campo] || "");
        });

        // não altera a data nem cria histórico se nada mudou
        if (camposAlterados.length == 0) {
            window.alert("Nenhum dado foi alterado");
            return;
        }

        // registra os valores anteriores e novos na demonstração local
        const agora = new Date();
        const dataHora = agora.toLocaleDateString("pt-BR") + " - " + agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

        const descricaoAlteracoes = camposAlterados.map(function (campo) {
            const anterior = demanda[campo] || "não definido";
            const novo = demandaAtualizada[campo] || "não definido";
            return `${nomesDosCampos[campo]}: ${anterior} → ${novo}`;
        });

        demandaAtualizada.historico = [
            ...(demanda.historico || []),
            {
                data: dataHora,
                texto: `Alteração na demonstração local: ${descricaoAlteracoes.join("; ")}`
            }
        ];

        // salva a edição apenas no armazenamento deste navegador
        if (salvarDemandaExemplo(demandaAtualizada)) {
            demanda = demandaAtualizada;
            document.querySelector("#dataAtualizada").textContent = demanda.dataAtualizacao;
            window.alert("Demanda salva neste navegador");
        } else {
            window.alert("Não foi possível salvar a demanda neste navegador");
        }
    }
});