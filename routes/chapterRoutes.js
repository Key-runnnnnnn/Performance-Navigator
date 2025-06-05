const express = require('express');
const router = express.Router();

const { createChapter, getAllChapters, getChapterById } = require('../controllers/chapterController');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

router.post('/chapters', adminAuth, upload.single('file'), createChapter);
router.get('/chapters', getAllChapters);
router.get('/chapters/:id', getChapterById);

module.exports = router;