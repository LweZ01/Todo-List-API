import { query } from "../config/db.js";

class TodoModel {
  static async create({ user_id, title, description }) {
    const { rows } = await query(
      `INSERT INTO todos (user_id, title, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [user_id, title, description],
    );
    return rows[0];
  }

  static async findById(id) {
    const { rows } = await query("SELECT * FROM todos WHERE id = $1", [id]);
    return rows[0] || null;
  }

  static async update(id, { title, description, completed }) {
    const { rows } = await query(
      `UPDATE todos
       SET title = $1, description = $2, completed = $3
       WHERE id = $4
       RETURNING *`,
      [title, description, completed, id],
    );
    return rows[0] || null;
  }

  static async delete(id) {
    await query("DELETE FROM todos WHERE id = $1", [id]);
  }

  static async findByUserId(user_id, { limit, offset }) {
    const { rows } = await query(
      `SELECT *, COUNT(*) OVER() AS total_count
       FROM todos
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [user_id, limit, offset],
    );

    const total = rows.length > 0 ? parseInt(rows[0].total_count, 10) : 0;
    const todos = rows.map(({ total_count, ...todo }) => todo);

    return { todos, total };
  }
}

export default TodoModel;
