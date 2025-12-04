const db = require('../config/db');
const AssignedTo = {
  assignTask: async (user_id, task_id) => {
    return db.query('INSERT INTO assigned_to (user_id, task_id) VALUES (?, ?)', [user_id, task_id]);
  },
  unassignTask: async (user_id, task_id) => {
    return db.query('DELETE FROM assigned_to WHERE user_id = ? AND task_id = ?', [user_id, task_id]);
  },
  // Remove all assignees from a task
  clearTaskAssignees: async (task_id) => {
    return db.query('DELETE FROM assigned_to WHERE task_id = ?', [task_id]);
  },
  // Assign multiple users to a task
  assignMultiple: async (user_ids, task_id) => {
    if (!user_ids || user_ids.length === 0) return;
    const values = user_ids.map(user_id => [user_id, task_id]);
    return db.query('INSERT INTO assigned_to (user_id, task_id) VALUES ?', [values]);
  },
  getAssignedUsers: async (task_id) => {
    const [rows] = await db.query('SELECT u.user_id, u.first_name, u.last_name FROM assigned_to at JOIN user u ON at.user_id = u.user_id WHERE at.task_id = ?', [task_id]);
    return rows;
  },
  getTaskAssignees: async (task_id) => {
    const [rows] = await db.query(`
      SELECT u.user_id, u.first_name, u.last_name, u.email
      FROM assigned_to at 
      JOIN user u ON at.user_id = u.user_id 
      WHERE at.task_id = ?
    `, [task_id]);
    return rows;
  }
};
module.exports = AssignedTo;
