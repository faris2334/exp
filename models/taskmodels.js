const db = require('../config/db');

const Task = {
  create: async (title, due_date, priority, description, status, project_id, file) => {
    const [result] = await db.query(
      'INSERT INTO task (title, due_date, priority, description, status, project_id, file) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, due_date, priority, description, status, project_id, file]
    );
    return result.insertId;
  },
  findById: async (id) => {
    const [rows] = await db.query('SELECT * FROM task WHERE task_id = ?', [id]);
    return rows[0];
  },
  findAllByProject: async (project_id) => {
    const [rows] = await db.query(`
      SELECT t.*, 
        (SELECT COUNT(*) FROM task_comment tc WHERE tc.task_id = t.task_id) as comment_count
      FROM task t 
      WHERE t.project_id = ?`, 
      [project_id]);
    return rows;
  },
  update: async (id, data) => {
      let query = 'UPDATE task SET ';
      const values = [];
      const keys = Object.keys(data);
      keys.forEach((key, index) => {
          query += `${key} = ?${index < keys.length - 1 ? ', ' : ' '}`;
          values.push(data[key]);
      });
      query += 'WHERE task_id = ?';
      values.push(id);
      return db.query(query, values);
  },
  delete: async (id) => {
    return db.query('DELETE FROM task WHERE task_id = ?', [id]);
  }
};
module.exports = Task;