const Task = require('../models/taskmodels');
const AssignedTo = require('../models/assignedToModel');
const Notification = require('../models/notificationsModel');
const Participation = require('../models/participationModel');
const Belong = require('../models/belongModel');
const Project = require('../models/projectModel');

// Get all tasks for a project
async function getTasksByProject(req, res) {
  try {
    const { project_id } = req.query;
    const userId = req.user.id;
    
    if (!project_id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    // Get the project to check team membership
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if user is a member of the team
    const userRole = await Belong.getRole(userId, project.team_id);
    if (!userRole) {
      return res.status(403).json({ error: 'You are not a member of this team' });
    }
    
    const tasks = await Task.findAllByProject(project_id);
    
    // Get assigned users for each task
    const tasksWithAssignees = await Promise.all(tasks.map(async (task) => {
      const assignees = await AssignedTo.getTaskAssignees(task.task_id);
      return {
        ...task,
        assigned_users: assignees.map(a => `${a.user_id}:${a.first_name} ${a.last_name}`).join('||'),
        comment_count: task.comment_count || 0
      };
    }));
    
    res.status(200).json(tasksWithAssignees);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
}

async function createTask(req, res) {
  try {
    const { title, project_id, assigned_user_id, due_date, priority, description, status } = req.body;
    if (!title || !project_id) return res.status(400).json({ error: 'Title and Project ID are required' });
    
    // Get project to find team_id
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if assigned user is a team member (not just project participant)
    if (assigned_user_id) {
        const userRole = await Belong.getRole(assigned_user_id, project.team_id);
        
        if (!userRole) {
            return res.status(403).json({ error: 'Forbidden: Assigned user is not a member of this team' });
        }
    }
    
    const taskId = await Task.create(title, due_date, priority || 1, description, status || 0, project_id, null);

    if (assigned_user_id) {
      await AssignedTo.assignTask(assigned_user_id, taskId);
      // Notification.create(title, message, task_id, user_id)
      await Notification.create('New Task Assigned', `You have been assigned to task: ${title}`, taskId, assigned_user_id);
    }
    
    return res.status(201).json({ taskId, message: 'Task created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating task' });
  }
}


async function updateTaskStatus(req, res) {
  try {
    const { status } = req.body;
    const taskId = req.params.taskId;
    if (status === undefined) return res.status(400).json({ error: 'Status is required' });

    const [result] = await Task.update(taskId, { status });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Task not found' });

    res.status(200).json({ message: 'Task status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating status' });
  }
}

module.exports = { getTasksByProject, createTask, updateTaskStatus };