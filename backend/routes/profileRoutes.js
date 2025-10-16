const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');

router.get('/', profileController.getAllProfiles);
router.post('/', profileController.createProfile);
router.get('/:id', profileController.getProfile);

module.exports = router;