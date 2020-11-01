import express from "express";
import bodyParser from "body-parser";
import {Payment} from "../utils/interfaces";
import {getCategory} from "../categories/categories_db";
import {getPermission} from "../permissions/permissions_db";
import {getPayment, rmvPayment, setPayment} from "./payments_db";

export const paymentsRouter = express.Router();
paymentsRouter.use(bodyParser.json());

/**
 * Adds or updates a payment
 *
 * The body has to contain a payment object (Only the id is not needed)
 * */
paymentsRouter.post('/', async (req, res) => {
    const payment: Payment = req.body;

    // Check if the body is correct
    if (!payment || payment.categoryID == undefined || !payment.name || payment.description == undefined || payment.amount == undefined || !payment.date || !payment.payer || payment.payed == undefined) {
        res.status(400);
        return res.json({status: false});
    }

    // Check if the category exists
    const category = await getCategory(payment.categoryID);
    if (!category) {
        res.status(409);
        return res.json({status: false, error: 'Category does not exists'});
    }

    // Check if the user has the required rights for the category
    const ownerPermission = await getPermission(req.user.username, payment.categoryID);
    if (!ownerPermission || ownerPermission.permission < 1) {
        res.status(403);
        return res.json({status: false, error: 'Write rights are required'});
    }

    if (payment.id) {
        const currentPayment = await getPayment(payment.id);
        if (!currentPayment || currentPayment.categoryID != category.id) {
            res.status(409);
            return res.json({status: false, error: 'Given id is invalid'});
        }
    }

    const id = await setPayment(payment);

    return res.json({status: true, id: id});
});


/**
 * Deletes a payment
 *
 * The body has to contain the payment id
 * */
paymentsRouter.delete('/', async (req, res) => {
    const paymentID = req.body.id;

    // Check if the body is correct
    if (paymentID == undefined) {
        res.status(400);
        return res.json({status: false});
    }

    // Check if the payment id is correct
    const payment = await getPayment(paymentID);
    if (!payment) {
        res.status(409);
        return res.json({status: false, error: 'There is no payment with the given id'});
    }

    // Check if the user has write rights
    const permission = await getPermission(req.user.username, payment.categoryID);
    if (!permission || permission.permission < 1) {
        res.status(403);
        return res.json({status: false, error: 'User needs write rights to delete a payment'});
    }

    rmvPayment(paymentID);

    return res.json({status: true});
});