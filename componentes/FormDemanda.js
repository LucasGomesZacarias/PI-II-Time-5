//<!-- Lucas Gomes Zacarias - RA 26003288 -->
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
                placeholder="Buscar por título ou descrição..."
                aria-label="Buscar demanda"
            >
            <select aria-label="Filtrar por projeto">
                <option value="">Todos os Projetos</option>
            </select>
            <select aria-label="Filtrar por status">
                <option value="">Todos os Status</option>
                <option value="Aberta">Aberta</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Em revisão">Em revisão</option>
                <option value="Concluída">Concluída</option>
                <option value="Cancelada">Cancelada</option>
            </select>
            <select aria-label="Filtrar por prioridade">
                <option value="">Todas as Prioridades</option>
                <option value="Crítica">Crítica</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
            </select>
            <select aria-label="Filtrar por responsável">
                <option value="">Carregando responsáveis...</option>
            </select>
            <select aria-label="Ordenar por">
                <option value="dataCriacao:desc">Mais recentes</option>
                <option value="dataCriacao:asc">Mais antigas</option>
                <option value="prazo:asc">Prazo mais próximo</option>
                <option value="prazo:desc">Prazo mais distante</option>
                <option value="prioridade:asc">Prioridade (maior primeiro)</option>
                <option value="prioridade:desc">Prioridade (menor primeiro)</option>
                <option value="status:asc">Status</option>
            </select>
            <button class="botao" type="submit">
                Filtrar
            </button>
        </form>
        `;
    }

    async connectedCallback() {
        iniciarValidacaoFiltros(this.shadowRoot);
        await this.carregarProjetos();
        await this.carregarResponsaveis();
    }

    // preenche o select de projetos com os dados do banco
    async carregarProjetos() {
        try {
            const resposta = await fetch('http://localhost:3000/projetos');
            if (!resposta.ok) return;

            const projetos = await resposta.json();
            const select = this.shadowRoot.querySelector('select[aria-label="Filtrar por projeto"]');

            projetos.forEach(projeto => {
                const opcao = document.createElement('option');
                opcao.value = projeto.id;
                opcao.textContent = projeto.nome;
                select.appendChild(opcao);
            });
        } catch (erro) {
            console.error(erro);
        }
    }

    // Os responsáveis são os usuários cadastrados no banco do projeto.
    async carregarResponsaveis() {
        const select = this.shadowRoot.querySelector('select[aria-label="Filtrar por responsável"]');
        try {
            const resposta = await fetch('http://localhost:3000/usuarios');
            if (!resposta.ok) throw new Error('Erro ao carregar responsáveis');
            const usuarios = await resposta.json();
            select.textContent = '';
            const todos = document.createElement('option');
            todos.value = '';
            todos.textContent = 'Todos os Responsáveis';
            select.appendChild(todos);
            for (const usuario of usuarios) {
                const opcao = document.createElement('option');
                opcao.value = usuario.id;
                opcao.textContent = usuario.nome;
                select.appendChild(opcao);
            }
        } catch (erro) {
            select.disabled = true;
            select.options[0].textContent = 'Não foi possível carregar os responsáveis';
            console.error(erro);
        }
    }
}
