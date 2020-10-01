import {getDbResults, runDbCmd, toSqlValue, updateOnlyNonNullAttributes} from "../utils/database";
import {User} from "../utils/interfaces";

/** Returns the user with the given username **/
export const getUser = async (username: string): Promise<User | undefined> => {
    const dbUser = (await getDbResults(`SELECT * FROM users WHERE username=${toSqlValue(username)};`))[0];
    if (!dbUser) return undefined;
    return {
        username: username,
        password: dbUser.password,
    };
};

/** Sets a new user or updates old parameters */
export const setUser = (user: User): void => {
    const updateAttr = {
        password: user.password,
    };
    const updateStr = updateOnlyNonNullAttributes(updateAttr);
    runDbCmd(`INSERT INTO users VALUES (${toSqlValue(user.username)}, ${toSqlValue(user.password)}) ${updateStr};`);
};

/** Removes a user with the given username */
export const rmvUser = (username: string): void => {
    runDbCmd(`DELETE FROM users WHERE username=${toSqlValue(username)};`);
};