const TaskComment = require('../models/taskCommentModel');
const Task = require('../models/taskmodels');
const Project = require('../models/projectModel');
const Belong = require('../models/belongModel');


async function addComment(req, res) {
  try {
    const { comment_text } = req.body;
    const task_id = req.params.taskId;
    const user_id = req.user.id;
    if (!comment_text) return res.status(400).json({ error: 'Comment text is required' });

    const commentId = await TaskComment.create(comment_text, task_id, user_id);

    res.status(201).json({ commentId, message: 'Comment added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error adding comment' });
  }
}

async function getComments(req, res) {
    try {
        const task_id = req.params.taskId;
        const user_id = req.user.id;
        const comments = await TaskComment.findAllByTask(task_id, user_id);
        res.status(200).json(comments);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error fetching comments' });
    }
}

async function deleteComment(req, res) {
  try {
    const commentId = req.params.commentId;
    const userId = req.user.id;

    const comment = await TaskComment.findById(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });

    const task = await Task.findById(comment.task_id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const project = await Project.findById(task.project_id);
    if (!project) return res.status(404).json({ error: "Project not found" });

    const teamId = project.team_id;
    const isCommentOwner = parseInt(comment.user_id) === parseInt(userId);
    const role = await Belong.getRole(userId, teamId);
    const isAdmin = role === "admin";
    
    // Check if user is the team owner (create_by)
    const Team = require('../models/teamModel');
    const team = await Team.findById(teamId);
    const isTeamOwner = team && parseInt(team.create_by) === parseInt(userId);

    console.log('Delete comment check:', { 
      userId, 
      commentUserId: comment.user_id, 
      teamCreateBy: team?.create_by, 
      isCommentOwner, 
      isAdmin, 
      isTeamOwner,
      role 
    });

    // Allow deletion if: comment owner, admin, or team owner
    if (!isCommentOwner && !isAdmin && !isTeamOwner) {
      return res.status(403).json({ error: "Not allowed to delete this comment" });
    }

    await TaskComment.delete(commentId);
    res.json({ message: "Comment deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error deleting comment" });
  }
}

// Toggle like on a comment (like if not liked, unlike if already liked)
async function toggleLike(req, res) {
  try {
    const commentId = req.params.commentId;
    const userId = req.user.id;

    console.log('Toggle like called:', { commentId, userId });

    // Check if comment exists
    const comment = await TaskComment.findById(commentId);
    console.log('Comment found:', comment);
    
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user already liked this comment
    const hasLiked = await TaskComment.hasUserLiked(commentId, userId);
    console.log('Has user liked:', hasLiked);

    if (hasLiked) {
      // Remove like
      console.log('Removing like...');
      await TaskComment.removeLike(commentId, userId);
    } else {
      // Add like
      console.log('Adding like...');
      await TaskComment.addLike(commentId, userId);
    }

    // Get updated likes count
    const likesCount = await TaskComment.getLikesCount(commentId);
    console.log('Updated likes count:', likesCount);

    res.json({
      message: hasLiked ? "Like removed" : "Like added",
      liked: !hasLiked,
      likes: likesCount
    });

  } catch (err) {
    console.error('Toggle like error:', err);
    res.status(500).json({ error: "Server error toggling like" });
  }
}

module.exports = { addComment, getComments, deleteComment, toggleLike };
