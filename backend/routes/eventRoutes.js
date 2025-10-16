const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.get('/', eventController.getAllEvents);
router.post('/', eventController.createEvent);
router.get('/profile/:profileId', eventController.getEventsByProfile);
router.get('/:id', eventController.getEvent);
router.put('/:id', eventController.updateEvent);
router.get('/:id/logs', eventController.getEventLogs);

module.exports = router;