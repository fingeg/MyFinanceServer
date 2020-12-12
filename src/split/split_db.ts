import {fromSqlBoolean, getDbResults, runDbCmd, toSqlValue, updateOnlyNonNullAttributes} from "../utils/database";
import {Split} from "../utils/interfaces";

/** Returns the permission with the given username and category id **/
export const getSplit = async (username: string, categoryID: number): Promise<Split | undefined> => {
    const dbSplit = (await getDbResults(`SELECT * FROM splits WHERE username=${toSqlValue(username)} AND category_id=${categoryID};`))[0];
    if (!dbSplit) return undefined;
    return {
        username: username,
        categoryID: categoryID,
        share: dbSplit.share,
        isPlatformUser: fromSqlBoolean(dbSplit.is_platform_user) || false,
        lastEdited: dbSplit.last_edited,
    };
};

/** Returns the permission with the given username and category id **/
export const getCategorySplits = async (categoryID: number): Promise<Split[]> => {
    const dbSplits = (await getDbResults(`SELECT * FROM splits WHERE category_id=${categoryID};`));
    return dbSplits.map((dbSplit) => {
        return {
            username: dbSplit.username,
            categoryID: categoryID,
            share: dbSplit.share,
            isPlatformUser: fromSqlBoolean(dbSplit.is_platform_user) || false,
            lastEdited: dbSplit.last_edited,
        };
    });
};

/** Updates or adds a new split */
export const setSplit = (split: Split) => {
    const updateAttr = {
        is_platform_user: split.isPlatformUser,
        share: split.share,
        last_edited: Date.now(),
    };
    const updateStr = updateOnlyNonNullAttributes(updateAttr);
    runDbCmd(`INSERT INTO splits VALUES (${toSqlValue(split.categoryID)}, ${toSqlValue(split.username)}, ${toSqlValue(split.share)}, ${toSqlValue(split.isPlatformUser)}, ${Date.now()}) ${updateStr};`);
};

/** Removes the permission with the given username */
export const rmvSplit = (username: string, categoryID: number): void => {
    runDbCmd(`DELETE FROM splits WHERE username=${toSqlValue(username)} AND category_id=${categoryID};`);
};

/** Removes the permission with the given username */
export const rmvCategorySplits = (categoryID: number): void => {
    runDbCmd(`DELETE FROM splits WHERE category_id=${categoryID};`);
};