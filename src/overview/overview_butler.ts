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

        // Get all category payments sorted by last edit
        const payments = (await getCategoryPayments(category.id))
            .sort((p1, p2) => (p2.lastEdited || 0) - (p1.lastEdited || 0))

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
            lastEdited: category.lastEdited,
        });
    }
    const sortedCategories = categories.sort((c1, c2) => (c2.lastEdited || 0) - (c1.lastEdited || 0))
    res.json({status: true, categories: sortedCategories});
});