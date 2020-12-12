import {fromSqlBoolean, getDbResults, runDbCmd, toSqlValue, updateOnlyNonNullAttributes} from "../utils/database";
import {Category} from "../utils/interfaces";

/** Returns the category with the given id **/
export const getCategory = async (id: number): Promise<Category | undefined> => {
    const dbCategory = (await getDbResults(`SELECT * FROM categories WHERE id=${id};`))[0];
    if (!dbCategory) return undefined;
    return {
        id: dbCategory.id,
        name: dbCategory.name,
        description: dbCategory.description,
        isSplit: fromSqlBoolean(dbCategory.is_split) || false,
        lastEdited: dbCategory.last_edited,
    };
};

/** Updates or adds a new category */
export const addCategory = async (category: Category): Promise<number> => {
    const result: any = await getDbResults(`INSERT INTO categories VALUES (NULL, ${toSqlValue(category.name)}, ${toSqlValue(category.description)}, ${category.isSplit}, ${Date.now()});`);
    return result.insertId;
};

/** Updates or adds a new category */
export const updateCategory = async (category: Category): Promise<number | undefined> => {
    const updateAttr = {
        name: category.name,
        description: category.description,
        is_split: category.isSplit,
        last_edited: Date.now(),
    };
    const updateStr = updateOnlyNonNullAttributes(updateAttr);
    const result: any = await getDbResults(`INSERT INTO categories VALUES (${toSqlValue(category.id)}, ${toSqlValue(category.name)}, ${toSqlValue(category.description)}, ${category.isSplit}, ${Date.now()}) ${updateStr};`);
    if (result) {
        return result.insertId;
    }
    return undefined;
};

/** Updates the last edited of a category */
export const updateCategoryTimestamp = (categoryID: number) => {
    runDbCmd(`UPDATE categories SET last_edited = ${Date.now()} WHERE id = ${categoryID};`);
};

/** Removes the category with the given id
 *
 * Before this happens, id should be checked if there multiple users for one category.
 * If so, then just delete the users permission and not the category!
 * */
export const rmvCategory = (id: number): void => {
    runDbCmd(`DELETE FROM categories WHERE id=${id};`);
};