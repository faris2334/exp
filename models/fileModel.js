const db = require('../config/db');

const TaskFile = {
  // Create a new file record
  create: async (fileData) => {
    const { task_id, user_id, file_name, file_path, file_size } = fileData;
    const [result] = await db.execute(
      `INSERT INTO task_files (task_id, user_id, file_name, file_path, file_size) 
       VALUES (?, ?, ?, ?, ?)`,
      [task_id, user_id, file_name, file_path, file_size || 0]
    );
    return { file_id: result.insertId, ...fileData };
  },

  // Find all files for a task
  findAllByTask: async (taskId) => {
    const [rows] = await db.execute(
      `SELECT tf.*, u.first_name, u.last_name, u.email 
       FROM task_files tf
       JOIN user u ON tf.user_id = u.user_id
       WHERE tf.task_id = ?
       ORDER BY tf.uploaded_at DESC`,
      [taskId]
    );
    return rows;
  },

  // Find file by ID
  findById: async (fileId) => {
    const [rows] = await db.execute(
      `SELECT * FROM task_files WHERE file_id = ?`,
      [fileId]
    );
    return rows[0];
  },

  // Delete a file record
  delete: async (fileId) => {
    const [result] = await db.execute(
      `DELETE FROM task_files WHERE file_id = ?`,
      [fileId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = TaskFile;
