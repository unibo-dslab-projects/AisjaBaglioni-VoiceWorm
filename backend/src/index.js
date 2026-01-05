import { Hono } from "hono";
import { hashPassword, verifyPassword } from "./lib/pbkdf2";
import * as jose from "jose";
import { bearerAuth } from 'hono/bearer-auth'
import { cors } from 'hono/cors'

const app = new Hono()
app.use('*', async (c, next) => {
  if(c.env.PRODUCTION == "0")
    return cors()(c, next)
  else
    await next()
})

const auth = bearerAuth({
  verifyToken: async (token, c) => {
    try {
      const secret = new TextEncoder().encode(c.env.JWT_SECRET);
      const { payload } = await jose.jwtVerify(token, secret);
      c.set("user", payload);
      return true;
    } catch (err) {
      return false;
    }
  }
});


app.post("/register", async (c) => {
  const args = await c.req.json();
  if (args["secret"] != c.env.REGISTRATION_SECRET_TOKEN) {
    return c.text("Invalid secret", 401);
  }
  const username = args["username"];
  const email = args["email"];
  const password = args["password"];
  if (!username || !password || !email) {
    return c.text("Invalid username, email, or password", 400);
  }
  const hashed_password = await hashPassword(password);
  const db = c.env.DB;
  let result = null;
  try {
    result = await db.prepare("INSERT INTO user(username, email, password) VALUES(?, ?, ?) RETURNING id").bind(username, email, hashed_password).run();
  } catch (e) {
    return c.text("User already exists", 409);
  }
  if (!result.success) {
    return c.text("Cannot create user", 500);
  }
  return c.text("User created successfully");
});


app.post("/login", async (c) => {
  const args = await c.req.json();
  const email = args["email"];
  const password = args["password"];
  const db = c.env.DB;
  const result = await db.prepare("SELECT id, username, email, password FROM user WHERE email = ?").bind(email).run();
  if (!result.success || result.results.length !== 1) {
    return c.text("Invalid email", 404);
  }
  const user = result.results[0];
  const isPasswordCorrect = await verifyPassword(user.password, password);
  if (!isPasswordCorrect) {
    return c.text("Invalid password", 401);
  }
  const token = await new jose.SignJWT({ id: user.id, username: user.username, email: user.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("60d")
    .sign(new TextEncoder().encode(c.env.JWT_SECRET));
  return c.text(token);
});

// User routes


// Exercise routes
app.post("/exercises", auth, async (c) => {
  const user = c.get("user");
  const args = await c.req.json();
  const name = args["name"];
  const abc = args["abc"];
  const is_public = args["is_public"];
  const bpm = args["bpm"];
  const a_steps = args["a_steps"];
  const d_steps = args["d_steps"];
  const s_note = args["s_note"];
  const h_note = args["h_note"];
  const l_note = args["l_note"];
  const db = c.env.DB;
  const tagIDs = args["tag_ids"] || [];
  const result = await db.prepare("INSERT INTO exercise(name, abc, userID, is_public, bpm, a_steps, d_steps, s_note, h_note, l_note) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id").bind(name, abc, user.id, is_public, bpm, a_steps, d_steps, s_note, h_note, l_note).run();
  if (!result.success) {
    return c.text("Cannot create exercise", 500);
  }
  const exerciseID = result.results[0].id;
  for (const tagID of tagIDs) {
    const tagResult = await db.prepare("INSERT INTO exercise_tag(exerciseID, tagID) VALUES(?, ?)").bind(exerciseID, tagID).run();
    if (!tagResult.success) {
      return c.text("Cannot create exercise tag", 500);
    }
  }
  return c.json({ id: result.results[0].id });
});

app.get("/exercises", auth, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;

  const result = await db.prepare(`
    SELECT 
      exercise.id,
      exercise.name,
      exercise.abc,
      exercise.is_public,
      exercise.bpm,
      exercise.a_steps,
      exercise.d_steps,
      exercise.s_note,
      exercise.h_note,
      exercise.l_note,
      user.username AS username,
      (
        SELECT json_group_array(
          json_object(
            'id', tag.id,
            'label', tag.label,
            'category', tag.category
          )
        )
        FROM exercise_tag
        LEFT JOIN tag ON exercise_tag.tagID = tag.id
        WHERE exercise_tag.exerciseID = exercise.id
      ) AS tags
    FROM exercise
    LEFT JOIN user ON exercise.userID = user.id
    WHERE (exercise.is_public = 1 OR exercise.userID = ?)
  `).bind(user.id).run();

  if (!result.success) {
    return c.text("Cannot retrieve exercises", 500);
  }

  // SQLite restituisce JSON come stringa → parse
  const exercises = result.results.map(e => ({
    ...e,
    tags: e.tags ? JSON.parse(e.tags) : []
  }));

  return c.json(exercises);
});



// Favorite routes

// Tags routes
app.get("/tags", auth, async (c) => {
  const db = c.env.DB;
  const result = await db.prepare("SELECT id, category, label FROM tag").run();
  if (!result.success) {
    return c.text("Cannot retrieve tags", 500);
  }
  return c.json(result.results);
});

app.post("/tags", auth, async (c) => {
  const args = await c.req.json();
  const category = args["category"];
  const label = args["label"];
  if (!category || !label) {
    return c.text("Invalid category or label", 400);
  }
  const db = c.env.DB;
  const result = await db.prepare("INSERT INTO tag(category, label) VALUES(?, ?) RETURNING id").bind(category, label).run();
  if (!result.success) {
    return c.text("Cannot create tag", 400);
  }
  return c.json({ id: result.results[0].id });
});

// Exercise Tags routes


export default app;
