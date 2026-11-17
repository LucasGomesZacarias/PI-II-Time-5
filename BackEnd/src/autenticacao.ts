// Autor: Luiz Felipe da Conceição
import { Request } from "express";
import { Connection } from "oracledb";
import { Perfil } from "./permissoes";

export interface UsuarioLogado {
    id: number;
    nome: string;
    email: string;
    perfil: Perfil;
}

// descobre quem está chamando a API pelo header x-usuario-id (a tela manda o id guardado no login).
// O perfil sempre vem do banco, nunca da requisição. Devolve null se o id faltar ou não existir.
export async function buscarUsuarioLogado(conn: Connection, req: Request): Promise<UsuarioLogado | null> {
    const id = Number(req.header("x-usuario-id"));

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }

    const result = await conn.execute(
        `SELECT id_usuario as "id", nome as "nome", email as "email", perfil as "perfil"
         FROM Usuario WHERE id_usuario = :id`,
        { id }
    );

    return (result.rows?.[0] as UsuarioLogado | undefined) ?? null;
}
