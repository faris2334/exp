const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); 
const { getTasksByProject, createTask, updateTaskStatus, deleteTask } = require('../controllers/tasksController');

router.use(protect);

router.get('/', getTasksByProject);  // GET /tasks?project_id=X
router.post('/task/create', createTask);
router.put('/task/update/:taskId', updateTaskStatus);
router.delete('/task/delete/:taskId', deleteTask);

module.exports = router;
