const express = require('express');
const router = express.Router();

const { homePage } = require('../controllers/homeController');

router.get('/', homePage);

module.exports = router;