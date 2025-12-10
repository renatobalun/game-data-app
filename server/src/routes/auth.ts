import { Router, Request, Response } from "express";
import crypto from "crypto";
import axios from "axios";
import { User } from "../models/User";
import { createJwtForUser } from "../utils/jwt";

const router = Router();

const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const TWITCH_USERS_URL = "https://api.twitch.tv/helix/users";

router.get("/twitch/login", (req: Request, res: Response) => {
  const state = crypto.randomBytes(16).toString("hex");
  
  res.cookie("twitch_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
  });

  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID as string,
    redirect_uri: process.env.TWITCH_REDIRECT_URI as string,
    response_type: "code",
    scope: "user:read:email",
    state,
  });

  const authUrl = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`;
  res.redirect(authUrl);
});

//logout
router.post("/logout", (req, res) => {
  res.clearCookie("auth_token");
  res.sendStatus(204);
});

router.get("/twitch/callback", async (req: Request, res: Response) => {
  const { code, state } = req.query;

  const savedState = req.cookies?.twitch_oauth_state;
  if (!state || state !== savedState) {
    return res.status(400).send("Invalid state");
  }

  if (!code) {
    return res.status(400).send("Code is missing");
  }

  try {
    //zamjena code za access_token
    const tokenRes = await axios.post(
      TWITCH_TOKEN_URL,
      new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID as string,
        client_secret: process.env.TWITCH_CLIENT_SECRET as string,
        code: code.toString(),
        grant_type: "authorization_code",
        redirect_uri: process.env.TWITCH_REDIRECT_URI as string,
      })
    );

    const { access_token } = tokenRes.data as { access_token: string };

    //dohvacanje usera s Twitcha
    const userRes = await axios.get(TWITCH_USERS_URL, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID as string,
      },
    });

    const twitchUser = (userRes.data.data as any[])[0];

    //kreiranje ili pronalazak usera
    let user = await User.findOne({ twitchId: twitchUser.id });
    if (!user) {
      user = await User.create({
        twitchId: twitchUser.id,
        username: twitchUser.display_name,
        email: twitchUser.email,
        avatarUrl: twitchUser.profile_image_url,
      });
    }

    //JWT
    const token = createJwtForUser(user);
    res.cookie("auth_token", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    //redirect na frontend
    res.redirect("http://localhost:5173/");
  } catch (err: any) {
    console.error("Twitch callback error:", err.response?.data || err.message);
    res.status(500).send("Twitch login failed");
  }
});

export default router;
