import { query } from "../config/db.js";

class RefreshTokenModel {
  static async create({ user_id, token_hash, expires_at }) {
    const { rows } = await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, expires_at, created_at`,
      [user_id, token_hash, expires_at],
    );
    return rows[0];
  }

  static async findByTokenHash(token_hash) {
    const { rows } = await query(
      "SELECT * FROM refresh_tokens WHERE token_hash = $1",
      [token_hash],
    );
    return rows[0] || null;
  }

  static async revoke(id) {
    await query("UPDATE refresh_tokens SET revoked = true WHERE id = $1", [id]);
  }

  static async revokeAllForUser(user_id) {
    await query(
      "UPDATE refresh_tokens SET revoked = true WHERE user_id = $1 AND revoked = false",
      [user_id],
    );
  }
}

export default RefreshTokenModel;
