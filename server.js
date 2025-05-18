require('dotenv').config();
const connectDb = require('./config/db');
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const errorMiddleware = require('./middleware/errorMiddleware');
const studentRoutes = require('./routes/studentRoutes');
const lecturerRoutes = require('./routes/lecturerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const limiter = require('./middleware/rateLimiter');

const app = express();
const deployedFrontendURL = process.env.DEPLOYED_FRONTEND_URL;
app.use(cors({
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PUT'],
    origin: ['http://localhost:5173', deployedFrontendURL]
}));
app.use(cookieParser());
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/lecturer', lecturerRoutes);
app.use(errorMiddleware);
app.use(limiter); 
app.set('trust proxy', 1);  

app.get('/', (req, res) => {
    res.send('Server is running successfully');
});

const server = http.createServer(app);
const port = process.env.PORT;
connectDb().then(() => {
    server.listen(port, () => {
        console.log(`Server listening at port: ${port}`)
    });
}).catch((error) => {
    console.log(`Error: ${error}`);
});