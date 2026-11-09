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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require("dotenv/config");
const db_1 = require("./db");
const cadastroDemanda_1 = require("./rotas/cadastroDemanda");
const usuarios_1 = require("./rotas/usuarios");
const dashboard_1 = require("./rotas/dashboard");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = 3000;
// libera as chamadas vindas das telas (outra origem/porta)
app.use((0, cors_1.default)());
// requisições em JSON
app.use(express_1.default.json());
// rota simples de verificação 
app.get("/", (req, res) => {
    res.send("Servidor do PI funcionando!");
});
// rotas
(0, cadastroDemanda_1.rotasCadastroDemanda)(app);
(0, usuarios_1.rotasUsuarios)(app);
(0, dashboard_1.rotasDashboard)(app);
// liga o banco e depois sobe o servidor
function iniciarServidor() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, db_1.initPool)();
            app.listen(PORT, () => {
                console.log(`Servidor rodando na porta ${PORT}`);
            });
        }
        catch (erro) {
            console.error("falha na conexão com o banco", erro);
            process.exit(1);
        }
    });
}
iniciarServidor();
//# sourceMappingURL=server.js.map