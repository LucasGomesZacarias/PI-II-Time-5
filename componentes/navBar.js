export class NavBarComp extends HTMLElement{ 
    constructor(){
        super();
        // Determina se pode ou não receber alterações de fora
        this.attachShadow({ mode: 'open' });
        //Deixando pronto ja para receber o nome do usuario (componente dinamico)
        const nomeUser = this.getAttribute('nome');
        const iniciais = this.getAttribute('iniciais');
        const paginaAtual = this.getAttribute('pagina-atual');

        //Crie seu Componete Padrão aqui
        this.shadowRoot.innerHTML =` 
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                background-color: #0a0a0f;
                color: #edecf3;
                font-family: Arial, Helvetica, sans-serif;
            }

            a {
                color: inherit;
                text-decoration: none;
            }

            .cabecalho {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 7%;
                background-color: #15141c;
                border-bottom: 1px solid #2c2a3a;
            }

            .logo {
                font-family: 'JetBrains Mono', monospace;
                font-size: 30px;
                font-weight: 800;
            }

            .logo span {
                color: #b3a3ff;
            }

            .menu {
                display: flex;
                gap: 8px;
            }

            .menu a {
                padding: 9px 12px;
                border-radius: 4px;
                font-size: 14px;
            }

            .menu a:hover,
            .menu .ativo {
                background-color: #6d4aff;
            }

            .usuario {
                display: flex;
                align-items: center;
                gap: 9px;
                font-size: 14px;
            }

            .avatar {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                background-color: #6d4aff;
                font-size: 12px;
                font-weight: bold;
            }

            @media (max-width: 768px) {
                .cabecalho {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 16px;
                    padding: 18px 24px;
                }

                .usuario {
                    display: none;
                }

                .menu {
                    width: 100%;
                }
            }
        </style>
        
        <header class="cabecalho">

            <a href="#inicio" class="logo">nexo<span>.</span></a>

            <nav class="menu">
                <a href="/Dashboard/dashboard.html" class="${paginaAtual === 'dashboard' ? 'ativo' : ''}">Dashboard</a>
                <a href="/ListagemDemandas/ListagemDemandas.html" class="${paginaAtual === 'demandas' ? 'ativo' : ''}">Demandas</a>
                <a href="/Projetos/projetos.html" class="${paginaAtual === 'projetos' ? 'ativo' : ''}">Projetos</a>
            </nav>

            <div class="usuario">
                <span class="avatar">${iniciais}</span>
                <span>${nomeUser}</span>
             </div>

        </header>
        `

    }

}
