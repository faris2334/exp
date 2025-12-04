const db = require('../config/db');
const AssignedTo = {
  assignTask: async (user_id, task_id) => {
    return db.query('INSERT INTO assigned_to (user_id, task_id) VALUES (?, ?)', [user_id, task_id]);
  },
  unassignTask: async (user_id, task_id) => {
    return db.query('DELETE FROM assigned_to WHERE user_id = ? AND task_id = ?', [user_id, task_id]);
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