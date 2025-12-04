const db = require('../config/db');

const TaskComment = {
  create: async (comment_text, task_id, user_id) => {
    const [result] = await db.query(
      'INSERT INTO task_comment (comment_text, task_id, user_id) VALUES (?, ?, ?)',
      [comment_text, task_id, user_id]
    );
    return result.insertId;
  },
  findAllByTask: async (task_id) => {
    const [rows] = await db.query(`
        SELECT tc.*, u.first_name, u.last_name 
        FROM task_comment tc
        JOIN user u ON tc.user_id = u.user_id
        WHERE tc.task_id = ?
        ORDER BY tc.comment_id ASC
    `, [task_id]);
    return rows;
  },
  findById: async (commentId) => {
    const [rows] = await db.query(`SELECT * FROM task_comment WHERE comment_id = ?`, [commentId]);
    return rows[0];
  },
  delete: async (comment_id) => {
    return db.query('DELETE FROM task_comment WHERE comment_id = ?', [comment_id]);
  }
};
module.exports = TaskComment;