import {getDbResults, runDbCmd, toSqlValue, unescapeString, updateOnlyNonNullAttributes} from "../utils/database";
import {Login, User} from "../utils/interfaces";

/** Returns the user with the given username **/
export const getUser = async (username: string): Promise<User | undefined> => {
    const dbUser = (await getDbResults(`SELECT * FROM users WHERE username=${toSqlValue(username)};`))[0];
    if (!dbUser) return undefined;
    return {
        username: unescapeString(username),
        salt: dbUser.salt,
        verifier: dbUser.verifier,
        publicKey: dbUser.public_key,
        privateKey: dbUser.private_key,
        registered: dbUser.registered,
    };
};

/** Sets a new user or updates old parameters */
export const setUser = (user: User): void => {
    const updateAttr = {
        salt: user.salt,
        verifier: user.verifier,
    };
    const updateStr = updateOnlyNonNullAttributes(updateAttr);
    runDbCmd(`INSERT INTO users VALUES (${toSqlValue(user.username)}, ${toSqlValue(user.salt)}, ${toSqlValue(user.verifier)}, ${toSqlValue(user.publicKey)}, ${toSqlValue(user.privateKey)}, ${Date.now()}) ${updateStr};`);
};

/** Removes a user with the given username */
export const rmvUser = (username: string): void => {
    runDbCmd(`DELETE FROM users WHERE username=${toSqlValue(username)};`);
};

/** Returns a login session **/
export const getLogin = async (id: number): Promise<Login | undefined> => {
    const dbLogin = (await getDbResults(`SELECT * FROM logins WHERE id=${toSqlValue(id)};`))[0];
    if (!dbLogin) return undefined;
    return {
        username: unescapeString(dbLogin.username),
        id: id,
        serverEphemeral: dbLogin.server_ephemeral,
        clientEphemeral: dbLogin.client_ephemeral,
        sessionProof: dbLogin.session_proof,
        lastEdited: dbLogin.last_edited,
    };
};

/** Adds or updates a login session */
export const setLogin = async (login: Login): Promise<number> => {
    const updateAttr = {
        server_ephemeral: login.serverEphemeral,
        client_ephemeral: login.clientEphemeral,
        session_proof: login.sessionProof,
        last_edited: Date.now(),
    };
    const updateStr = updateOnlyNonNullAttributes(updateAttr);
    const result: any = await getDbResults(`INSERT INTO logins VALUES (${toSqlValue(login.username)}, ${toSqlValue(login.id)}, ${toSqlValue(login.serverEphemeral)}, ${toSqlValue(login.clientEphemeral)}, ${toSqlValue(login.sessionProof)}, ${Date.now()}) ${updateStr};`);
    return result.insertId;
};

export const rmvExpiredLogins = (): void => {
    // current timestamp minus two hours (1000ms * 60sec * 60min * 2h)
    const oldestDate = Date.now() - 7200000;
    runDbCmd(`DELETE FROM logins WHERE last_edited < ${oldestDate};`);
}

/** Removes a login session */
export const rmvLogin = (id: number): void => {
    runDbCmd(`DELETE FROM logins WHERE id=${toSqlValue(id)};`);
};

/** Removes a login session */
export const rmvUserLogins = (username: string): void => {
    runDbCmd(`DELETE FROM logins WHERE username=${toSqlValue(username)};`);
};