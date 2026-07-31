import { Router } from "express";
import TodoController from "../controllers/todo.controller.js";
import TodoService from "../services/todo.service.js";
import TodoModel from "../models/todo.model.js";
import { authenticate } from "../middlewares/authenticate.js";
import { config } from "../config/env.js";
import { validate } from "../middlewares/validate.js";
import {
  createTodoSchema,
  listTodosQuerySchema,
  updateTodoSchema,
} from "../validations/todo.validation.js";

const todoService = new TodoService({ todoModel: TodoModel });
const todoController = new TodoController({ todoService });

const router = Router();

router.use(authenticate(config.JWT_ACCESS_SECRET));

router.post("/", validate(createTodoSchema), todoController.create);
router.get("/", validate(listTodosQuerySchema, "query"), todoController.list);
router.put("/:id", validate(updateTodoSchema), todoController.update);
router.delete("/:id", todoController.remove);

export default router;
