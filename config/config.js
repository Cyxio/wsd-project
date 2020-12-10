import { config } from "../deps.js"


let configs = {};
configs.userDBname = 'users';
configs.morningDBname = 'morningreports';
configs.eveningDBname = 'eveningreports';
configs.database = {
    hostname: config().PGHOST,
    database: config().PGDATABASE,
    user: config().PGUSER,
    password: config().PGPASSWORD,
    port: Number(config().PGPORT)
};

if (config().TEST_ENVIRONMENT === "true"){
    configs.userDBname = 'test_users';
    configs.morningDBname = 'test_morningreports';
    configs.eveningDBname = 'test_eveningreports';
}

export { configs }; 