import { Router, Response } from "express";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { User } from "../models/User";

const router = Router();

//dohvacanje podataka o useru
router.get("/", authMiddleware, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const user = await User.findById(userId).select("-__v");
  res.json(user);
});

export default router;
