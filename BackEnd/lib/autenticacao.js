"use strict";
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
exports.buscarUsuarioLogado = buscarUsuarioLogado;
// descobre quem está chamando a API pelo header x-usuario-id (a tela manda o id guardado no login).
// O perfil sempre vem do banco, nunca da requisição. Devolve null se o id faltar ou não existir.
function buscarUsuarioLogado(conn, req) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        var _b;
        const id = Number(req.header("x-usuario-id"));
        if (!Number.isInteger(id) || id <= 0) {
            return null;
        }
        const result = yield conn.execute(`SELECT id_usuario as "id", nome as "nome", email as "email", perfil as "perfil"
         FROM Usuario WHERE id_usuario = :id`, { id });
        return (_b = (_a = result.rows) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : null;
    });
}
//# sourceMappingURL=autenticacao.js.map