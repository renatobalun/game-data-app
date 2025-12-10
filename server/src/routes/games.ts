import { Router, Request, Response, raw } from "express";
import { Game } from "../models/Game";
import { fetchRandomIgdbGames } from "../services/igdb";
import { fetchRandomRawgGames } from "../services/rawg";

const router = Router();

//punjenje baze
router.get("/populate", async (req: Request, res: Response) => {
  try {
    const { limitPerSource = 20 } = req.body || {};

    const [igdbGames, rawgGames] = await Promise.all([
      fetchRandomIgdbGames(limitPerSource),
      fetchRandomRawgGames(limitPerSource),
    ]);

    const allGames = [...igdbGames, ...rawgGames];

    const created = await Game.insertMany(allGames);

    res.status(201).json({
      message: "Database populated",
      count: created.length,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ error: "Failed to populate database" });
  }
});

//dohvacanje podataka iz baze
router.get("/", async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 50;
    const games = await Game.find().limit(limit).sort({ createdAt: -1 });
    res.json(games);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch games" });
  }
});

//brisanje igrice iz baze
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = await Game.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ error: "Game not found" });
    }

    res.status(204).send();
  } catch (err: any) {
    console.error("Delete game error:", err.message);
    res.status(500).json({ error: "Failed to delete game" });
  }
});

export default router;
