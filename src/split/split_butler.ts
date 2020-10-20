import express from "express";
import bodyParser from "body-parser";
import {Split} from "../utils/interfaces";
import {getCategory, updateCategory} from "../categories/categories_db";
import {getUser} from "../authentication/auth_db";
import {getCategorySplits, rmvSplit, setSplit} from "./split_db";
import {getPermission} from "../permissions/permissions_db";

export const splitRouter = express.Router();
splitRouter.use(bodyParser.json());

/**
 * Adds or updates a split
 *
 * The body has to contain a split object
 * */
splitRouter.post('/', async (req, res) => {
    const split: Split = req.body;

    // Check if the body is correct
    if (!split || !split.categoryID || !split.username || !split.share || split.isPlatformUser === undefined) {
        res.status(400);
        return res.json({status: false});
    }

    // Check if the category exists
    const category = await getCategory(split.categoryID);
    if (!category) {
        res.status(409);
        return res.json({status: false, error: 'Category does not exists'});
    }

    // Check if the user is the owner of the category
    const ownerPermission = await getPermission(req.user.username, split.categoryID);
    if (!ownerPermission || ownerPermission.permission != 2) {
        res.status(403);
        return res.json({status: false, error: 'User has to be the owner of the category'});
    }

    // Check if the given user exists
    if (split.isPlatformUser) {
        const user = await getUser(split.username);
        if (!user) {
            res.status(409);
            return res.json({status: false, error: 'Given user does not exists'});
        }
    }

    setSplit(split);

    return res.json({status: true});
});


/**
 * Deletes a split
 *
 * The body has to contain the username and the category id
 * */
splitRouter.delete('/', async (req, res) => {
    const split: Split = req.body;

    // Check if the body is correct
    if (!split.username || !split.categoryID) {
        res.status(400);
        return res.json({status: false});
    }

    // Check if the category exists
    const category = await getCategory(split.categoryID);
    if (!category) {
        res.status(409);
        return res.json({status: false, error: 'Category does not exists'});
    }

    // Check if the user is the owner of the category
    const ownerPermission = await getPermission(req.user.username, split.categoryID);
    if (!ownerPermission || ownerPermission.permission != 2) {
        res.status(403);
        return res.json({status: false, error: 'User has to be the owner of the category'});
    }

    // If the split to delete is the last one for a category, set category splits to false
    const categorySplits = await getCategorySplits(split.categoryID);
    if (categorySplits.length == 1 && categorySplits[0].username == split.username) {
        // The category is no longer split
        category.isSplit = false;
        await updateCategory(category);
    }

    rmvSplit(split.username, split.categoryID);

    return res.json({status: true});
});