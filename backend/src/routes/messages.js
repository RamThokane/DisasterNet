const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  sendMessageValidation,
  uploadFile,
  upload,
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

router.get('/:roomId', protect, getMessages);
router.post('/:roomId', protect, sendMessageValidation, validate, sendMessage);
router.post('/:roomId/upload', protect, upload.single('file'), uploadFile);

module.exports = router;
