
// Extend the default request
import express, {Request} from "express";
import {getLogin, getUser, rmvLogin, rmvUser, rmvUserLogins, setLogin, setUser} from "./auth_db";
import {User} from "../utils/interfaces";
import bodyParser from "body-parser";
import {generateEphemeral, deriveSession} from 'secure-remote-password/server';

declare global {
    namespace Express {
        export interface Request {
            user: {
                username: string,
                salt: string,
                verifier: string,
                sessionID: number,
            }
        }
    }
}

export const userRouter = express.Router();
userRouter.use(bodyParser.json());

/**
 * Register a user.
 *
 * The body has to contain the username, a salt and a verifier (SRP protocol) (Error 400)
 *
 * The username has to be new (error 409).
 * */
userRouter.put('/', async (req, res) => {

    const user: User = {
        username: req.body.username,
        salt: req.body.salt,
        verifier: req.body.verifier,
    };

    // Check if the parameters are set
    if (!user.username || !user.salt || !user.verifier) {
        res.status(400);
        return res.json({status: false});
    }

    // Check if the username already exists
    const currentUser = await getUser(user.username);
    if (currentUser) {
        res.status(409); //409: HTTP-Conflict
        return res.json({status: false});
    }

    // Save the user
    setUser(user);
    return res.json({status: true});
});

/**
 * Change the user password.
 *
 * The body has to contain the salt and the verifier (SRP-Protocol) (Error 400)
 *
 * The password has to be at least 5 characters long (error 406).
 * */
userRouter.post('/', async (req, res) => {
    await addUserInfo(req, res, async () => {
        const user: User = {
            username: req.user.username,
            salt: req.body.salt,
            verifier: req.body.verifier,
        };

        // Check if the parameters are set
        if (!user.salt || !user.verifier) {
            res.status(400);
            return res.json({status: false});
        }

        // Check if the username exists
        const currentUser = await getUser(req.user.username);
        if (!currentUser) {
            res.status(409); //409: HTTP-Conflict
            return res.json({status: false});
        }

        // Save the user
        setUser(user);

        // Delete current sessions (All sessions get invalid with the new password)
        rmvUserLogins(user.username);

        return res.json({status: true});
    });
});

/** Delete a user */
userRouter.delete('/', async (req, res) => {
    await addUserInfo(req, res, () => {
        rmvUser(req.user.username);
        rmvUserLogins(req.user.username);
        return res.json({status: true});
    });
});

/**
 * The login process every device has to do for the first connection to get a valid session key
 *
 * The request has to be done twice for one successful login (SRP-Protocol)
 *
 * The first request:
 *  - body has to contain username and the client ephemeral
 *  - gets the salt, the server ephemeral and the login id
 *
 * The second request:
 *  - body has to contain the client session key proof, the login id and the username
 *  - gets the server session key proof and the login status
 */
userRouter.post('/login', async (req, res) => {
    const loginID: number = req.body.id;
    const username: string = req.body.username;

    // If this is the first of two requests
    if (!loginID) {
        const clientEphemeral: string = req.body.ephemeral;

        // Check if the parameters are set
        if (!username || !clientEphemeral) {
            res.status(400);
            return res.json({status: false});
        }

        const user = await getUser(username);
        if (!user || !user.verifier) {
            res.status(409); //409: HTTP-Conflict
            return res.json({status: false});
        }

        const serverEphemeral = generateEphemeral(user.verifier);

        // Save the session
        const id = await setLogin({
            username: username,
            id: undefined,
            serverEphemeral: serverEphemeral.secret,
            clientEphemeral: clientEphemeral,
            sessionProof: undefined,
        });

        return res.json({status: true, loginID: id, serverEphemeral: serverEphemeral.public, salt: user.salt});
    }

    // If this is already the second one
    else {
        const sessionProof = req.body.sessionProof;

        // Check if the parameters are set
        if (!username || !sessionProof) {
            res.status(400);
            return res.json({status: false});
        }

        const user = await getUser(username);
        const loginSession = await getLogin(loginID);

        if (!user || !user.salt || !user.verifier || !loginSession) {
            res.status(409); //409: HTTP-Conflict
            return res.json({status: false});
        }

        try {
            const serverSession = deriveSession(
                loginSession.serverEphemeral,
                loginSession.clientEphemeral,
                user.salt,
                user.username,
                user.verifier,
                sessionProof
            );

            loginSession.sessionProof = sessionProof;
            await setLogin(loginSession);

            return res.json({status: true, loginID: loginID, sessionProof: serverSession.proof});
        } catch (e) {
            console.log(`Login failed: ${e}`)

            // Delete failed login attempt from the database
            if (!loginSession.sessionProof && loginSession.id) {
                rmvLogin(loginSession.id);
            }

            res.status(401);
            return res.json({status: false});
        }
    }
});

const getAuth = (req: any): { username: string, sessionProof: string, sessionID: number } => {
    if (req.headers.authorization) {
        const base64Credentials = req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, sessionProof] = credentials.split(':');
        return {username: username, sessionProof: sessionProof, sessionID: parseInt(req.headers.session_id)};
    } else {
        return {username: '', sessionProof: '', sessionID: 0};
    }
};

/** Check the login credentials and add them to the request if they are correct */
export async function addUserInfo(req: Request, res: any, next: () => any) {

    // If the login data was already added, do not continue
    if (req.user) {
        return;
    }

    // Give the registration requests a free pass
    if (req.path.endsWith('/register')) {
        return;
    }

    // Get the given and stored login data
    const auth = getAuth(req);
    const user = await getUser(auth.username);
    const login = await getLogin(auth.sessionID);

    // If everything checks out, add the login data to the request
    if (user && login && user.salt && user.verifier) {
        try {
            deriveSession(
                login.serverEphemeral,
                login.clientEphemeral,
                user.salt,
                user.username,
                user.verifier,
                auth.sessionProof
            );

            req.user = {
                username: auth.username,
                salt: user.verifier,
                verifier: user.verifier,
                sessionID: auth.sessionID,
            }

            next();
        } catch (e) {
            console.log(`Auth failed: ${e}`);
            res.status(401);
            res.json({error: 'unauthorized'});
        }
    } else {
        res.status(401);
        res.json({error: 'unauthorized'});
    }
}