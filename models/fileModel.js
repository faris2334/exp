const db = require('../config/db');

const TaskFile = {
  // Create a new file record with binary data stored in database
  create: async (fileData) => {
    const { task_id, user_id, file_name, file_data, file_size, mime_type } = fileData;
    const [result] = await db.query(
      `INSERT INTO task_files (task_id, user_id, file_name, file_data, file_size, mime_type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [task_id, user_id, file_name, file_data, file_size || 0, mime_type || 'application/octet-stream']
    );
    return { file_id: result.insertId, task_id, user_id, file_name, file_size, mime_type };
  },

  // Find all files for a task (without file_data for listing)
  findAllByTask: async (taskId) => {
    const [rows] = await db.query(
      `SELECT tf.file_id, tf.task_id, tf.user_id, tf.file_name, tf.file_size, tf.mime_type, tf.uploaded_at,
              u.first_name, u.last_name, u.email 
       FROM task_files tf
       JOIN user u ON tf.user_id = u.user_id
       WHERE tf.task_id = ?
       ORDER BY tf.uploaded_at DESC`,
      [taskId]
    );
    return rows;
  },

  // Find file by ID (without file_data for metadata)
  findById: async (fileId) => {
    const [rows] = await db.query(
      `SELECT file_id, task_id, user_id, file_name, file_size, mime_type, uploaded_at 
       FROM task_files WHERE file_id = ?`,
      [fileId]
    );
    return rows[0];
  },

  // Find file by ID with binary data (for download)
  findByIdWithData: async (fileId) => {
    const [rows] = await db.query(
      `SELECT * FROM task_files WHERE file_id = ?`,
      [fileId]
    );
    return rows[0];
  },

  // Delete a file record
  delete: async (fileId) => {
    const [result] = await db.query(
      `DELETE FROM task_files WHERE file_id = ?`,
      [fileId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = TaskFile;
