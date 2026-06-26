const express = require('express');
const app = express();

const homeRoutes = require('./routers/homeRouter');
const logger = require('./middleware/logger');

// Middleware (runs for every request)
app.use(logger);

// Routes
app.use('/', homeRoutes);

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});