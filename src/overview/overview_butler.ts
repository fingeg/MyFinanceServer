import express from "express";
import {getUserPermissions} from "../permissions/permissions_db";
import {CategoryOverview, Split} from "../utils/interfaces";
import {getCategory} from "../categories/categories_db";
import {getCategorySplits} from "../split/split_db";
import {getCategoryPayments} from "../payments/payments_db";

export const overviewRouter = express.Router();

overviewRouter.get('/', async (req, res) => {
    const user: string = req.user.username;

    // Get all categories for this user
    const permissions = await getUserPermissions(user);
    const categories: CategoryOverview[] = [];

    for (const permission of permissions) {
        const category = await getCategory(permission.categoryID);

        if (!category) {
            console.error('Category to permission not found: ' + permission.categoryID);
            continue;
        }

        // Get all category payments
        const payments = await getCategoryPayments(category.id);

        // Get the category splits
        let splits: Split[] | undefined;
        if (category.isSplit) {
            splits = await getCategorySplits(category.id);
        }

        categories.push({
            id: category.id,
            name: category.name,
            description: category.description,
            isSplit: category.isSplit,
            permission: permission.permission,
            payments: payments,
            splits: splits,
            encryptionKey: permission.encryptionKey,
        });
    }

    res.json({status: true, categories: categories});
});