import { query } from "../config/db.js";

class UserModel {
  static async findByEmail(email) {
    const { rows } = await query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return rows[0] || null;
  }

  static async create({ name, email, password_hash }) {
    const { rows } = await query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name, email, password_hash],
    );
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await query("SELECT * FROM users WHERE id = $1", [id]);
    return rows[0] || null;
  }
}

export default UserModel;
