//<!-- Lucas Gomes Zacarias - RA 26003288 -->
export function iniciarValidacaoFiltros(raizDoComponente) {

    const formFiltros = raizDoComponente.querySelector('.filtros');

    formFiltros.addEventListener('submit', function(evento) {
        evento.preventDefault();

        const inputBusca = formFiltros.querySelector('input[type="text"]');
        const selectProjeto = formFiltros.querySelector('select[aria-label="Filtrar por projeto"]');
        const selectStatus = formFiltros.querySelector('select[aria-label="Filtrar por status"]');
        const selectPrioridade = formFiltros.querySelector('select[aria-label="Filtrar por prioridade"]');
        const selectResponsavel = formFiltros.querySelector('select[aria-label="Filtrar por responsável"]');
        const selectOrdenacao = formFiltros.querySelector('select[aria-label="Ordenar por"]');

        const valorBusca = inputBusca.value.trim();

        const caracteresProibidos = /[<>]/g;
        if (caracteresProibidos.test(valorBusca)) {
            alert("Por segurança, não utilize os caracteres '<' ou '>' na busca.");
            inputBusca.focus();
            return;
        }

        inputBusca.value = valorBusca;

        // monta só os parâmetros preenchidos (os nomes são os que a API espera)
        const [ordenarPor, direcao] = selectOrdenacao.value.split(':');

        const filtros = {};
        if (valorBusca !== "") filtros.busca = valorBusca;
        if (selectProjeto.value !== "") filtros.projetoId = selectProjeto.value;
        if (selectStatus.value !== "") filtros.status = selectStatus.value;
        if (selectPrioridade.value !== "") filtros.prioridade = selectPrioridade.value;
        if (selectResponsavel.value !== "") filtros.responsavelId = selectResponsavel.value;
        filtros.ordenarPor = ordenarPor;
        filtros.direcao = direcao;

        // avisa a página para buscar as demandas com esses filtros
        raizDoComponente.host.dispatchEvent(new CustomEvent('filtrar', { detail: filtros }));
    });
}