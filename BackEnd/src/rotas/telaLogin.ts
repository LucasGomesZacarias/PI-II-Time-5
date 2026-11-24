// Autor: Luiz Felipe da Conceição
import express, { Express, Request, Response } from "express";
import path from "node:path";

// as telas ficam ao lado do BackEnd, na pasta do projeto
const pastaProjeto = path.resolve(__dirname, "../../../");

// pastas das telas que só abrem com login
const pastasProtegidas = ["Dashboard", "ListagemDemandas", "Projetos", "CadastroDemanda", "EdicaoDemanda", "detalhes_demanda", "componentes"];

// cadastra as rotas que entregam as telas (mesmo servidor da API, igual na aula)
export function rotasTelaLogin(app: Express) {

    // a tela de login abre sem login
    app.use("/telaLogin", express.static(path.join(pastaProjeto, "telaLogin")));

    // atalho: localhost:3000/login manda para a tela de login
    app.get("/login", (req: Request, res: Response) => {
        return res.redirect("/telaLogin/index.html");
    });

    // as outras telas só abrem com login: sem sessão volta para o login
    for (const pasta of pastasProtegidas) {
        app.use(`/${pasta}`, (req: Request, res: Response, next) => {
            if (!req.session.usuario) {
                return res.redirect("/telaLogin/index.html");
            }
            next();
        }, express.static(path.join(pastaProjeto, pasta)));
    }
}
