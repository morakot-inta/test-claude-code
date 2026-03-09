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

// Mock post store
const posts = [
  { id: 1, title: "Getting Started with Hono", content: "Hono is a fast and lightweight web framework for the Edge.", authorId: 1, createdAt: "2026-03-01T09:00:00Z" },
  { id: 2, title: "JWT Authentication in Bun", content: "Learn how to secure your API routes using JWT tokens with Bun runtime.", authorId: 1, createdAt: "2026-03-03T12:30:00Z" },
  { id: 3, title: "Building REST APIs", content: "A step-by-step guide to building clean and scalable REST APIs.", authorId: 2, createdAt: "2026-03-06T08:15:00Z" },
  { id: 4, title: "Zod Validation Tips", content: "Best practices for validating request bodies using Zod schemas.", authorId: 2, createdAt: "2026-03-08T17:45:00Z" },
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

// Protected routes — requires valid JWT
app.use("/me", jwt({ secret: JWT_SECRET, alg: "HS256" }));
app.get("/me", (c) => {
  const payload = c.get("jwtPayload");
  return c.json({ success: true, user: payload });
});

app.use("/posts/*", jwt({ secret: JWT_SECRET, alg: "HS256" }));

// GET /posts — list all posts
app.get("/posts", (c) => {
  return c.json({ success: true, posts });
});

// GET /posts/:id — get single post
app.get("/posts/:id", (c) => {
  const id = Number(c.req.param("id"));
  const post = posts.find((p) => p.id === id);
  if (!post) return c.json({ success: false, message: "Post not found" }, 404);
  return c.json({ success: true, post });
});

export default {
  port: 3000,
  fetch: app.fetch,
};

console.log("Server running at http://localhost:3000");
