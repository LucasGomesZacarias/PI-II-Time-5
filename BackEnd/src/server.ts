import express, { Request, Response } from "express";

const app = express();
const PORT = 3000;

// requisições em JSON
app.use(express.json());

// rota simples de verificação 
app.get("/", (req: Request, res: Response) => {
    res.send("Servidor do PI funcionando!");
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});