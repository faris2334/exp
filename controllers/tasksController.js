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
    const { title, project_id, assigned_user_id, assigned_user_ids, due_date, priority, description, status } = req.body;
    if (!title || !project_id) return res.status(400).json({ error: 'Title and Project ID are required' });
    
    // Get project to find team_id
    const project = await Project.findById(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Support both single user (assigned_user_id) and multiple users (assigned_user_ids)
    let userIds = [];
    if (assigned_user_ids && Array.isArray(assigned_user_ids)) {
      userIds = assigned_user_ids;
    } else if (assigned_user_id) {
      userIds = [assigned_user_id];
    }
    
    // Validate all assigned users are team members
    for (const userId of userIds) {
      const userRole = await Belong.getRole(userId, project.team_id);
      if (!userRole) {
        return res.status(403).json({ error: `User ${userId} is not a member of this team` });
      }
    }
    
    const taskId = await Task.create(title, due_date, priority || 1, description, status || 0, project_id, null);

    // Assign all users and send notifications
    for (const userId of userIds) {
      await AssignedTo.assignTask(userId, taskId);
      try {
        await Notification.create('New Task Assigned', `You have been assigned to task: ${title}`, taskId, userId);
      } catch (notifErr) {
        console.error('Failed to send notification:', notifErr.message);
      }
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

    // Get task before update to check if status is changing
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const [result] = await Task.update(taskId, { status });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Task not found' });

    // If task is marked as completed (status = 2), notify assigned users
    if (status === 2 && task.status !== 2) {
      const assignees = await AssignedTo.getTaskAssignees(taskId);
      for (const assignee of assignees) {
        await Notification.create(
          'Task Completed',
          `The task "${task.title}" has been marked as completed`,
          taskId,
          assignee.user_id
        );
      }
    }

    res.status(200).json({ message: 'Task status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating status' });
  }
}

async function updateTask(req, res) {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;
    const { title, description, due_date, priority, assigned_user_ids } = req.body;

    console.log('updateTask called:', { taskId, userId, title, description, due_date, priority, assigned_user_ids });

    // Get the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get the project to find team_id
    const project = await Project.findById(task.project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is a member of the team
    const userRole = await Belong.getRole(userId, project.team_id);
    if (!userRole) {
      return res.status(403).json({ error: 'You are not a member of this team' });
    }

    // Build update object with only provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (due_date !== undefined) updateData.due_date = due_date || null;
    if (priority !== undefined) updateData.priority = priority;

    console.log('updateData:', updateData);

    // Update task fields if any
    if (Object.keys(updateData).length > 0) {
      await Task.update(taskId, updateData);
    }

    // Update assignees if provided
    if (assigned_user_ids !== undefined && Array.isArray(assigned_user_ids)) {
      console.log('Updating assignees:', assigned_user_ids);
      
      // Validate all assigned users are team members
      for (const uid of assigned_user_ids) {
        const memberRole = await Belong.getRole(uid, project.team_id);
        if (!memberRole) {
          return res.status(403).json({ error: `User ${uid} is not a member of this team` });
        }
      }

      // Get current assignees to determine who is new
      const currentAssignees = await AssignedTo.getTaskAssignees(taskId);
      const currentUserIds = currentAssignees.map(a => a.user_id);
      const newUserIds = assigned_user_ids.filter(id => !currentUserIds.includes(id));

      // Clear existing assignments and add new ones
      await AssignedTo.clearTaskAssignees(taskId);
      
      for (const uid of assigned_user_ids) {
        await AssignedTo.assignTask(uid, taskId);
      }

      // Send notifications only to newly assigned users
      for (const uid of newUserIds) {
        try {
          await Notification.create('New Task Assigned', `You have been assigned to task: ${task.title}`, taskId, uid);
        } catch (notifErr) {
          console.error('Failed to send notification:', notifErr.message);
        }
      }
      console.log('Assignees updated successfully');
    }

    console.log('Sending success response');
    res.status(200).json({ message: 'Task updated successfully' });
  } catch (err) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Server error updating task' });
  }
}

async function deleteTask(req, res) {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;

    // Get the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get the project to find team_id
    const project = await Project.findById(task.project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Get the team to check ownership
    const Team = require('../models/teamModel');
    const team = await Team.findById(project.team_id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Only team owner can delete tasks
    if (team.create_by !== userId) {
      return res.status(403).json({ error: 'Only the team owner can delete tasks' });
    }

    // Delete the task
    await Task.delete(taskId);
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Server error deleting task' });
  }
}

async function updateTaskAssignees(req, res) {
  try {
    const taskId = req.params.taskId;
    const { assigned_user_ids } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(assigned_user_ids)) {
      return res.status(400).json({ error: 'assigned_user_ids must be an array' });
    }

    // Get the task
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Get the project to find team_id
    const project = await Project.findById(task.project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if user is a member of the team
    const userRole = await Belong.getRole(userId, project.team_id);
    if (!userRole) {
      return res.status(403).json({ error: 'You are not a member of this team' });
    }

    // Validate all assigned users are team members
    for (const uid of assigned_user_ids) {
      const memberRole = await Belong.getRole(uid, project.team_id);
      if (!memberRole) {
        return res.status(403).json({ error: `User ${uid} is not a member of this team` });
      }
    }

    // Get current assignees to determine who is new
    const currentAssignees = await AssignedTo.getTaskAssignees(taskId);
    const currentUserIds = currentAssignees.map(a => a.user_id);
    const newUserIds = assigned_user_ids.filter(id => !currentUserIds.includes(id));

    // Clear existing assignments and add new ones
    await AssignedTo.clearTaskAssignees(taskId);
    
    // Assign all users
    for (const uid of assigned_user_ids) {
      await AssignedTo.assignTask(uid, taskId);
    }

    // Send notifications only to newly assigned users
    for (const uid of newUserIds) {
      try {
        await Notification.create('New Task Assigned', `You have been assigned to task: ${task.title}`, taskId, uid);
      } catch (notifErr) {
        console.error('Failed to send notification:', notifErr.message);
      }
    }

    res.status(200).json({ message: 'Task assignees updated successfully' });
  } catch (err) {
    console.error('Error updating task assignees:', err);
    res.status(500).json({ error: 'Server error updating assignees' });
  }
}

module.exports = { getTasksByProject, createTask, updateTaskStatus, updateTask, deleteTask, updateTaskAssignees };
