import express from 'express';
import cors from 'cors';
import {initDatabase} from "./utils/database";
import {addUserInfo, userRouter} from "./authentication/auth_butler";
import {categoryRouter} from "./categories/categories_butler";

const app = express();
app.use(cors());

app.use('/user', userRouter);
app.use(addUserInfo);

app.get('/', (req, res) => {
    res.send('Hello world!');
});

app.use('/category', categoryRouter);

(async () => {
    await initDatabase();
})()

export default app;
