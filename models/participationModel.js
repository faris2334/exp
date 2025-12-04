const db = require('../config/db');

const Participation = {
  addParticipant: async (user_id, project_id) => {
    return db.query('INSERT INTO participation (user_id, project_id) VALUES (?, ?)', [user_id, project_id]);
  },
  removeParticipant: async (user_id, project_id) => {
    return db.query('DELETE FROM participation WHERE user_id = ? AND project_id = ?', [user_id, project_id]);
  },
  checkIfParticipant: async (user_id, project_id) => {
    return db.query('SELECT user_id FROM participation WHERE user_id = ? AND project_id = ?', [user_id, project_id]);
  },
  getProjectParticipants: async (project_id) => {
    const [rows] = await db.query(`
      SELECT u.user_id, u.first_name, u.last_name, u.email
      FROM participation p
      JOIN user u ON p.user_id = u.user_id
      WHERE p.project_id = ?
    `, [project_id]);
    return rows;
  }
};

module.exports = Participation;