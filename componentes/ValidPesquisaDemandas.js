export function iniciarValidacaoFiltros(raizDoComponente) {

    const formFiltros = raizDoComponente.querySelector('.filtros');

    formFiltros.addEventListener('submit', function(evento) {
        evento.preventDefault();

        const inputBusca = formFiltros.querySelector('input[type="text"]');
        const selectProjeto = formFiltros.querySelector('select[aria-label="Filtrar por projeto"]');
        const selectStatus = formFiltros.querySelector('select[aria-label="Filtrar por status"]');
        const selectPrioridade = formFiltros.querySelector('select[aria-label="Filtrar por prioridade"]');
        const selectResponsavel = formFiltros.querySelector('select[aria-label="Filtrar por responsável"]');

        const valorBusca = inputBusca.value.trim(); 

        const caracteresProibidos = /[<>]/g; 
        if (caracteresProibidos.test(valorBusca)) {
            alert("Por segurança, não utilize os caracteres '<' ou '>' na busca.");
            inputBusca.focus(); 
            return; 
        }

        if (
            valorBusca === "" && 
            selectProjeto.value === "" && 
            selectStatus.value === "" && 
            selectPrioridade.value === "" && 
            selectResponsavel.value === ""
        ) {
            alert("Por favor, digite um termo de busca ou selecione pelo menos um filtro.");
            return; 
        }

        inputBusca.value = valorBusca; 
        
        const filtrosEscolhidos = {
            texto: valorBusca,
            projeto: selectProjeto.value,
            status: selectStatus.value,
            prioridade: selectPrioridade.value,
            responsavel: selectResponsavel.value
        };

        console.log("Filtros escolhidos:", filtrosEscolhidos);
    });
}