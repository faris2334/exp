const db = require('./config/db');

async function createTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS task_files (
        file_id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        user_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(task_id) REFERENCES task(task_id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES user(user_id) ON DELETE CASCADE
      )
    `);
    console.log('Table task_files created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating table:', error.message);
    process.exit(1);
  }
}

createTable();
