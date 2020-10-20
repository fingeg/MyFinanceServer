import {getDbResults, runDbCmd, toSqlValue, updateOnlyNonNullAttributes} from "../utils/database";
import {Split} from "../utils/interfaces";

/** Returns the permission with the given username and category id **/
export const getSplit = async (username: string, categoryID: number): Promise<Split | undefined> => {
    const dbSplit = (await getDbResults(`SELECT * FROM splits WHERE username=${toSqlValue(username)} AND category_id=${categoryID};`))[0];
    if (!dbSplit) return undefined;
    return {
        username: username,
        categoryID: categoryID,
        share: dbSplit.shar,
        isPlatformUser: dbSplit.is_platform_user,
    };
};

/** Returns the permission with the given username and category id **/
export const getCategorySplits = async (categoryID: number): Promise<Split[]> => {
    const dbSplits = (await getDbResults(`SELECT * FROM splits WHERE category_id=${categoryID};`));
    return dbSplits.map((dbSplit) => {
        return {
            username: dbSplit.username,
            categoryID: categoryID,
            share: dbSplit.shar,
            isPlatformUser: dbSplit.is_platform_user,
        };
    });
};

/** Updates or adds a new split */
export const setSplit = (split: Split) => {
    const updateAttr = {
        is_platform_user: split.isPlatformUser,
        share: split.share,
    };
    const updateStr = updateOnlyNonNullAttributes(updateAttr);
    runDbCmd(`INSERT INTO splits VALUES (${toSqlValue(split.categoryID)}, ${toSqlValue(split.username)}, ${toSqlValue(split.share)}, ${toSqlValue(split.isPlatformUser)}) ${updateStr};`);
};

/** Removes the permission with the given username */
export const rmvSplit = (username: string, categoryID: number): void => {
    runDbCmd(`DELETE FROM splits WHERE username=${toSqlValue(username)} AND category_id=${categoryID};`);
};

/** Removes the permission with the given username */
export const rmvCategorySplits = (categoryID: number): void => {
    runDbCmd(`DELETE FROM splits WHERE category_id=${categoryID};`);
};