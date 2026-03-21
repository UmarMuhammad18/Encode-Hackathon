require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/collection', authMiddleware, require('./routes/collection'));
app.use('/api/prices', authMiddleware, require('./routes/prices'));
app.use('/api/agent', authMiddleware, require('./routes/agent'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
