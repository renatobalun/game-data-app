import { useEffect, useState, ChangeEvent } from "react";
import axios from "axios";

axios.defaults.withCredentials = true;

type User = {
  _id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
};

type Game = {
  _id?: string;
  source: "igdb" | "rawg";
  externalId: number | string;
  name: string;
  summary?: string;
  rating?: number;
  releaseDate?: string;
  platforms?: string[];
  genres?: string[];
  coverUrl?: string;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingGames, setLoadingGames] = useState(false);
  const [error, setError] = useState<string | null>(null);

  //filteri
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState<"all" | "igdb" | "rawg">(
    "all"
  );
  const [minRating, setMinRating] = useState<number | "">("");

  //login
  const handleLogin = () => {
    window.location.href = "http://localhost:5000/auth/twitch/login";
  };

  //logout
  const handleLogout = async () => {
    try {
      await axios.post("http://localhost:5000/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setGames([]);
    }
  };

  //fetch current usera
  const fetchCurrentUser = async () => {
    try {
      setLoadingUser(true);
      setError(null);
      const res = await axios.get<User>("http://localhost:5000/api/user");
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  //fetch igrica iz baze
  const fetchGames = async () => {
    try {
      setLoadingGames(true);
      setError(null);

      const res = await axios.get("http://localhost:5000/api/games", {
        params: { limit: 50 },
      });

      setGames(
        Array.isArray(res.data) ? res.data : []
      );
    } catch (err) {
      console.error("Fetch games error:", err);
      setError("Ne mogu dohvatiti igre.");
      setGames([]);
    } finally {
      setLoadingGames(false);
    }
  };

  //deletaj igricu
  const deleteGame = async (id?: string) => {
    if (!id) return;

    const ok = window.confirm("Jesi siguran da želiš obrisati ovu igru?");
    if (!ok) return;

    try {
      await axios.delete(`http://localhost:5000/api/games/${id}`);
      setGames((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      console.error("Delete game error:", err);
      alert("Ne mogu obrisati igru.");
    }
  };

  //provjeri korisnika
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  //ako je user logiran, fetchaj igrice
  useEffect(() => {
    if (user) {
      fetchGames();
    } else {
      setGames([]);
    }
  }, [user]);

  //handleri za filtere
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleMinRatingChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setMinRating("");
    } else {
      const num = Number(value);
      if (!Number.isNaN(num)) setMinRating(num);
    }
  };


  const filteredGames = games.filter((g) => {
    //filter po izvoru
    if (sourceFilter !== "all" && g.source !== sourceFilter) return false;

    //filter po nazivu
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      if (!g.name.toLowerCase().includes(term)) return false;
    }

    //filter po ocjeni
    if (minRating !== "") {
      if (typeof g.rating === "number") {
        const normalized =
          g.source === "rawg"
            ? g.rating               
            : (g.rating / 100) * 5;

        if (normalized < minRating) return false;
      } else {
        return false;
      }
    }
    return true;
  });

  if (loadingUser) {
    return <div style={{ padding: "2rem" }}>Učitavanje korisnika...</div>;
  }

  return (
    <div style={{ padding: "2rem" }}>
      <header
        style={{
          marginBottom: "2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <h1>Game App</h1>

        <div>
          {user ? (
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}
            >
              {user.avatarUrl && (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  style={{ width: 40, height: 40, borderRadius: "50%" }}
                />
              )}
              <span>
                Prijavljen kao: <strong>{user.username}</strong>
              </span>
              <button onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button onClick={handleLogin}>Login with Twitch</button>
          )}
        </div>
      </header>

      {user ? (
        <section>
          {/* filteri */}
          <div
            style={{
              marginBottom: "1rem",
              display: "flex",
              flexWrap: "wrap",
              gap: "0.75rem",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="Pretraži po nazivu..."
              value={searchTerm}
              onChange={handleSearchChange}
            />

            <select
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(e.target.value as "all" | "igdb" | "rawg")
              }
            >
              <option value="all">Svi izvori</option>
              <option value="igdb">IGDB</option>
              <option value="rawg">RAWG</option>
            </select>

            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              placeholder="Min ocjena (0-5)"
              value={minRating === "" ? "" : minRating}
              onChange={handleMinRatingChange}
              style={{ width: "120px" }}
            />
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}

          {loadingGames && games.length === 0 && <p>Učitavanje igara...</p>}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            {filteredGames &&
              filteredGames.map((g) => (
                <div
                  key={g._id || `${g.source}-${g.externalId}`}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: 8,
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {g.coverUrl && (
                    <img
                      src={g.coverUrl}
                      alt={g.name}
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        marginBottom: "0.5rem",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <h3 style={{ margin: 0 }}>{g.name}</h3>
                  <p style={{ margin: 0, fontSize: "0.9rem", opacity: 0.8 }}>
                    Izvor:{" "}
                    <strong>
                      {g.source ? g.source.toUpperCase() : "NEPOZNATO"}
                    </strong>
                  </p>
                  {typeof g.rating === "number" && (
                    <p style={{ margin: 0, fontSize: "0.9rem" }}>
                      Ocjena:{" "}
                      {g.source === "rawg"
                        ? g.rating.toFixed(1)
                        : ((g.rating / 100) * 5).toFixed(1)}
                    </p>
                  )}
                  {g.genres && g.genres.length > 0 && (
                    <p style={{ margin: 0, fontSize: "0.85rem" }}>
                      Žanrovi: {g.genres.join(", ")}
                    </p>
                  )}
                  {g.platforms && g.platforms.length > 0 && (
                    <p style={{ margin: 0, fontSize: "0.85rem" }}>
                      Platforme: {g.platforms.join(", ")}
                    </p>
                  )}

                  <button
                    onClick={() => deleteGame(g._id)}
                    style={{ marginTop: "0.5rem", alignSelf: "flex-start" }}
                  >
                    Obriši
                  </button>
                </div>
              ))}
          </div>
        </section>
      ) : (
        <p>Ulogiraj se s Twitch-om da vidiš igre iz baze.</p>
      )}
    </div>
  );
}

export default App;
