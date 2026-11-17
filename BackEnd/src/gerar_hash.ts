// Autor: Felipe Evangelista Cruz


import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

async function gerarHash() {
    const leitor = createInterface({ input: stdin, output: stdout });
    try {
        // Use somente senhas fictícias na demonstração em sala.
        const senha = await leitor.question("Senha de exemplo (visível ao digitar): ");
        if (!senha || bcrypt.truncates(senha)) {
            throw new Error("Informe uma senha com até 72 bytes em UTF-8.");
        }
        const hash = await bcrypt.hash(senha, 12);
        console.log("Hash para a coluna senha_hash:");
        console.log(hash);
    } finally {
        leitor.close();
    }
}

gerarHash().catch((erro) => {
    console.error(erro.message);
    process.exitCode = 1;
});
