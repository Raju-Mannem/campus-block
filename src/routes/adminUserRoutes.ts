import express from "express";
import {
  listUsers,
  getUserById,
  updateUser,
  deleteUser
} from "../controllers/adminUserController";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = express.Router();

router.use(requireAuth, requireAdmin);

router.get("/", listUsers); // GET /admin/users
router.get("/:userId", getUserById);
router.put("/:userId", updateUser);
router.delete("/:userId", deleteUser);

export default router;
