const express = require('express');
const router = express.Router();
const { getProjectByUrl, getProjectsByTeam, createProject, addProjectParticipant, removeProjectParticipant, deleteProject } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', getProjectsByTeam);  // GET /projects?team_id=X
router.get('/:projectUrl', getProjectByUrl);  // GET /projects/:projectUrl - get single project
router.post('/', createProject);                                
router.post('/:projectId/participants', addProjectParticipant);
router.delete('/:projectId/participants/:userId', removeProjectParticipant);
router.delete('/:projectId', deleteProject);  // DELETE /projects/:projectId - delete project

module.exports = router;