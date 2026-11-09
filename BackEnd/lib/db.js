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
exports.initPool = initPool;
exports.getConn = getConn;
const oracledb_1 = __importDefault(require("oracledb"));
require("dotenv/config");
// pega os dados de conexão do arquivo .env
const { ORACLE_HOST, ORACLE_PORT, ORACLE_SERVICE, ORACLE_USER, ORACLE_PASSWORD } = process.env;
// endereço do banco no formato host:porta/serviço
const connectString = `${ORACLE_HOST}:${ORACLE_PORT}/${ORACLE_SERVICE}`;
// cada linha do select volta como objeto (ex.: { ID: 1, NOME: "Nexo" })
oracledb_1.default.outFormat = oracledb_1.default.OUT_FORMAT_OBJECT;
// cria o pool de conexões, que fica aberto enquanto o servidor roda
function initPool() {
    return __awaiter(this, void 0, void 0, function* () {
        yield oracledb_1.default.createPool({
            user: ORACLE_USER,
            password: ORACLE_PASSWORD,
            connectString
        });
    });
}
// pega uma conexão do pool para usar na rota
function getConn() {
    return __awaiter(this, void 0, void 0, function* () {
        return oracledb_1.default.getPool().getConnection();
    });
}
//# sourceMappingURL=db.js.map