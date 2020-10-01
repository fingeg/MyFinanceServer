import express from "express";
import bodyParser from "body-parser";
import {Category} from "../utils/interfaces";
import {addCategory, rmvCategory, updateCategory} from "./categories_db";

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
    if (!category || !category.name || !category.description || category.isSplit == undefined) {
        res.status(400);
        return res.json({status: false});
    }

    const id = await addCategory(category);

    return res.json({status: true, categoryID: id});
});

/**
 * Updates a category
 *
 * The body has to contain the category object (Defined in utils/interfaces.ts)
 * */
categoryRouter.put('/', async (req, res) => {
    const category: Category = req.body;

    // Check if the body is correct
    if (!category || !category.id || !category.name || !category.description || category.isSplit == undefined) {
        res.status(400);
        return res.json({status: false});
    }

    //TODO: Check if the user has the necessary permissions
    if (false) {
        res.status(403) //403: Forbidden
        return res.json({status: false});
    }

    const id = await updateCategory(category);

    return res.json({status: true});
});

/**
 * Deletes a category
 *
 * The body has to contain the category id
 * */
categoryRouter.delete('/', async (req, res) => {
    const category: Category = req.body;

    // Check if the body is correct
    if (!category.id) {
        res.status(400);
        return res.json({status: false});
    }

    //TODO: Check if the user has the necessary permissions
    if (false) {
        res.status(403) //403: Forbidden
        return res.json({status: false});
    }

    await rmvCategory(category.id);

    return res.json({status: true});
});