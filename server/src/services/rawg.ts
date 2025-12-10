import axios from "axios";

//dohvacanje podataka s APIja
export async function fetchRandomRawgGames(limit: number) {
  const res = await axios.get(`${process.env.RAWG_API_URL}/games`, {
    params: {
      key: process.env.RAWG_API_KEY,
      page_size: 40,
      ordering: "-rating"
    },
  });

  const games = res.data.results as any[];

  const shuffled = games.sort(() => Math.random() - 0.5).slice(0, limit);

  return shuffled.map((g) => ({
    source: "rawg" as const,
    externalId: g.id,
    name: g.name,
    summary: g.description_raw || g.slug,
    rating: g.rating,
    releaseDate: g.released ? new Date(g.released) : undefined,
    platforms: g.platforms?.map((p: any) => p.platform.name) ?? [],
    genres: g.genres?.map((g: any) => g.name) ?? [],
    coverUrl: g.background_image,
  }));
}
