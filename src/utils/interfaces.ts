
/** One MyFinanceUser **/
export interface User {
    username: string;

    /** In some cases (Only for authentication) the hashed password is added to the user */
    password: string | undefined;
}