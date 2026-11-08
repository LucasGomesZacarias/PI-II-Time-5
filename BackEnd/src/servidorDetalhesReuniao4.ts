// Autor: Augusto Henrique Marçura. Servidor independente para testar as rotas de detalhes.
import express, { ErrorRequestHandler } from "express";
import { rotasDetalhesDemanda } from "./rotas/detalhesDemanda";

process.env.DADOS_EM_MEMORIA = "true";
const app = express();
app.use(express.json());
rotasDetalhesDemanda(app);
// Devolve JSON também quando a requisição contém JSON malformado.
const tratarJsonInvalido: ErrorRequestHandler = (erro, _req, res, next) => {
    if (erro instanceof SyntaxError && "body" in erro) {
        res.status(400).json({ mensagem: "JSON inválido." });
        return;
    }
    next(erro);
};
app.use(tratarJsonInvalido);
const porta = Number(process.env.PORT) || 3002;
app.listen(porta, "127.0.0.1", () => console.log(`Detalhes disponíveis em http://127.0.0.1:${porta}`));
