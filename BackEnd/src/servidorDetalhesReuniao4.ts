// Autor: Augusto Henrique Marçura. Servidor independente para testar as rotas de detalhes.
import express from "express";
import { rotasDetalhesDemanda } from "./rotas/detalhesDemanda";

process.env.DADOS_EM_MEMORIA = "true";
const app = express();
app.use(express.json());
rotasDetalhesDemanda(app);
const porta = Number(process.env.PORT) || 3002;
app.listen(porta, "127.0.0.1", () => console.log(`Detalhes disponíveis em http://127.0.0.1:${porta}`));
