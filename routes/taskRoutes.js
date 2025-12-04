const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware'); 
const { getTasksByProject, createTask, updateTaskStatus, updateTask, deleteTask, updateTaskAssignees } = require('../controllers/tasksController');

router.use(protect);

router.get('/', getTasksByProject);  // GET /tasks?project_id=X
router.post('/task/create', createTask);
router.put('/task/update/:taskId', updateTaskStatus);  // Update status only
router.put('/task/edit/:taskId', updateTask);          // Full task edit (title, description, due_date, priority, assignees)
router.put('/task/assignees/:taskId', updateTaskAssignees);  // Update assignees only
router.delete('/task/delete/:taskId', deleteTask);

module.exports = router;
