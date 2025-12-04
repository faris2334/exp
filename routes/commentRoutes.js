const express = require('express');
const router = express.Router();
const { addComment, getComments , deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/comment/create/:taskId', addComment);
router.get('/task/create/:taskId', getComments);
router.delete('/delete/:commentId', deleteComment);

module.exports = router;