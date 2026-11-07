import oracledb from "oracledb";
import "dotenv/config";

// pega os dados de conexão do arquivo .env
const {
    ORACLE_HOST,
    ORACLE_PORT,
    ORACLE_SERVICE,
    ORACLE_USER,
    ORACLE_PASSWORD
} = process.env;

// endereço do banco no formato host:porta/serviço
const connectString = `${ORACLE_HOST}:${ORACLE_PORT}/${ORACLE_SERVICE}`;

// cada linha do select volta como objeto (ex.: { ID: 1, NOME: "Nexo" })
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

// cria o pool de conexões, que fica aberto enquanto o servidor roda
export async function initPool() {
    await oracledb.createPool({
        user: ORACLE_USER,
        password: ORACLE_PASSWORD,
        connectString
    });
}

// pega uma conexão do pool para usar na rota
export async function getConn() {
    return oracledb.getPool().getConnection();
}