import express from 'express';
import cors from 'cors';
import {initDatabase} from "./utils/database";
import {addUserInfo, userRouter} from "./authentication/auth_butler";
import {categoryRouter} from "./categories/categories_butler";
import {permissionRouter} from "./permissions/permissions_butler";
import {paymentsRouter} from "./payments/payments_butler";
import {splitRouter} from "./split/split_butler";
import {overviewRouter} from "./overview/overview_butler";

const app = express();
app.use(cors());

app.use('/user', userRouter);
app.use(addUserInfo);

app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.use('/category', categoryRouter);
app.use('/permission', permissionRouter);
app.use('/payment', paymentsRouter);
app.use('/split', splitRouter);
app.use('/overview', overviewRouter);

(async () => {
    await initDatabase();
})()

export default app;
