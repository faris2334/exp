const db = require('../config/db');

const TaskComment = {
  create: async (comment_text, task_id, user_id) => {
    const [result] = await db.query(
      'INSERT INTO task_comment (comment_text, task_id, user_id, likes) VALUES (?, ?, ?, 0)',
      [comment_text, task_id, user_id]
    );
    return result.insertId;
  },
  findAllByTask: async (task_id, currentUserId) => {
    try {
      // Try with comment_likes table for liked_by_me status
      const [rows] = await db.query(`
          SELECT tc.*, u.first_name, u.last_name,
                 EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = tc.comment_id AND cl.user_id = ?) as liked_by_me
          FROM task_comment tc
          JOIN user u ON tc.user_id = u.user_id
          WHERE tc.task_id = ?
          ORDER BY tc.comment_id ASC
      `, [currentUserId, task_id]);
      return rows.map(row => ({
        ...row,
        liked_by_me: !!row.liked_by_me
      }));
    } catch (err) {
      // Fallback if comment_likes table doesn't exist
      const [rows] = await db.query(`
          SELECT tc.*, u.first_name, u.last_name
          FROM task_comment tc
          JOIN user u ON tc.user_id = u.user_id
          WHERE tc.task_id = ?
          ORDER BY tc.comment_id ASC
      `, [task_id]);
      return rows.map(row => ({
        ...row,
        liked_by_me: false
      }));
    }
  },
  findById: async (commentId) => {
    const [rows] = await db.query(`SELECT * FROM task_comment WHERE comment_id = ?`, [commentId]);
    return rows[0];
  },
  delete: async (comment_id) => {
    return db.query('DELETE FROM task_comment WHERE comment_id = ?', [comment_id]);
  },

  // Like functions - uses likes column in task_comment + comment_likes table for tracking
  hasUserLiked: async (comment_id, user_id) => {
    const [rows] = await db.query(
      'SELECT 1 FROM comment_likes WHERE comment_id = ? AND user_id = ?',
      [comment_id, user_id]
    );
    return rows.length > 0;
  },
  addLike: async (comment_id, user_id) => {
    // Add to tracking table and increment likes counter
    await db.query('INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)', [comment_id, user_id]);
    await db.query('UPDATE task_comment SET likes = COALESCE(likes, 0) + 1 WHERE comment_id = ?', [comment_id]);
  },
  removeLike: async (comment_id, user_id) => {
    // Remove from tracking table and decrement likes counter
    await db.query('DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?', [comment_id, user_id]);
    await db.query('UPDATE task_comment SET likes = GREATEST(COALESCE(likes, 0) - 1, 0) WHERE comment_id = ?', [comment_id]);
  },
  getLikesCount: async (comment_id) => {
    const [rows] = await db.query('SELECT COALESCE(likes, 0) as likes FROM task_comment WHERE comment_id = ?', [comment_id]);
    return rows[0]?.likes || 0;
  }
};
module.exports = TaskComment;
