export class NavBarComp extends HTMLElement{ 
    constructor(){
        super();
        // Determina se pode ou não receber alterações de fora
        this.attachShadow({ mode: 'open' });
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

            .sair {
                padding: 8px 12px;
                border: 1px solid #2c2a3a;
                border-radius: 4px;
                background-color: transparent;
                color: #edecf3;
                font-size: 14px;
                cursor: pointer;
            }

            .sair:hover {
                background-color: #6d4aff;
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
                <span class="avatar" id="avatarUsuario"></span>
                <span id="nomeUsuario"></span>
                <button class="sair" id="botaoSair">Sair</button>
             </div>

        </header>
        `

        // pergunta ao servidor quem está logado e mostra o nome e as iniciais (igual ao sessao.js da aula)
        const avatarUsuario = this.shadowRoot.getElementById('avatarUsuario');
        const nomeUsuario = this.shadowRoot.getElementById('nomeUsuario');

        async function carregarSessao() {
            const resposta = await fetch('/sessao');

            // sem sessão (ou sessão vencida): volta para o login
            if (!resposta.ok) {
                window.location.replace('/telaLogin/index.html');
                return;
            }

            const usuario = await resposta.json();
            const partes = usuario.nome.trim().split(/\s+/);
            const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';

            avatarUsuario.textContent = (partes[0][0] + ultima).toUpperCase();
            nomeUsuario.textContent = usuario.nome;
        }

        carregarSessao();

        // botão sair: pede ao servidor para encerrar a sessão e volta para a tela de login
        const botaoSair = this.shadowRoot.getElementById('botaoSair');

        botaoSair.addEventListener('click', async () => {
            try {
                await fetch('/logout', { method: 'POST' });
                window.location.replace('/telaLogin/index.html');
            } catch (erro) {
                alert('Não foi possível sair. Tente novamente.');
            }
        });

    }

}
