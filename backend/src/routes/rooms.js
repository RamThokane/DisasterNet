const express = require('express');
const router = express.Router();
const {
  createRoom,
  getRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  createRoomValidation,
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/', protect, getRooms);
router.post('/', protect, createRoomValidation, validate, createRoom);
router.get('/:id', protect, getRoom);
router.post('/:id/join', protect, joinRoom);
router.post('/:id/leave', protect, leaveRoom);

module.exports = router;
