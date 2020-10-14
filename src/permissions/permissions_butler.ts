import express from "express";
import bodyParser from "body-parser";
import {Permission} from "../utils/interfaces";
import {getCategory} from "../categories/categories_db";
import {getPermission, rmvPermission, setPermission} from "./permissions_db";
import {getUser} from "../authentication/auth_db";

export const permissionRouter = express.Router();
permissionRouter.use(bodyParser.json());

/**
 * Adds or updates a permission
 *
 * The body has to contain the username, category id, permission level and the encrypted encryption key
 * */
permissionRouter.post('/', async (req, res) => {
    const permission: Permission = req.body;

    // Check if the body is correct
    if (!permission || !permission.categoryID || !permission.username || !permission.permission || !permission.encryptionKey) {
        res.status(400);
        return res.json({status: false});
    }

    // Check if the category exists
    const category = await getCategory(permission.categoryID);
    if (!category) {
        res.status(409);
        return res.json({status: false, error: 'Category does not exists'});
    }

    // Check if the user is the owner of the category
    const ownerPermission = await getPermission(req.user.username, permission.categoryID);
    if (!ownerPermission || ownerPermission.permission != 2) {
        res.status(403);
        return res.json({status: false, error: 'User has to be the owner of the category'});
    }

    // Check if a valid permission is chosen
    if (![0,1].includes(permission.permission)) {
        res.status(409);
        return res.json({status: false, error: 'Only 0 (read-only) or 1 (read/write) permissions are allowed'})
    }

    // Check if the given user exists
    const user = await getUser(permission.username);
    if (!user) {
        res.status(409);
        return res.json({status: false, error: 'Given user does not exists'});
    }

    setPermission(permission);

    return res.json({status: true});
});


/**
 * Deletes a permission
 *
 * The body has to contain the username and the category id
 * */
permissionRouter.delete('/', async (req, res) => {
    const permission: Permission = req.body;

    // Check if the body is correct
    if (!permission.username || !permission.categoryID) {
        res.status(400);
        return res.json({status: false});
    }

    // Check if the user is the owner of the category
    const ownerPermission = await getPermission(req.user.username, permission.categoryID);
    if (!ownerPermission || ownerPermission.permission != 2) {
        res.status(403);
        return res.json({status: false, error: 'User has to be the owner of the category'});
    }

    rmvPermission(permission.username, permission.categoryID);

    return res.json({status: true});
});