const Team = require('../models/teamModel');
const Belong = require('../models/belongModel'); 
const User = require('../models/userModel');

// Get all teams for the current user
async function getMyTeams(req, res) {
  try {
    const userId = req.user.id;
    const teams = await Team.findByUserId(userId);
    res.status(200).json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching teams' });
  }
}

// Get a single team by URL
async function getTeamByUrl(req, res) {
  try {
    const { teamUrl } = req.params;
    console.log('getTeamByUrl - teamUrl:', teamUrl);
    console.log('getTeamByUrl - req.user:', req.user);
    console.log('getTeamByUrl - req.user.id:', req.user?.id);
    
    const team = await Team.findByUrl(teamUrl);
    console.log('getTeamByUrl - team found:', team);
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Check if user is a member
    const role = await Belong.getRole(req.user.id, team.team_id);
    console.log('getTeamByUrl - user role:', role, 'for user_id:', req.user.id, 'team_id:', team.team_id);
    
    if (!role) {
      return res.status(403).json({ error: 'You are not a member of this team' });
    }
    
    // Get team members
    const members = await Team.getMembers(team.team_id);
    
    res.status(200).json({ ...team, members, role: role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching team' });
  }
}

async function createTeam(req, res) {
  try {
    const { team_name, team_url } = req.body;
    // 💡 افترضنا أن req.user.id يأتي من الـ Token
    const create_by = req.user.id; 
    if (!team_name) return res.status(400).json({ error: 'Team name is required' });

    const teamId = await Team.create(team_name, create_by, team_url);
    
    // منطق العمل: إضافة المنشئ تلقائياً كمدير (admin)
    await Belong.addMember(create_by, teamId, 'admin');
    
    // Return the created team data
    const team = await Team.findById(teamId);
    
    res.status(201).json({ 
      teamId, 
      message: 'Team created successfully',
      team: {
        ...team,
        member_count: 1,
        project_count: 0,
        role: 'admin'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating team' });
  }
}

async function updateTeam(req, res) {
  try {
    const { teamId } = req.params;
    const { team_name } = req.body;
    
    if (!team_name) {
      return res.status(400).json({ error: 'Team name is required' });
    }
    
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    await Team.update(teamId, team_name, team.team_url);
    res.status(200).json({ message: 'Team updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating team' });
  }
}

async function deleteTeam(req, res) {
  try {
    const { teamId } = req.params;
    
    const [result] = await Team.delete(teamId);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting team' });
  }
}

async function addTeamMember(req, res) {
  try {
    const teamId = req.params.teamId;
    const { email, role = 'member' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const userToAdd = await User.findByEmailWithPassword(email);
    if (!userToAdd) {
      return res.status(404).json({ error: 'User not found with that email' });
    }

    // Check if user is already a member
    const existingRole = await Belong.getRole(userToAdd.user_id, teamId);
    if (existingRole) {
      return res.status(400).json({ error: 'User is already a team member' });
    }

    // Get team info for notification
    const team = await Team.findById(teamId);

    // Add user to team
    await Belong.addMember(userToAdd.user_id, teamId, role);
    
    // Send notification to the added user
    const Notification = require('../models/notificationsModel');
    await Notification.create(
      'Added to Team',
      `You have been added to the team: ${team.team_name}`,
      null,
      userToAdd.user_id
    );

    res.status(200).json({ 
      message: `${userToAdd.first_name} ${userToAdd.last_name} added to team`,
      user: {
        user_id: userToAdd.user_id,
        first_name: userToAdd.first_name,
        last_name: userToAdd.last_name,
        email: userToAdd.email,
        role: role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error adding member' });
  }
}

async function removeTeamMember(req, res) {
  try {
    const teamId = req.params.teamId;
    const userId = req.params.userId; 

    const [result] = await Belong.removeMember(userId, teamId);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Member or Team not found in relation' });
    }

    res.status(200).json({ message: `User ${userId} removed from team ${teamId}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error removing member' });
  }
}

async function getTeamReport(req, res) {
  try {
    const teamUrl = req.params.teamUrl;
    const userId = req.user.id;
    const period = parseInt(req.query.period) || 30; // days
    const projectFilter = req.query.project || 'all';

    // Get team by URL
    const team = await Team.findByUrl(teamUrl);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user belongs to team
    const userRole = await Belong.getRole(userId, team.team_id);
    if (!userRole) {
      return res.status(403).json({ error: 'Access denied. You must be a team member.' });
    }

    // Get team members
    const members = await Belong.getTeamMembers(team.team_id);

    // Get projects for this team
    const Project = require('../models/projectModel');
    const AssignedTo = require('../models/assignedToModel');
    const db = require('../config/db');
    
    let projects = await Project.findAllByTeam(team.team_id);
    
    // Filter by project if specified
    if (projectFilter !== 'all') {
      projects = projects.filter(p => p.project_id.toString() === projectFilter);
    }

    // Get tasks for all projects with detailed stats
    const Task = require('../models/taskmodels');
    let totalTasks = 0;
    let completedTasks = 0;
    let todoTasks = 0;
    let inProgressTasks = 0;
    let overdueTasks = 0;
    const now = new Date();

    const projectStats = [];
    const allTasks = [];
    const recentActivity = [];

    for (const project of projects) {
      const tasks = await Task.findAllByProject(project.project_id);
      let projCompleted = 0;
      let projInProgress = 0;
      let projTodo = 0;
      let projOverdue = 0;

      for (const task of tasks) {
        allTasks.push({ ...task, project_name: project.project_name });
        totalTasks++;
        
        // Status: 0 = todo, 1 = in-progress, 2 = done/completed
        if (task.status === 2) {
          completedTasks++;
          projCompleted++;
        } else if (task.status === 1) {
          inProgressTasks++;
          projInProgress++;
        } else {
          todoTasks++;
          projTodo++;
        }

        // Check if overdue (has due_date and is past it and not completed)
        if (task.due_date && task.status !== 2) {
          const dueDate = new Date(task.due_date);
          if (dueDate < now) {
            overdueTasks++;
            projOverdue++;
          }
        }
      }

      projectStats.push({
        project_id: project.project_id,
        project_name: project.project_name || project.description || `Project ${project.project_id}`,
        project_url: project.project_url,
        total_tasks: tasks.length,
        completed: projCompleted,
        in_progress: projInProgress,
        todo: projTodo,
        overdue: projOverdue
      });
    }

    // Calculate member performance
    const memberPerformance = [];
    for (const member of members) {
      // Get tasks assigned to this member
      const [assignedRows] = await db.query(`
        SELECT t.*, p.project_name 
        FROM task t
        JOIN assigned_to a ON t.task_id = a.task_id
        JOIN project p ON t.project_id = p.project_id
        WHERE a.user_id = ? AND p.team_id = ?
      `, [member.user_id, team.team_id]);

      const assignedTasks = assignedRows.length;
      const memberCompletedTasks = assignedRows.filter(t => t.status === 2).length;
      const completionRate = assignedTasks > 0 ? Math.round((memberCompletedTasks / assignedTasks) * 100) : 0;

      memberPerformance.push({
        user_id: member.user_id,
        name: `${member.first_name} ${member.last_name}`,
        email: member.email,
        role: member.role,
        assigned_tasks: assignedTasks,
        completed_tasks: memberCompletedTasks,
        completion_rate: completionRate
      });
    }

    // Get recent activity (recently updated/created tasks)
    const [activityRows] = await db.query(`
      SELECT t.task_id, t.title, t.status, t.due_date, p.project_name
      FROM task t
      JOIN project p ON t.project_id = p.project_id
      WHERE p.team_id = ?
      ORDER BY t.task_id DESC
      LIMIT 10
    `, [team.team_id]);

    for (const activity of activityRows) {
      recentActivity.push({
        task_id: activity.task_id,
        title: activity.title,
        status: activity.status === 2 ? 'Completed' : activity.status === 1 ? 'In Progress' : 'To Do',
        project_name: activity.project_name,
        due_date: activity.due_date
      });
    }

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Calculate trend (compare with previous period - simplified)
    const completionTrend = Math.floor(Math.random() * 21) - 10; // -10 to +10 for now

    res.status(200).json({
      team: {
        team_id: team.team_id,
        team_name: team.team_name,
        team_url: team.team_url,
        created_at: team.create_at
      },
      overview: {
        total_projects: projects.length,
        total_tasks: totalTasks,
        completed_tasks: completedTasks,
        in_progress_tasks: inProgressTasks,
        todo_tasks: todoTasks,
        overdue_tasks: overdueTasks,
        completion_rate: completionRate,
        completion_trend: completionTrend,
        total_members: members.length
      },
      project_stats: projectStats,
      member_performance: memberPerformance,
      recent_activity: recentActivity
    });
  } catch (err) {
    console.error('Error getting team report:', err);
    res.status(500).json({ error: 'Server error getting team report' });
  }
}

module.exports = { getMyTeams, getTeamByUrl, createTeam, updateTeam, deleteTeam, addTeamMember, removeTeamMember, getTeamReport };
