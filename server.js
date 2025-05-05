require('dotenv').config();
const connectDb = require('./config/db');
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();
const deployedFrontendURL = process.env.DEPLOYED_FRONTEND_URL;
app.use(cors({
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    origin: ['http://localhost:5173', deployedFrontendURL]
}));
app.use(cookieParser());
app.use(express.json());
const server = http.createServer(app);
const port = process.env.PORT;
connectDb().then(() => {
    server.listen(port, () => {
        console.log(`Server listening at port: ${port}`)
    });
}).catch((error) => {
    console.log(`Error: ${error}`);
});