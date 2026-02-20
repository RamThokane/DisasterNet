const path = require('path');
const { body } = require('express-validator');
const multer = require('multer');
const Message = require('../models/Message');
const Room = require('../models/Room');

// ─── Multer config for file uploads ──────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Allow images, documents, audio, video, archives
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv',
    'application/zip', 'application/x-rar-compressed', 'application/gzip',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'video/mp4', 'video/webm', 'video/ogg',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});

/**
 * Validation rules
 */
const sendMessageValidation = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ max: 2000 })
    .withMessage('Message cannot exceed 2000 characters'),
];

/**
 * @route   GET /api/messages/:roomId
 * @desc    Get all messages in a room
 * @access  Private
 */
const getMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
      });
    }

    const messages = await Message.find({ room: roomId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username')
      .lean();

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /messages
 * @desc    Get all messages (legacy endpoint matching Go API — returns string array)
 * @access  Public (matches original Go behavior)
 */
const getMessagesLegacy = async (req, res, next) => {
  try {
    // Find the default chat-room
    let room = await Room.findOne({ name: 'chat-room' });
    if (!room) {
      return res.status(200).json([]);
    }

    const messages = await Message.find({ room: room._id })
      .sort({ createdAt: 1 })
      .lean();

    // Return as string array to match original Go API format
    const messageStrings = messages.map((m) => {
      const time = new Date(m.createdAt).toLocaleString();
      return `Received message at ${time} from ${m.senderNick}: ${m.message}`;
    });

    res.status(200).json(messageStrings);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /send
 * @desc    Send a message (legacy endpoint matching Go API)
 * @access  Public (matches original Go behavior)
 */
const postMessageLegacy = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json('failed to decode');
    }

    // Find or create default room
    let room = await Room.findOne({ name: 'chat-room' });
    if (!room) {
      return res.status(500).json('Room not found');
    }

    const msg = await Message.create({
      message: message.trim(),
      senderNick: 'Anonymous',
      senderId: room.createdBy,
      room: room._id,
    });

    // Emit via Socket.io if available
    const io = req.app.get('io');
    if (io) {
      io.to(room._id.toString()).emit('new-message', {
        _id: msg._id,
        message: msg.message,
        senderNick: msg.senderNick,
        senderId: msg.senderId,
        room: msg.room,
        createdAt: msg.createdAt,
      });
    }

    res.status(200).end();
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/messages/:roomId
 * @desc    Send a message to a room (new MERN API)
 * @access  Private
 */
const sendMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { message } = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
      });
    }

    const msg = await Message.create({
      message: message.trim(),
      senderNick: req.user.username,
      senderId: req.user._id,
      room: roomId,
    });

    const populated = await msg.populate('senderId', 'username');

    // Emit via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('new-message', {
        _id: populated._id,
        message: populated.message,
        senderNick: populated.senderNick,
        senderId: populated.senderId,
        room: populated.room,
        createdAt: populated.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/messages/:roomId/upload
 * @desc    Upload a file to a room
 * @access  Private
 */
const uploadFile = async (req, res, next) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    const isImage = req.file.mimetype.startsWith('image/');

    const msg = await Message.create({
      message: req.body.caption || req.file.originalname,
      messageType: isImage ? 'image' : 'file',
      file: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`,
      },
      senderNick: req.user.username,
      senderId: req.user._id,
      room: roomId,
    });

    const populated = await msg.populate('senderId', 'username');

    // Emit via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(roomId).emit('new-message', {
        _id: populated._id,
        message: populated.message,
        messageType: populated.messageType,
        file: populated.file,
        senderNick: populated.senderNick,
        senderId: populated.senderId,
        room: populated.room,
        createdAt: populated.createdAt,
      });
    }

    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMessages,
  getMessagesLegacy,
  postMessageLegacy,
  sendMessage,
  sendMessageValidation,
  uploadFile,
  upload,
};
