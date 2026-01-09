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
app.get("/user/:id", auth, async (c) => {
  const user_id = c.req.param("id");
  const db = c.env.DB;
  const result = await db.prepare("SELECT id, username, email FROM user WHERE id = ?").bind(user_id).run();
  if (!result.success || result.results.length !== 1) {
    return c.text("User not found", 404);
  }
  return c.json(result.results[0]);
});

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

app.get("/search/exercises", auth, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const query = c.req.query("q");
  const limit = parseInt(c.req.query("limit")) || 10000;
  const offset = parseInt(c.req.query("offset")) || 0;

  const result = await db.prepare(`
  SELECT *, user.username as username, (SELECT json_group_array(json_object('id', tag.id, 'label', tag.label, 'category', tag.category)) FROM exercise_tag LEFT JOIN tag ON exercise_tag.tagID = tag.id WHERE exercise_tag.exerciseID = exercise.id) AS tags FROM exercise LEFT JOIN user ON exercise.userID = user.id WHERE (exercise.is_public OR exercise.userID = ?) AND (exercise.name LIKE ? OR user.username LIKE ? OR (SELECT COUNT(*) FROM exercise_tag LEFT JOIN tag ON exercise_tag.tagID = tag.id WHERE exercise_tag.exerciseID = exercise.id AND tag.label LIKE ?) > 0) ORDER BY exercise.id DESC LIMIT ? OFFSET ?;
  `).bind(user.id, `%${query}%`, `%${query}%`, `%${query}%`, limit, offset).run();

  if (!result.success) {
    return c.text("Cannot retrieve exercises", 500);
  }

  const exercises = result.results.map(e => ({
    ...e,
    tags: e.tags ? JSON.parse(e.tags) : []
  }));

  return c.json(exercises);
});


  app.get("/exercises", auth, async (c) => {
  const user = c.get("user");
  const db = c.env.DB;
  const limit = parseInt(c.req.query("limit")) || 10000;
  const offset = parseInt(c.req.query("offset")) || 0;

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
      exercise.userID as user_id,
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
    ORDER BY exercise.id DESC
    LIMIT ?
    OFFSET ?
  `).bind(user.id, limit, offset).run();

  if (!result.success) {
    return c.text("Cannot retrieve exercises", 500);
  }

  const exercises = result.results.map(e => ({
    ...e,
    tags: e.tags ? JSON.parse(e.tags) : []
  }));

  return c.json(exercises);
});

app.get("/exercise/:id", auth, async (c) => {
  const user = c.get("user");
  const exercise_id = c.req.param("id");
  const db = c.env.DB;
  const result = await db.prepare(`
    SELECT 
      exercise.id,
      exercise.userID as user_id,
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
    WHERE exercise.id = ? AND (exercise.is_public = 1 OR exercise.userID = ?)
  `).bind(exercise_id, user.id).run();
  if (!result.success || result.results.length !== 1) {
    return c.text("Exercise not found", 404);
  }
  const exercise = result.results[0];
  exercise.tags = exercise.tags ? JSON.parse(exercise.tags) : [];
  return c.json(exercise);
});

app.get("/exercises/:userid", auth, async (c) => {
  const loggedUser = c.get("user");
  const requestedUserId = c.req.param("userid");
  const db = c.env.DB;

  const result = await db.prepare(`
    SELECT 
      exercise.id,
      exercise.userID AS user_id,
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
    WHERE exercise.userID = ?
      AND (
        exercise.is_public = 1
        OR exercise.userID = ?
      )
    ORDER BY exercise.id DESC
  `).bind(
    requestedUserId,
    loggedUser.id
  ).run();

  if (!result.success) {
    return c.text("Database error", 500);
  }

  const exercises = result.results.map(e => ({
    ...e,
    tags: e.tags ? JSON.parse(e.tags) : []
  }));

  return c.json(exercises);
});



app.put("/exercise/:id", auth, async (c) => {
  const user = c.get("user");
  const exercise_id = c.req.param("id");
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
  const newTagIDs = args["tag_ids"] || [];
  const db = c.env.DB;

  const result = await db.prepare("UPDATE exercise SET name = ?, abc = ?, is_public = ?, bpm = ?, a_steps = ?, d_steps = ?, s_note = ?, h_note = ?, l_note = ? WHERE id = ? AND userID = ?").bind(name, abc, is_public, bpm, a_steps, d_steps, s_note, h_note, l_note, exercise_id, user.id).run();
  if (!result.success) {
    return c.text("Cannot update exercise", 500);
  }

  const oldTags = await db.prepare("SELECT tagID FROM exercise_tag WHERE exerciseID = ?").bind(exercise_id).run();
  if (!oldTags.success) {
    return c.text("Cannot retrieve old tags", 500);
  }


  const oldTagIDs = oldTags.results.map(row => row.tagID);
  console.log("Old Tag IDs:", oldTagIDs);
  console.log("New Tag IDs:", newTagIDs);

  const toAdd = newTagIDs.filter(id => !oldTagIDs.includes(id));
  const toRemove = oldTagIDs.filter(id => !newTagIDs.includes(id));


  for (const tagID of toRemove) {
    const tagResult = await db
      .prepare("DELETE FROM exercise_tag WHERE exerciseID = ? AND tagID = ?")
      .bind(exercise_id, tagID)
      .run();
    if (!tagResult.success) return c.text("Cannot remove old tag", 500);
  }

  for (const tagID of toAdd) {
    console.log("Adding tag:", tagID);
    const tagResult = await db
      .prepare("INSERT INTO exercise_tag(exerciseID, tagID) VALUES(?, ?)")
      .bind(exercise_id, tagID)
      .run();
    if (!tagResult.success) return c.text("Cannot add new tag", 500);
  }


  return c.text("Exercise updated successfully");
});

app.delete("/exercise/:exerciseid", auth, async (c) => {
  const user = c.get("user");
  const exercise_id = c.req.param("exerciseid");
  const db = c.env.DB;
  const result = await db.prepare("DELETE FROM exercise WHERE userID = ? AND id = ?").bind(user.id, exercise_id).run();
  if (!result.success) {
    return c.text("Cannot remove exercise", 400);
  }
  return c.text("Exercise removed successfully");
});

// Favorite routes
app.post("/favorites/:exerciseid", auth, async (c) => {
  const user = c.get("user");
  const exercise_id = c.req.param("exerciseid");
  const db = c.env.DB;
  const result = await db.prepare("INSERT INTO favorite(userID, exerciseID) VALUES(?, ?)").bind(user.id, exercise_id).run();
  if (!result.success) {
    return c.text("Cannot add favorite", 500);
  }
  return c.text("Favorite added successfully");
});

app.delete("/favorites/:exerciseid", auth, async (c) => {
  const user = c.get("user");
  const exercise_id = c.req.param("exerciseid");
  const db = c.env.DB;
  const result = await db.prepare("DELETE FROM favorite WHERE userID = ? AND exerciseID = ?").bind(user.id, exercise_id).run();
  if (!result.success) {
    return c.text("Cannot remove favorite", 500);
  }
  return c.text("Favorite removed successfully");
});

app.get("/favorites", auth, async (c) => {
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
      exercise.userID as user_id,
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
    FROM favorite
    LEFT JOIN exercise ON favorite.exerciseID = exercise.id
    LEFT JOIN user ON exercise.userID = user.id
    WHERE favorite.userID = ?
    ORDER BY favorite.exerciseID DESC
  `).bind(user.id).run();
  if (!result.success) {
    return c.text("Cannot retrieve favorites", 500);
  }
  const exercises = result.results.map(e => ({
    ...e,
    tags: e.tags ? JSON.parse(e.tags) : []
  }));
  return c.json(exercises);
});

app.get("/favorites/check/:exerciseid", auth, async (c) => {
  const user = c.get("user");
  const exercise_id = c.req.param("exerciseid");
  const db = c.env.DB;
  const result = await db.prepare("SELECT COUNT(*) as count FROM favorite WHERE userID = ? AND exerciseID = ?").bind(user.id, exercise_id).run();
  if (!result.success) {
    return c.text("Cannot check favorite", 500);
  }
  const isFavorite = result.results[0].count > 0;
  return c.json({ is_favorite: isFavorite });
});

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
