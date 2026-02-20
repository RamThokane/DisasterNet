const { body } = require('express-validator');
const Room = require('../models/Room');

/**
 * Validation rules
 */
const createRoomValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Room name must be between 2 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description cannot exceed 200 characters'),
];

/**
 * @route   POST /api/rooms
 * @desc    Create a new room
 * @access  Private
 */
const createRoom = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const existingRoom = await Room.findOne({ name });
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        error: 'Room with this name already exists',
      });
    }

    const room = await Room.create({
      name,
      description: description || '',
      createdBy: req.user._id,
      participants: [req.user._id],
    });

    res.status(201).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/rooms
 * @desc    Get all rooms
 * @access  Private
 */
const getRooms = async (req, res, next) => {
  try {
    const rooms = await Room.find()
      .populate('createdBy', 'username')
      .populate('participants', 'username isOnline')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/rooms/:id
 * @desc    Get a single room
 * @access  Private
 */
const getRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('participants', 'username isOnline');

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
      });
    }

    res.status(200).json({
      success: true,
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/rooms/:id/join
 * @desc    Join a room
 * @access  Private
 */
const joinRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
      });
    }

    const userId = req.user._id;
    const isParticipant = room.participants.some(
      (p) => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      room.participants.push(userId);
      await room.save();
    }

    const populated = await room.populate('participants', 'username isOnline');

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/rooms/:id/leave
 * @desc    Leave a room
 * @access  Private
 */
const leaveRoom = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        error: 'Room not found',
      });
    }

    room.participants = room.participants.filter(
      (p) => p.toString() !== req.user._id.toString()
    );
    await room.save();

    res.status(200).json({
      success: true,
      data: { message: 'Left room successfully' },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  getRooms,
  getRoom,
  joinRoom,
  leaveRoom,
  createRoomValidation,
};
