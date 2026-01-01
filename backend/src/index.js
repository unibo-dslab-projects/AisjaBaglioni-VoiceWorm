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
  const token = await new jose.SignJWT({ id: user.id, username: user.username, email: user.email})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("60d")
    .sign(new TextEncoder().encode(c.env.JWT_SECRET));
  return c.text(token);
});

// User routes

// Exercise routes

// Favorite routes

// Tags routes

// Exercise Tags routes

export default app;
