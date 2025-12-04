const Project = require('../models/projectModel');
const Participation = require('../models/participationModel');
const Belong = require('../models/belongModel'); 

async function getTeamIdFromProject(projectId) {
    const project = await Project.findById(projectId);
    return project ? project.team_id : null;
}

// Get project by URL
async function getProjectByUrl(req, res) {
  try {
    const { projectUrl } = req.params;
    const userId = req.user.id;
    
    console.log('getProjectByUrl - projectUrl:', projectUrl);
    
    const project = await Project.findByUrl(projectUrl);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user is a member of the team
    const userRole = await Belong.getRole(userId, project.team_id);
    if (!userRole) {
      return res.status(403).json({ 
        error: 'You are not a member of this team',
        teamName: project.team_name
      });
    }
    
    // Get participants
    const participants = await Participation.getProjectParticipants(project.project_id);
    
    res.status(200).json({
      ...project,
      role: userRole,
      participants: participants || []
    });
  } catch (err) {
    console.error('Error fetching project:', err);
    res.status(500).json({ error: 'Server error fetching project' });
  }
}

// Get all projects for a team
async function getProjectsByTeam(req, res) {
  try {
    const { team_id } = req.query;
    const userId = req.user.id;
    
    if (!team_id) {
      return res.status(400).json({ error: 'Team ID is required' });
    }
    
    // Check if user is a member of the team
    const userRole = await Belong.getRole(userId, team_id);
    if (!userRole) {
      return res.status(403).json({ error: 'You are not a member of this team' });
    }
    
    const projects = await Project.findAllByTeam(team_id);
    res.status(200).json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching projects' });
  }
}

async function createProject(req, res) {
  try {
    const { project_name, description, team_id, project_url } = req.body;
    const create_by = req.user.id; 
    
    if (!team_id) return res.status(400).json({ error: 'Team ID is required' });
    if (!project_name) return res.status(400).json({ error: 'Project name is required' });

    const userRole = await Belong.getRole(create_by, team_id);
    if (!userRole) {
        return res.status(403).json({ error: 'Forbidden: You must be a member of the team to create a project' });
    }

    // Auto-generate project_url if not provided
    const generatedUrl = project_url || Math.random().toString(36).substring(2, 15);

    const projectId = await Project.create(project_name, description, team_id, create_by, generatedUrl);
    await Participation.addParticipant(create_by, projectId);
    
    console.log('Project created:', { projectId, project_name, description, team_id, create_by, project_url: generatedUrl });
    res.status(201).json({ projectId, project_url: generatedUrl, message: 'Project created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating project' });
  }
}

async function addProjectParticipant(req, res) {
    try {
        const projectId = req.params.projectId;
        const { userId } = req.body;
        const currentUserId = req.user.id;
        
        const teamId = await getTeamIdFromProject(projectId);
        if (!teamId) return res.status(404).json({ error: 'Project not found' });
        
        const currentUserRole = await Belong.getRole(currentUserId, teamId);
        
        if (currentUserRole !== 'admin') {
             return res.status(403).json({ error: 'Forbidden: Only team administrators can add participants' });
        }
        
        await Participation.addParticipant(userId, projectId);
        res.status(200).json({ message: `User ${userId} added as participant to project ${projectId}` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error adding participant' });
    }
}

async function removeProjectParticipant(req, res) {
  try {
    const projectId = req.params.projectId;
    const userId = req.params.userId; 
    const currentUserId = req.user.id;

    const teamId = await getTeamIdFromProject(projectId);
    if (!teamId) return res.status(404).json({ error: 'Project not found' });
    
    const currentUserRole = await Belong.getRole(currentUserId, teamId);
    
    if (currentUserRole !== 'admin' && String(currentUserId) !== String(userId)) {
         return res.status(403).json({ error: 'Forbidden: Only team administrators or yourself can remove participants' });
    }
    
    const [result] = await Participation.removeParticipant(userId, projectId);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Participant or Project not found in relation' });
    }
    
    res.status(200).json({ message: `User ${userId} removed from project ${projectId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error removing participant' });
  }
}

async function deleteProject(req, res) {
  try {
    const { projectId } = req.params;
    const currentUserId = req.user.id;

    // Get the project to find the team
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is admin of the team
    const userRole = await Belong.getRole(currentUserId, project.team_id);
    if (userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only team administrators can delete projects' });
    }

    // Delete the project
    const [result] = await Project.delete(projectId);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting project' });
  }
}

module.exports = { getProjectByUrl, getProjectsByTeam, createProject, addProjectParticipant, removeProjectParticipant, deleteProject };