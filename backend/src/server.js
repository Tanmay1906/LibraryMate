require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const { PrismaClient } = require('@prisma/client');
const routes = require('./routes');
const swaggerDocument = require('./docs/swagger.json');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.use('/api', routes);
// Reminder routes
const reminderRoutes = require('../routes/reminderRoutes');
app.use('/api/reminders', reminderRoutes);
// Start cron jobs
require('../utils/cronJobs');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => res.send('Library Management Backend Running'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
