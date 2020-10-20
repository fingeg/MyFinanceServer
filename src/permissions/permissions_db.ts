import {getDbResults, runDbCmd, toSqlValue, updateOnlyNonNullAttributes} from "../utils/database";
import {Permission} from "../utils/interfaces";

/** Returns the permission with the given username and category id **/
export const getPermission = async (username: string, categoryID: number): Promise<Permission | undefined> => {
    const dbCategory = (await getDbResults(`SELECT * FROM permissions WHERE username=${toSqlValue(username)} AND category_id=${categoryID};`))[0];
    if (!dbCategory) return undefined;
    return {
        username: username,
        categoryID: categoryID,
        permission: dbCategory.permission,
        encryptionKey: dbCategory.encryption_key,
    };
};

/** Returns the permissions with the given category id **/
export const getCategoryPermissions = async (categoryID: number): Promise<Permission[]> => {
    const dbCategories = (await getDbResults(`SELECT * FROM permissions WHERE category_id=${categoryID};`));
    return dbCategories.map((dbCategory) => {
        return {
            username: dbCategory.username,
            categoryID: categoryID,
            permission: dbCategory.permission,
            encryptionKey: dbCategory.encryption_key,
        };
    });
};

/** Returns the permissions with the given username **/
export const getUserPermissions = async (username: string): Promise<Permission[]> => {
    const dbCategories = (await getDbResults(`SELECT * FROM permissions WHERE username=${toSqlValue(username)};`));
    return dbCategories.map((dbCategory) => {
        return {
            username: dbCategory.username,
            categoryID: dbCategory.category_id,
            permission: dbCategory.permission,
            encryptionKey: dbCategory.encryption_key,
        };
    });
};

/** Updates or adds a new permission */
export const setPermission = (permission: Permission) => {
    const updateAttr = {
        permission: permission.permission,
        encryption_key: permission.encryptionKey,
    };
    const updateStr = updateOnlyNonNullAttributes(updateAttr);
    runDbCmd(`INSERT INTO permissions VALUES (${toSqlValue(permission.categoryID)}, ${toSqlValue(permission.username)}, ${toSqlValue(permission.permission)}, ${toSqlValue(permission.encryptionKey)}) ${updateStr};`);
};

/** Removes the permission with the given username */
export const rmvPermission = (username: string, categoryID: number): void => {
    runDbCmd(`DELETE FROM permissions WHERE username=${toSqlValue(username)} AND category_id=${categoryID};`);
};

/** Removes the permission with the given username */
export const rmvUserPermissions = (username: string): void => {
    runDbCmd(`DELETE FROM permissions WHERE username=${toSqlValue(username)};`);
};

/** Removes the permission with the given username */
export const rmvCategoryPermissions = (categoryID: number): void => {
    runDbCmd(`DELETE FROM permissions WHERE category_id=${categoryID};`);
};