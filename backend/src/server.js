require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/collection', require('./routes/collection'));
app.use('/api/agent', require('./routes/agent'));
app.use('/api/prices', require('./routes/prices'));

app.get('/health', (req, res) => res.json({ status: 'ok', civic: !!process.env.CIVIC_API_KEY }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
