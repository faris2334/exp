const db = require('../config/db');

const User = {
  findById: async (id) => {
    const [rows] = await db.query('SELECT user_id, first_name, last_name, email, create_at FROM user WHERE user_id = ?', [id]);
    return rows[0];
  },
  findByEmailWithPassword: async (email) => {
    const [rows] = await db.query('SELECT * FROM user WHERE email = ?', [email]);
    return rows[0];
  },
  findByGoogleId: async (googleId) => {
    const [rows] = await db.query('SELECT * FROM user WHERE google_id = ?', [googleId]);
    return rows[0];
  },
  create: async (first_name, last_name, email, password) => {
    const [result] = await db.query(
      'INSERT INTO user (first_name, last_name, email, password) VALUES (?, ?, ?, ?)',
      [first_name, last_name, email, password]
    );
    return result.insertId;
  },
  createGoogleUser: async (first_name, last_name, email, googleId) => {
    const [result] = await db.query(
      'INSERT INTO user (first_name, last_name, email, google_id) VALUES (?, ?, ?, ?)',
      [first_name, last_name, email, googleId]
    );
    return result.insertId;
  },
  linkGoogleAccount: async (userId, googleId) => {
    return db.query('UPDATE user SET google_id = ? WHERE user_id = ?', [googleId, userId]);
  },
  update: async (id, data) => {
      let query = 'UPDATE user SET ';
      const values = [];
      const keys = Object.keys(data);
      keys.forEach((key, index) => {
          query += `${key} = ?${index < keys.length - 1 ? ', ' : ' '}`;
          values.push(data[key]);
      });
      query += 'WHERE user_id = ?';
      values.push(id);
      return db.query(query, values);
  },
  delete: async (id) => {
    return db.query('DELETE FROM user WHERE user_id = ?', [id]);
  }
};
module.exports = User;