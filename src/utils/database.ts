import mysql from 'mysql';
import config from './config';
import sqlString from 'sqlstring';

let dbConnection: mysql.Connection;

export const escapeString = (text: string) => {
    return sqlString.escape(text);
};

export const unescapeString = (sql: string): string => {
    return sqlString.raw(sql).toSqlString();
};

export const updateOnlyNonNullAttributes = (values: any, escape = true) => {
    const filtered = Object.keys(values).filter((key) => values[key] != undefined);
    if (filtered.length === 0) return '';

    return 'ON DUPLICATE KEY UPDATE ' + filtered.map((key) => {
        return `${key} = ${toSqlValue(values[key], escape)}`;
    }).join(', ');
};

export const toSqlValue = (value: any, escape = true): string => {
    if (value == undefined || value === 'undefined' || value === 'null') {
        return `null`;
    }
    if (typeof value === 'boolean') {
        return `${value}`;
    }
    if (typeof value == 'number') {
        return value.toString();
    }
    if (escape) {
        return escapeString(value);
    }
    return `'${value}'`;
};

export const fromSqlBoolean = (value: number): boolean | undefined => {
    if (value == undefined) {
        return undefined;
    }
    return value === 1;
};

export const fromSqlValue = <sqlType>(value: sqlType): sqlType | undefined => {
    if (value == undefined) {
        return undefined;
    }
    return value;
};

export const insertMultipleRows = (values: any[][]): string => {
    return values.map((row) => {
        return `(${row.join(', ')})`;
    }).join(', ');
};

/** Initialize the database connection */
export const initDatabase = (): Promise<boolean> => {
    return new Promise<boolean>((resolve, _) => {
        dbConnection = mysql.createConnection({
            host: config.dbHost,
            user: config.dbUser,
            password: config.dbPassword,
            database: config.dbName,
            port: config.dbPort
        });
        dbConnection.connect((err) => {
            if (err) {
                console.log('Failed to connect to the database!');

                resolve(false);
                return;
            }
            console.log('Connected to database');
            createDefaultTables();
            resolve(true);
        });
    });
};

/** Executes a sql command */
export const runDbCmd = (options: string): void => {
    if (!checkDatabaseStatus()) return;
    dbConnection.query(options);
};

/** Returns all results for the given options */
export const getDbResults = async (options: string): Promise<any[]> => {
    if (!checkDatabaseStatus()) return [];
    return new Promise<any[]>((resolve, _) => {
        dbConnection.query(options, (err, results) => {
            if (err) {
                console.log('Failed to get values: ' + err);
                resolve(undefined);
            } else {
                resolve(results);
            }
        });
    });
};

/** Creates all default database tables */
const createDefaultTables = (): void => {
    if (!checkDatabaseStatus()) return;
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS users (username VARCHAR(10) NOT NULL, salt VARCHAR(64) NOT NULL, verifier VARCHAR(512) NOT NULL, public_key VARCHAR(360) NOT NULL, private_key VARCHAR(3872) NOT NULL, registered BIGINT NOT NULL, UNIQUE KEY unique_username (username)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS logins (username VARCHAR(10) NOT NULL, id int NOT NULL AUTO_INCREMENT, server_ephemeral VARCHAR(64) NOT NULL, client_ephemeral VARCHAR(512) NOT NULL, session_proof VARCHAR(64), last_edited BIGINT NOT NULL, UNIQUE KEY unique_id (id)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS categories (id int NOT NULL AUTO_INCREMENT, name TEXT NOT NULL, description TEXT NOT NULL, is_split BOOLEAN, last_edited BIGINT NOT NULL, UNIQUE KEY unique_id (id)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS permissions (category_id int NOT NULL, username VARCHAR(10) NOT NULL, permission INT NOT NULL, encryption_key VARCHAR(344), last_edited BIGINT NOT NULL, UNIQUE KEY unique_id (category_id, username)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS payments (id int NOT NULL AUTO_INCREMENT, category_id int NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL, amount TEXT NOT NULL, date VARCHAR(10) NOT NULL, payer TEXT NOT NULL, payed BOOL NOT NULL, last_edited BIGINT NOT NULL, UNIQUE KEY unique_id (id)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
    dbConnection.query(
        'CREATE TABLE IF NOT EXISTS splits (category_id int NOT NULL, username VARCHAR(20) NOT NULL, share float NOT NULL, is_platform_user BOOL NOT NULL, last_edited BIGINT NOT NULL, UNIQUE KEY unique_id (category_id, username)) ENGINE = InnoDB DEFAULT CHARSET=utf8;');
};

/** Checks if the database connection is already initialized */
const checkDatabaseStatus = (): boolean => {
    if (!dbConnection || (dbConnection.state != 'authenticated' && dbConnection.state != 'connected')) {
        console.error('The database must be initialized:', dbConnection.state);
        return false;
    }
    return true;
};

if (module.parent == null) {
    initDatabase().then(() => {
        createDefaultTables();
        dbConnection.end();
    });
}
