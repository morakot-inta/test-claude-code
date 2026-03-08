import { Hono } from "hono";
import { jwt, sign } from "hono/jwt";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono();

const JWT_SECRET = "super-secret-key"; // change in production

// Mock user store
const users = [
  { id: 1, username: "admin", password: "admin123", role: "admin" },
  { id: 2, username: "user", password: "user123", role: "user" },
];

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// POST /auth/login
app.post("/auth/login", zValidator("json", loginSchema), async (c) => {
  const { username, password } = c.req.valid("json");

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return c.json({ success: false, message: "Invalid credentials" }, 401);
  }

  const token = await sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + 60 * 60, // 1 hour
    },
    JWT_SECRET
  );

  return c.json({
    success: true,
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

// Protected route — requires valid JWT
app.use("/me", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.get("/me", (c) => {
  const payload = c.get("jwtPayload");
  return c.json({ success: true, user: payload });
});

export default {
  port: 3000,
  fetch: app.fetch,
};

console.log("Server running at http://localhost:3000");
