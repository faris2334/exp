const db = require('../config/db');


function generateRandomUrl(length = 16) {
  return Math.random().toString(36).substring(2, 2 + length);
}

const Team = {
  create: async (team_name, create_by, team_url) => {
    const t_url = generateRandomUrl();
    const [result] = await db.query(
      'INSERT INTO team (team_name, create_by, team_url) VALUES (?, ?, ?)',
      [team_name, create_by, t_url]
    );
    return result.insertId;
  },
  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM team WHERE team_id = ?', [id]);
    return rows[0];
  },
  findByUrl: async (url) => {
    const [rows] = await db.query('SELECT * FROM team WHERE team_url = ?', [url]);
    return rows[0];
  },
  // Get all teams for a user
  findByUserId: async (userId) => {
    const [rows] = await db.query(`
      SELECT t.*, b.role, 
        (SELECT COUNT(*) FROM belong WHERE team_id = t.team_id) as member_count,
        (SELECT COUNT(*) FROM project WHERE team_id = t.team_id) as project_count
      FROM team t
      JOIN belong b ON t.team_id = b.team_id
      WHERE b.user_id = ?
      ORDER BY t.create_at DESC
    `, [userId]);
    return rows;
  },
  // Get team members
  getMembers: async (teamId) => {
    const [rows] = await db.query(`
      SELECT u.user_id, u.first_name, u.last_name, u.email, b.role
      FROM user u
      JOIN belong b ON u.user_id = b.user_id
      WHERE b.team_id = ?
    `, [teamId]);
    return rows;
  },
  update: async (id, team_name, team_url) => {
    return db.query('UPDATE team SET team_name = ?, team_url = ? WHERE team_id = ?', [team_name, team_url, id]);
  },
  delete: async (id) => {
    return db.query('DELETE FROM team WHERE team_id = ?', [id]);
  }
};
module.exports = Team;