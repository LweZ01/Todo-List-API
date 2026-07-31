class TodoController {
  constructor({ todoService }) {
    this.todoService = todoService;
  }

  create = async (req, res, next) => {
    try {
      const { title, description } = req.body;
      const todo = await this.todoService.create({
        user_id: req.user.id,
        title,
        description,
      });
      res.status(201).json(todo);
    } catch (error) {
      next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { title, description, completed } = req.body;
      const todo = await this.todoService.update(id, req.user.id, {
        title,
        description,
        completed,
      });
      res.status(200).json(todo);
    } catch (error) {
      next(error);
    }
  };

  remove = async (req, res, next) => {
    try {
      const { id } = req.params;
      await this.todoService.remove(id, req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  list = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const result = await this.todoService.list(req.user.id, { page, limit });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}

export default TodoController;
