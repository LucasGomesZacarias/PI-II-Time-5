// Autor: Luiz Felipe da Conceição
import { Request, Response, NextFunction } from "express";
import { Connection } from "oracledb";
import { Perfil } from "./permissoes";

export interface UsuarioLogado {
    id: number;
    nome: string;
    email: string;
    perfil: Perfil;
}

// ensina ao TypeScript qual informação guardamos na sessão (igual na aula)
declare module "express-session" {
    interface SessionData {
        usuario?: UsuarioLogado;
    }
}

// barra a rota se a pessoa não fez login (igual ao exigirLogin da aula)
export function exigirLogin(req: Request, res: Response, next: NextFunction) {
    if (!req.session.usuario) {
        return res.status(401).json({ mensagem: "Faça login para continuar" });
    }
    return next();
}

// descobre quem está chamando a API: agora vem da sessão (cookie), e não do header x-usuario-id.
// Devolve null se a pessoa não fez login.
export async function buscarUsuarioLogado(conn: Connection, req: Request): Promise<UsuarioLogado | null> {
    return req.session.usuario ?? null;
}
