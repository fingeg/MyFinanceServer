import {getDbResults, runDbCmd, toSqlValue, updateOnlyNonNullAttributes} from "../utils/database";
import {Payment} from "../utils/interfaces";

/** Returns the payment with the given id **/
export const getPayment = async (id: number): Promise<Payment | undefined> => {
    const dbPayment = (await getDbResults(`SELECT * FROM payments WHERE id=${toSqlValue(id)};`))[0];
    if (!dbPayment) return undefined;
    return {
        id: id,
        name: dbPayment.name,
        description: dbPayment.description,
        amount: dbPayment.amount,
        payer: dbPayment.payer,
        date: dbPayment.date,
        categoryID: dbPayment.category_id,
    };
};

/** Returns the payment with the given id **/
export const getCategoryPayments = async (categoryID: number): Promise<Payment[] | undefined> => {
    const dbPayments = (await getDbResults(`SELECT * FROM payments WHERE category_id=${toSqlValue(categoryID)};`));
    if (!dbPayments) return undefined;

    return dbPayments.map((dbPayment) => {
        return {
            id: dbPayment.id,
            name: dbPayment.name,
            description: dbPayment.description,
            amount: dbPayment.amount,
            payer: dbPayment.payer,
            date: dbPayment.date,
            categoryID: dbPayment.category_id,
        };
    });
};

/** Updates or adds a new payment */
export const setPayment = (payment: Payment) => {
    const updateAttr = {
        amount: payment.amount,
        name: payment.name,
        description: payment.description,
        date: payment.date,
        payer: payment.payer,
    };
    const updateStr = updateOnlyNonNullAttributes(updateAttr);
    runDbCmd(`INSERT INTO payments VALUES (${toSqlValue(payment.id)}, ${toSqlValue(payment.categoryID)}, ${toSqlValue(payment.name)}, ${toSqlValue(payment.description)}, ${toSqlValue(payment.amount)}, ${toSqlValue(payment.date)}, ${toSqlValue(payment.payer)}) ${updateStr};`);
};

/** Removes the payment with the given id */
export const rmvPayment = (id: number): void => {
    runDbCmd(`DELETE FROM payments WHERE id=${toSqlValue(id)};`);
};

/** Removes the payments with the given category id */
export const rmvCategoryPayments = (category_id: number): void => {
    runDbCmd(`DELETE FROM payments WHERE category_id=${toSqlValue(category_id)};`);
};