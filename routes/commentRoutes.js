const express = require('express');
const router = express.Router();
const { addComment, getComments, deleteComment, toggleLike } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.post('/comment/create/:taskId', addComment);
router.get('/task/create/:taskId', getComments);
router.delete('/delete/:commentId', deleteComment);
router.post('/like/:commentId', toggleLike);

module.exports = router;
