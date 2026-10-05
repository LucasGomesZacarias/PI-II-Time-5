//<!-- Lucas Gomes Zacarias - RA 26003288 -->
export class ListaDemandas extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this._demandas = [];
    }

    set demandas(dados) {
        this._demandas = dados;
        this.render();
    }

    connectedCallback() {
        this.render();
    }

    render() {

        const css = `
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, Helvetica, sans-serif; }
            a { color: inherit; text-decoration: none; }
            
            .bloco { padding: 24px; background-color: #15141c; border: 1px solid #2c2a3a; border-radius: 8px; color: #edecf3; }
            .titulo-bloco { margin-bottom: 24px; }
            .subtitulo { margin-bottom: 8px; color: #9a97ac; font-size: 12px; font-weight: bold; }
            h2 { font-family: 'JetBrains Mono', monospace; font-size: 18px; }
            
            .tabela-container { width: 100%; overflow-x: auto; }
            .tabela-demandas { width: 100%; min-width: 900px; border-collapse: collapse; font-size: 14px; }
            .tabela-demandas th { padding: 10px 8px; color: #9a97ac; font-size: 12px; font-weight: normal; text-align: left; text-transform: uppercase; border-bottom: 1px solid #2c2a3a; }
            .tabela-demandas td { padding: 12px 8px; color: #edecf3; border-bottom: 1px solid #2c2a3a; }
            .tabela-demandas tbody tr:hover { background-color: #1b1923; }
            
            .titulo-demanda { color: #8566ff; font-weight: bold; }
            .titulo-demanda:hover { text-decoration: underline; }
            
            .tag { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: bold; }
            .critica { background-color: #3a1e2a; border: 1px solid #ff5470; color: #ff5470; }
            .alta { background-color: #33261a; border: 1px solid #ff9f40; color: #ff9f40; }
            .media { background-color: #332e18; border: 1px solid #ffd166; color: #ffd166; }
            .baixa { background-color: #1c2128; border: 1px solid #8b98a8; color: #8b98a8; }
            
            .status { font-weight: bold; }
            .status.aberta { color: #4ea1ff; }
            .status.andamento { color: #f5a623; }
            .status.concluida { color: #34d399; }
            
            .acoes { white-space: nowrap; }
            .btn-acao { margin-right: 10px; padding: 0; background: none; border: none; color: #8566ff; font-size: 14px; font-weight: bold; cursor: pointer; }
            .btn-acao:hover { color: #a48eff; text-decoration: underline; }

            .mensagem-vazia { text-align: center; color: #9a97ac; padding: 40px 0; font-size: 16px; }

            @media (max-width: 768px) {
                .bloco { padding: 16px; }
            }
        `;

        if (!this._demandas || this._demandas.length === 0) {
            this.shadowRoot.innerHTML = `
                <style>${css}</style>
                <section class="bloco">
                    <div class="titulo-bloco">
                        <div>
                            <p class="subtitulo">Listagem Completa</p>
                            <h2>Demandas (0 resultados)</h2>
                        </div>
                    </div>
                    <div class="mensagem-vazia">
                        O usuário não possui demandas no momento.
                    </div>
                </section>
            `;
            return;
        }

        const linhasTabela = this._demandas.map(demanda => `
            <tr>
                <td>
                    <a href="/detalhes_demanda/detalhesDemandas.html?id=${demanda.id}" class="titulo-demanda">
                        ${demanda.codigo} - ${demanda.titulo}
                    </a>
                </td>
                <td>${demanda.projeto}</td>
                <td>${demanda.tipo}</td>
                <td><span class="tag ${demanda.classePrioridade}">${demanda.prioridade}</span></td>
                <td><span class="status ${demanda.classeStatus}">${demanda.status}</span></td>
                <td>${demanda.responsavel}</td>
                <td>${demanda.dataCriacao}</td>
                <td>${demanda.prazo}</td>
                <td class="acoes">
                    <a href="/detalhes_demanda/detalhesDemandas.html?id=${demanda.id}">
                        <button class="btn-acao" type="button">Detalhes</button>
                    </a>
                    <a href="/EdicaoDemanda/edicaoDemanda.html?id=${demanda.id}">
                        <button class="btn-acao" type="button">Editar</button>
                    </a>
                </td>
            </tr>
        `).join('');

        this.shadowRoot.innerHTML = `
            <style>${css}</style>
            <section class="bloco">
                <div class="titulo-bloco">
                    <div>
                        <p class="subtitulo">Listagem Completa</p>
                        <h2>Demandas (${this._demandas.length} resultados)</h2>
                    </div>
                </div>
                <div class="tabela-container">
                    <table class="tabela-demandas">
                        <thead>
                            <tr>
                                <th>Título da Demanda</th>
                                <th>Projeto</th>
                                <th>Tipo</th>
                                <th>Prioridade</th>
                                <th>Status</th>
                                <th>Responsável</th>
                                <th>Data Criação</th>
                                <th>Prazo (Fim)</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${linhasTabela}
                        </tbody>
                    </table>
                </div>
            </section>
        `;
    }
}