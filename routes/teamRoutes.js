const express = require('express');
const router = express.Router();
const { getMyTeams, getTeamByUrl, createTeam, updateTeam, deleteTeam, addTeamMember, removeTeamMember, getTeamReport, leaveTeam } = require('../controllers/teamsController');
const { protect } = require('../middleware/authMiddleware');
const { checkTeamRole } = require('../middleware/roleMiddleware');

router.use(protect); 

router.get('/', getMyTeams);  // Get all teams for current user
router.get('/:teamUrl', getTeamByUrl);  // Get single team by URL
router.get('/:teamUrl/report', getTeamReport);  // Get team report/stats
router.post('/', createTeam);
router.put('/:teamId', checkTeamRole('admin'), updateTeam);  // Update team
router.delete('/:teamId', checkTeamRole('admin'), deleteTeam);  // Delete team
router.post('/:teamId/members', checkTeamRole('admin'), addTeamMember);
router.delete('/:teamId/members/:userId', checkTeamRole('admin'), removeTeamMember);
router.post('/:teamId/leave', leaveTeam);  // Any member can leave

module.exports = router;
