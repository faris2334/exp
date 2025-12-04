const db = require('../config/db');

const Project = {
  create: async (project_name, description, team_id, create_by, project_url) => {
    const [result] = await db.query(
      'INSERT INTO project (project_name, description, team_id, create_by, project_url) VALUES (?, ?, ?, ?, ?)',
      [project_name, description, team_id, create_by, project_url]
    );
    return result.insertId;
  },
  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM project WHERE project_id = ?', [id]);
    return rows[0];
  },
  findByUrl: async (project_url) => {
    const [rows] = await db.query(`
      SELECT p.*, t.team_name, t.team_url, t.create_by as team_owner_id, u.first_name, u.last_name 
      FROM project p 
      JOIN team t ON p.team_id = t.team_id 
      JOIN user u ON p.create_by = u.user_id 
      WHERE p.project_url = ?
    `, [project_url]);
    return rows[0];
  },
  findAllByTeam: async (team_id) => {
    const [rows] = await db.query(`
      SELECT p.*, 
             u.first_name, 
             u.last_name,
             (SELECT COUNT(*) FROM task t WHERE t.project_id = p.project_id) as task_count,
             (SELECT COUNT(*) FROM task t WHERE t.project_id = p.project_id AND t.status = 2) as completed_tasks
      FROM project p
      JOIN user u ON p.create_by = u.user_id
      WHERE p.team_id = ?
    `, [team_id]);
    return rows;
  },
  update: async (id, project_name, description, project_url) => {
    return db.query('UPDATE project SET project_name = ?, description = ?, project_url = ? WHERE project_id = ?', [project_name, description, project_url, id]);
  },
  delete: async (id) => {
    return db.query('DELETE FROM project WHERE project_id = ?', [id]);
  }
};
module.exports = Project;
