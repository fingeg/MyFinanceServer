
// Extend the default request
import express, {Request} from "express";
import {getUser, rmvUser, setUser} from "./auth_db";
import crypto from "crypto";
import {User} from "../utils/interfaces";
import bodyParser from "body-parser";

declare global {
    namespace Express {
        export interface Request {
            user: {
                username: string
            }
        }
    }
}

export const userRouter = express.Router();
userRouter.use(bodyParser.json());

/**
 * Register a user.
 *
 * The default http auth is used for the registration process (error 400).
 *
 * The password has to be at least 5 characters long (error 406).
 *
 * The username has to be new (error 409).
 * */
userRouter.put('/', async (req, res) => {
    const auth = getAuth(req);
    const user: User = {
        username: auth.username,
        password: auth.password,
    };

    // Check if the parameters are set
    if (!user.username || !user.password) {
        res.status(400);
        return res.json({status: false});
    }

    // Check if password meets the requirements
    if (user.password.length < 5) {
        res.status(406); //406: HTTP-Not acceptable
        res.json({status: false});
    }

    // Check if the username already exists
    const currentUser = await getUser(user.username);
    if (currentUser) {
        res.status(409); //409: HTTP-Conflict
        return res.json({status: false});
    }

    // Hash the user password
    user.password = crypto.createHash('sha1').update(user.password).digest('hex');

    // Save the user
    setUser(user);
    return res.json({status: true});
});

/**
 * Change the user password.
 *
 * Put the newPassword attribute in the body (error 400)
 *
 * The password has to be at least 5 characters long (error 406).
 * */
userRouter.post('/', async (req, res) => {
    await addUserInfo(req, res, async () => {
        const newPassword: string = req.body.newPassword;

        // Check if the new passwort is set
        if (!newPassword) {
            res.status(400);
            return res.json({status: false});
        }

        // Check if password meets the requirements
        if (newPassword.length < 5) {
            res.status(406); //406: HTTP-Not acceptable
            res.json({status: false});
        }

        // Check if the username exists
        const currentUser = await getUser(req.user.username);
        if (!currentUser) {
            res.status(409); //409: HTTP-Conflict
            return res.json({status: false});
        }

        // Hash the user password
        const hashedPassword = crypto.createHash('sha1').update(newPassword).digest('hex');

        // Save the user
        setUser({
            username: req.user.username,
            password: hashedPassword,
        });
        return res.json({status: true});
    });
});

/** Delete a user */
userRouter.delete('/', async (req, res) => {
    await addUserInfo(req, res, () => {
        rmvUser(req.user.username);
        return res.json({status: true});
    });
});

const getAuth = (req: any): { username: string, password: string } => {
    if (req.headers.authorization) {
        const base64Credentials = req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');
        return {username: username, password: password};
    } else {
        return {username: '', password: ''};
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
    const hashedPassword = crypto.createHash('sha1').update(auth.password).digest('hex');

    // If everything checks out, add the login data to the request
    if (user && hashedPassword == user.password) {

        req.user = {
            username: auth.username,
        }

        next();
    } else {
        res.status(401);
        const challengeString = 'Basic';
        res.set('WWW-Authenticate', challengeString);
        res.json({error: 'unauthorized'});
    }
}