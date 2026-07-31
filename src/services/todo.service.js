import { ApiError } from "../utils/ApiError.js";

class TodoService {
  constructor({ todoModel }) {
    this.todoModel = todoModel;
  }

  async create({ user_id, title, description }) {
    return this.todoModel.create({ user_id, title, description });
  }

  async update(id, userId, { title, description, completed }) {
    const todo = await this.todoModel.findById(id);

    if (!todo) {
      throw new ApiError(404, "To-do no encontrado");
    }

    if (todo.user_id !== userId) {
      throw new ApiError(403, "No tienes permiso para modificar este to-do");
    }

    return this.todoModel.update(id, { title, description, completed });
  }

  async remove(id, userId) {
    const todo = await this.todoModel.findById(id);

    if (!todo) {
      throw new ApiError(404, "To-do no encontrado");
    }

    if (todo.user_id !== userId) {
      throw new ApiError(403, "No tienes permiso para eliminar este to-do");
    }

    await this.todoModel.delete(id);
  }

  async list(userId, { page, limit }) {
    const offset = (page - 1) * limit;
    const { todos, total } = await this.todoModel.findByUserId(userId, {
      limit,
      offset,
    });

    return { data: todos, page, limit, total };
  }
}

export default TodoService;
