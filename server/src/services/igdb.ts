import axios from "axios";

const IGDB_TOKEN_URL = "https://id.twitch.tv/oauth2/token";

let igdbAccessToken: string | null = null;

//pribavljanje access tokena
async function getIgdbToken() {
  if (igdbAccessToken) return igdbAccessToken;

  const res = await axios.post(IGDB_TOKEN_URL, null, {
    params: {
      client_id: process.env.TWITCH_CLIENT_ID,
      client_secret: process.env.TWITCH_CLIENT_SECRET,
      grant_type: "client_credentials",
    },
  });

  igdbAccessToken = res.data.access_token;
  return igdbAccessToken;
}

//dohvacanje podataka s API
export async function fetchRandomIgdbGames(limit: number) {
  const token = await getIgdbToken();

  const res = await axios.post(
    `${process.env.IGDB_API_URL}/games`,
    `
      fields name, summary, rating, first_release_date, platforms.name, genres.name, cover.image_id;
      where rating != null & rating > 70;
      limit 100;
    `,
    {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID as string,
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const games = res.data as any[];

  const shuffled = games.sort(() => Math.random() - 0.5).slice(0, limit);

  return shuffled.map((g) => ({
    source: "igdb" as const,
    externalId: g.id,
    name: g.name,
    summary: g.summary,
    rating: g.rating,
    releaseDate: g.first_release_date
      ? new Date(g.first_release_date * 1000)
      : undefined,
    platforms: g.platforms?.map((p: any) => p.name) ?? [],
    genres: g.genres?.map((g: any) => g.name) ?? [],
    coverUrl: g.cover
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${g.cover.image_id}.jpg`
      : undefined,
  }));
}
