"use strict";
// Autor: Felipe Evangelista Cruz
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buscarFeriadoNacional = buscarFeriadoNacional;
// confere na BrasilAPI se a data é feriado nacional
// devolve o nome do feriado, ou null se a data não for feriado
function buscarFeriadoNacional(data) {
    return __awaiter(this, void 0, void 0, function* () {
        // o ano são os 4 primeiros números da data (AAAA-MM-DD)
        const ano = data.split("-")[0];
        // espera no máximo 5 segundos pela resposta, para a tela não ficar travada
        const resposta = yield fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`, {
            signal: AbortSignal.timeout(5000)
        });
        if (!resposta.ok) {
            throw new Error("A API de feriados respondeu com o status " + resposta.status);
        }
        // lista com todos os feriados nacionais do ano
        const feriados = (yield resposta.json());
        // procura algum feriado com a mesma data do prazo
        const feriado = feriados.find((item) => item.date === data);
        if (feriado) {
            return feriado.name;
        }
        return null;
    });
}
//# sourceMappingURL=feriados.js.map