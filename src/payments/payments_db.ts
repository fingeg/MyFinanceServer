import {
    fromSqlBoolean,
    getDbResults,
    runDbCmd,
    toSqlValue,
    unescapeString,
    updateOnlyNonNullAttributes
} from "../utils/database";
import {Payment} from "../utils/interfaces";

/** Returns the payment with the given id **/
export const getPayment = async (id: number): Promise<Payment | undefined> => {
    const dbPayment = (await getDbResults(`SELECT * FROM payments WHERE id=${toSqlValue(id)};`))[0];
    if (!dbPayment) return undefined;
    return {
        id: id,
        name: unescapeString(dbPayment.name),
        description: unescapeString(dbPayment.description),
        amount: dbPayment.amount,
        payer: unescapeString(dbPayment.payer),
        date: dbPayment.date,
        categoryID: dbPayment.category_id,
        payed: fromSqlBoolean(dbPayment.payed) || false,
        lastEdited: dbPayment.last_edited,
    };
};

/** Returns the payment with the given id **/
export const getCategoryPayments = async (categoryID: number): Promise<Payment[]> => {
    const dbPayments = (await getDbResults(`SELECT * FROM payments WHERE category_id=${toSqlValue(categoryID)};`));

    return dbPayments.map((dbPayment) => {
        return {
            id: dbPayment.id,
            name: unescapeString(dbPayment.name),
            description: unescapeString(dbPayment.description),
            amount: dbPayment.amount,
            payer: unescapeString(dbPayment.payer),
            date: dbPayment.date,
            categoryID: dbPayment.category_id,
            payed: fromSqlBoolean(dbPayment.payed) || false,
            lastEdited: dbPayment.last_edited,
        };
    });
};

/** Updates or adds a new payment */
export const setPayment = async (payment: Payment): Promise<number> => {
    const updateAttr = {
        amount: payment.amount,
        name: payment.name,
        description: payment.description,
        date: payment.date,
        payer: payment.payer,
        payed: payment.payed,
        last_edited: Date.now(),
    };
    const updateStr = updateOnlyNonNullAttributes(updateAttr);
    const res: any = await getDbResults(`INSERT INTO payments VALUES (${toSqlValue(payment.id)}, ${toSqlValue(payment.categoryID)}, ${toSqlValue(payment.name)}, ${toSqlValue(payment.description)}, ${toSqlValue(payment.amount)}, ${toSqlValue(payment.date)}, ${toSqlValue(payment.payer)}, ${toSqlValue(payment.payed)}, ${Date.now()}) ${updateStr};`);
    return res.insertId;
};

/** Removes the payment with the given id */
export const rmvPayment = (id: number): void => {
    runDbCmd(`DELETE FROM payments WHERE id=${toSqlValue(id)};`);
};

/** Removes the payments with the given category id */
export const rmvCategoryPayments = (category_id: number): void => {
    runDbCmd(`DELETE FROM payments WHERE category_id=${toSqlValue(category_id)};`);
};