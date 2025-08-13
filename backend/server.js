const express = require('express');
require('dotenv').config();
const cors = require('cors');
require('./config/db');
const app = express();
const httpServer = require('http');
const { ServerSocket } = require('./services/ServerSocket');
const server = httpServer.createServer(app);

// server connection 
ServerSocket(server);


const partRoutes = require('./routes/partRoute')
const productRoutes = require('./routes/productRoute');
const userRoutes = require('./routes/userRoute');
const QRRoutes = require('./routes/QRRoutes');
const dailyInventoryRoutes = require('./routes/dailyInventoryRoute');
const activityRoutes = require('./routes/activityRoute');
const scanningActivityRoutes = require('./routes/scanningActivityRoute');
const dnsJobCardRoutes = require('./routes/dnsJobCardRoute');
const { initializeCronJobs } = require('./services/cronJobs');


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.get('/', (req, res) => {
    res.send('Welcome to ERP Server..');
})

app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});


app.use('/api/ERP', partRoutes);
app.use('/api/ERP', productRoutes);
app.use('/api/ERP', userRoutes);
app.use('/api/ERP', QRRoutes);
app.use('/api/ERP/daily-inventory', dailyInventoryRoutes);
app.use('/api/ERP/activities', activityRoutes);
app.use('/api/ERP/scanning', scanningActivityRoutes);
app.use('/api/ERP/dns-job-cards', dnsJobCardRoutes);




const PORT = process.env.PORT;

server.listen(PORT, () => {
    console.log("Server is running on port ", PORT);

    // Initialize daily inventory cron jobs
    initializeCronJobs();
})







