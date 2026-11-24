import express, { Request, Response } from "express";
import "dotenv/config";
import { initPool } from "./db";
import { rotasListagemDemanda } from "./rotas/listagemDemanda"; 
import { rotasCadastroDemanda } from "./rotas/cadastroDemanda";
import { rotasUsuarios } from "./rotas/usuarios";
import { rotasDashboard } from "./rotas/dashboard";
import { rotasDetalhesDemanda } from "./rotas/detalhesDemanda";
import { rotasProjetos } from "./rotas/projetos";
import { rotasTelaLogin } from "./rotas/telaLogin";
import cors from "cors";
import session from "express-session";

const app = express();
const PORT = 3000;

// libera as chamadas vindas das telas (outra origem/porta)
app.use(cors());

// requisições em JSON
app.use(express.json());

// segredo que assina o cookie da sessão (fica no .env)
const segredo = process.env.SESSION_SECRET;
if (!segredo || segredo.length < 32) {
    throw new Error("Defina SESSION_SECRET no .env com pelo menos 32 caracteres.");
}

// a sessão fica na memória do processo Node.js (igual na aula)
app.use(session({
    name: "nexo.sid",
    secret: segredo,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: false, // ambiente local em HTTP
        maxAge: 30 * 60 * 1000
    }
}));

// respostas com dados pessoais não devem ficar no cache do navegador (igual na aula)
app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});

// rota simples de verificação
app.get("/", (req: Request, res: Response) => {
    res.send("Servidor do PI funcionando!");
});

// rotas
rotasCadastroDemanda(app);
rotasListagemDemanda(app); 
rotasUsuarios(app);
rotasDashboard(app);
rotasDetalhesDemanda(app);
rotasProjetos(app);
rotasTelaLogin(app);

// liga o banco e depois sobe o servidor
async function iniciarServidor() {
    try {
        await initPool();

        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    } catch (erro) {
        console.error("falha na conexão com o banco", erro);
        process.exit(1);
    }
}

iniciarServidor();
