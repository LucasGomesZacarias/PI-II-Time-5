import { iniciarValidacaoFiltros } from './ValidPesquisaDemandas.js';
export class FormDemandas extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.shadowRoot.innerHTML = ` 
        <link rel="stylesheet" href="/ListagemDemandas/Listagem.css">
        
        <form class="filtros">
            <input
                type="text"
                placeholder="Buscar por título ou ID da demanda..."
                aria-label="Buscar demanda"
            >
            <select aria-label="Filtrar por projeto">
                <option value="">Todos os Projetos</option>
                <option value="nexo">Nexo</option>
                <option value="alpha">Alpha ERP</option>
            </select>
            <select aria-label="Filtrar por status">
                <option value="">Todos os Status</option>
                <option value="aberta">Aberta</option>
                <option value="andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
            </select>
            <select aria-label="Filtrar por prioridade">
                <option value="">Todas as Prioridades</option>
                <option value="critica">Crítica</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
            </select>
            <select aria-label="Filtrar por responsável">
                <option value="">Todos os Responsáveis</option>
                <option value="ana-ferreira">Ana Ferreira</option>
                <option value="caio-lima">Caio Lima</option>
                <option value="bruno-costa">Bruno Costa</option>
                <option value="nao-atribuido">Não Atribuído</option>
            </select>
            <button class="botao" type="submit">
                Filtrar
            </button>
        </form>
        `;
    }
    connectedCallback() {
        iniciarValidacaoFiltros(this.shadowRoot);
    }
}