const db = require('../config/db');
const Belong = {
  addMember: async (user_id, team_id, role = 'member') => {
    return db.query('INSERT INTO belong (user_id, team_id, role) VALUES (?, ?, ?)', [user_id, team_id, role]);
  },
  removeMember: async (user_id, team_id) => {
    return db.query('DELETE FROM belong WHERE user_id = ? AND team_id = ?', [user_id, team_id]);
  },
  getRole: async (user_id, team_id) => {
    const [rows] = await db.query('SELECT role FROM belong WHERE user_id = ? AND team_id = ?', [user_id, team_id]);
    return rows[0] ? rows[0].role : null;
  },
  leaveTeam: async (user_id, team_id) => {
    return db.query('DELETE FROM belong WHERE user_id = ? AND team_id = ?', [user_id, team_id]);
  },
  getTeamMembers: async (team_id) => {
    const [rows] = await db.query(`
      SELECT u.user_id, u.first_name, u.last_name, u.email, b.role, b.join_at
      FROM belong b
      JOIN user u ON b.user_id = u.user_id
      WHERE b.team_id = ?
      ORDER BY b.join_at ASC
    `, [team_id]);
    return rows;
  }
};
module.exports = Belong;