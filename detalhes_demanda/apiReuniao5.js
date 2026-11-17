// Autor: Augusto Henrique Marçura. Cliente preparado para a API da reunião 5.
// O servidor deverá autenticar a sessão; o navegador não escolhe o usuário autor.
export class ErroApi extends Error {
    constructor(status, mensagem) { super(mensagem); this.status = status; }
}
export function criarClienteApi(fetchImpl = fetch) {
    async function requisitar(caminho, opcoes = {}) {
        let resposta;
        try {
            resposta = await fetchImpl(caminho, { credentials: "same-origin", ...opcoes });
        } catch {
            throw new ErroApi(0, "Não foi possível conectar ao servidor.");
        }
        const dados = await resposta.json().catch(() => null);
        if (!resposta.ok) throw new ErroApi(resposta.status, dados?.mensagem || "Não foi possível concluir a operação.");
        if (dados === null) throw new ErroApi(resposta.status, "O servidor retornou uma resposta inválida.");
        return dados;
    }
    function caminho(id) {
        if (!/^\d+$/.test(String(id)) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0)
            throw new ErroApi(400, "Identificador de demanda inválido.");
        return `/demandas/${encodeURIComponent(String(id))}`;
    }
    const enviar = (metodo, dados) => ({method: metodo, headers: {"Content-Type": "application/json"}, body: JSON.stringify(dados)});
    return {
        detalhes: id => requisitar(caminho(id)),
        comentarios: id => requisitar(`${caminho(id)}/comentarios`),
        comentar: (id, texto) => requisitar(`${caminho(id)}/comentarios`, enviar("POST", {texto})),
        editar: (id, dados) => requisitar(caminho(id), enviar("PUT", dados))
    };
}
