import express from "express";
import bodyParser from "body-parser";
import {Category, Split} from "../utils/interfaces";
import {addCategory, getCategory, rmvCategory, updateCategory} from "./categories_db";
import {getPermission, rmvCategoryPermissions, setPermission} from "../permissions/permissions_db";
import {rmvCategoryPayments} from "../payments/payments_db";
import {rmvCategorySplits, setSplit} from "../split/split_db";

export const categoryRouter = express.Router();
categoryRouter.use(bodyParser.json());

/**
 * Adds a category
 *
 * The body has to contain the category object (Defined in utils/interfaces.ts)
 * */
categoryRouter.post('/', async (req, res) => {
    const category: Category = req.body;

    // Check if the body is correct
    if (!category || !category.name || category.description == undefined || category.isSplit == undefined || (category.id == undefined && !req.body.encryptionKey)) {
        res.status(400);
        return res.json({status: false});
    }

    // If there are any splits set, check if they have the right format
    const splits: Split[] = req.body.splits;
    if (category.isSplit && splits) {
        for (const split of splits) {
            if (!split.username || !split.share || split.isPlatformUser == undefined) {
                res.status(400);
                return res.json({status: false});
            }
        }
    }

    // Add or update the category
    let id: number;
    if (category.id == undefined) {
        id = await addCategory(category);
    } else {
        // Check if the user is the owner
        const permission = await getPermission(req.user.username, category.id);
        if (!permission || permission.permission != 2) {
            res.status(403) //403: Forbidden
            return res.json({status: false, error: 'The user has to be the owner of the category'});
        }

        id = category.id;
        await updateCategory(category);
    }

    // Add the logged in user as category owner
    if (req.body.encryptionKey) {
        setPermission({
            username: req.user.username,
            categoryID: id,
            permission: 2,
            encryptionKey: req.body.encryptionKey,
            lastEdited: undefined,
        });
    }

    // Add/Update splits
    if (category.isSplit) {
        // If this is a category update, remove all old splits
        if (category.id != undefined) {
            rmvCategorySplits(category.id);
        }

        // Set new splits
        splits.forEach((split) => {
            split.categoryID = category.id == undefined ? id : category.id;
            setSplit(split);
        });
    }

    return res.json({status: true, categoryID: id});
});


/**
 * Returns a category
 */
categoryRouter.get('/:id', async (req, res) => {
    const id = parseInt(req.params.id);

    if (id == undefined) {
        res.status(400);
        res.json({status: false});
    }

    const permission = await getPermission(req.user.username, id);
    if (!permission) {
        res.status(403);
        return res.json({status: false});
    }

    const category = await getCategory(id);
    return res.json({category: category, encryptionKey: permission.encryptionKey});
});

/**
 * Deletes a category
 *
 * The body has to contain the category id
 * */
categoryRouter.delete('/', async (req, res) => {
    const category: Category = req.body;

    // Check if the body is correct
    if (category.id == undefined) {
        res.status(400);
        return res.json({status: false});
    }

    // Check if the user is the owner
    const permission = await getPermission(req.user.username, category.id);
    if (!permission || permission.permission != 2) {
        res.status(403) //403: Forbidden
        return res.json({status: false, error: 'The user has to be the owner of the category'});
    }

    // Remove the category and all related entries
    await rmvCategory(category.id);
    rmvCategoryPermissions(category.id);
    rmvCategoryPayments(category.id);

    return res.json({status: true});
});