
/** One MyFinanceUser **/
export interface User {
    username: string;

    /** Only for authentication: */
    salt: string | undefined;
    verifier: string | undefined;

    /** Only for de- and encryption */
    privateKey: string; // Encrypted version (Only the client can decrypt it)
    publicKey: string; // Unencrypted version (Everyone can use it to encrypt category keys)

    /** UTC-Timestamp */
    registered: number;
}

/** One finance category **/
export interface Category {
    id: number;
    name: string;
    description: string;
    isSplit: boolean;
    /** UTC-Timestamp */
    lastEdited: number;
}

export interface CategoryOverview {
    id: number;
    name: string;
    description: string;
    isSplit: boolean;
    payments: Payment[];
    splits: Split[] | undefined;
    permission: number | undefined;
    encryptionKey: string;
    /** UTC-Timestamp */
    lastEdited: number;
}

/** A permission specific for one user and category */
export interface Permission {
    categoryID: number;
    username: string;
    /** The level of permission:
     * 0: Read-only,
     * 1: Read/Write,
     * 2: Owner
     * */
    permission: number;
    /** The base64 encoded and with the users public key encrypted category key to de- and encrypt the category data */
    encryptionKey: string;
    /** UTC-Timestamp */
    lastEdited: number | undefined;
}

export interface Payment {
    name: string;
    id: number;
    description: string;
    amount: number;
    /** The payment date as YYYY-MM-DD */
    date: string;
    /** The username of the one who payed the price */
    payer: string;
    categoryID: number;
    payed: boolean;
    /** UTC-Timestamp */
    lastEdited: number | undefined;
}

export interface Split {
    /** The user the money is shared with */
    username: string;
    /** The share in percent (0 to 1) */
    share: number;
    /** If the given user is also a MyFinance user */
    isPlatformUser: boolean;

    /** Only for the database, not in request */
    categoryID: number | undefined;

    /** UTC-Timestamp */
    lastEdited: number;
}

export interface Login {
    username: string;
    id: number | undefined;
    serverEphemeral: string;
    clientEphemeral: string;
    sessionProof: string | undefined;
}