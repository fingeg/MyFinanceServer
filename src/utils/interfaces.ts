
/** One MyFinanceUser **/
export interface User {
    username: string;

    /** In some cases (Only for authentication) the hashed password is added to the user */
    password: string | undefined;
}

/** One finance category **/
export interface Category {
    id: number;
    name: string;
    description: string;
    isSplit: boolean;

    /** Only for api request, not in the database */
    payments: Payment[] | undefined;
    splits: Split[] | undefined;
}

export interface Payment {
    name: string;
    id: number;
    description: string;
    amount: number;
    /** The payment date in ISO format */
    date: string;
    /** The username of the one who payed the price */
    payer: string;
}

export interface Split {
    /** The user the money is shared with */
    username: string;
    /** The share in percent (0 to 1) */
    share: number;

    /** Only for the database, not in request */
    categoryID: number | undefined;
}