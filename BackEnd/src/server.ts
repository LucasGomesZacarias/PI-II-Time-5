import express, { Request, Response } from "express";
import "dotenv/config";
import { initPool } from "./db";
import { rotasCadastroDemanda } from "./rotas/cadastroDemanda";
import { rotasUsuarios } from "./rotas/usuarios";
import { rotasDashboard } from "./rotas/dashboard";
import cors from "cors";

const app = express();
const PORT = 3000;

// libera as chamadas vindas das telas (outra origem/porta)
app.use(cors());

// requisições em JSON
app.use(express.json());

// rota simples de verificação 
app.get("/", (req: Request, res: Response) => {
    res.send("Servidor do PI funcionando!");
});

// rotas
rotasCadastroDemanda(app);
rotasUsuarios(app);
rotasDashboard(app);

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