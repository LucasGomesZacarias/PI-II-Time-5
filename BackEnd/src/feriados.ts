// Autor: Felipe Evangelista Cruz

// feriado devolvido pela BrasilAPI (a data vem no formato AAAA-MM-DD)
interface Feriado {
    date: string;
    name: string;
}

// confere na BrasilAPI se a data é feriado nacional
// devolve o nome do feriado, ou null se a data não for feriado
export async function buscarFeriadoNacional(data: string): Promise<string | null> {
    // o ano são os 4 primeiros números da data (AAAA-MM-DD)
    const ano = data.split("-")[0];

    // espera no máximo 5 segundos pela resposta, para a tela não ficar travada
    const resposta = await fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`, {
        signal: AbortSignal.timeout(5000)
    });

    if (!resposta.ok) {
        throw new Error("A API de feriados respondeu com o status " + resposta.status);
    }

    // lista com todos os feriados nacionais do ano
    const feriados = (await resposta.json()) as Feriado[];

    // procura algum feriado com a mesma data do prazo
    const feriado = feriados.find((item) => item.date === data);

    if (feriado) {
        return feriado.name;
    }

    return null;
}