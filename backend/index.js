import express from 'express';
import cors from 'cors';
import fs from 'fs';
import OpenAI from "openai";
import dotenv from "dotenv";
import multer from 'multer';
import { createRequire } from "module";
import PptxParser from "node-pptx-parser";
import path from "path";
import { chunkText } from "./utils/textChunker.js";
import { getEmbedding } from "./utils/embeddings.js";
import { cosineSimilarity } from "./utils/similarity.js";
import {
  getSession,
  createSession,
  updateSession
} from "./data/sessions.repo.js";
import { pool } from "./db/pool.js";
import { OAuth2Client } from "google-auth-library";


dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
console.log(Object.keys(pdfParse));
const mammoth = require("mammoth");


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


async function extractText(file) {
  const buffer = fs.readFileSync(file.path);

  if (file.mimetype === "application/pdf") {
  const data = await pdfParse(buffer);

  console.log("PDF TEXT LENGTH:", data.text?.length);
  console.log("PDF RAW:", data);

  return data.text || "";
}

  if (file.mimetype === "application/pdf") {
    const data = await pdfParse(buffer);
    return data.text || "";
  }

  if (file.mimetype.includes("wordprocessingml")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  }

  if (
    file.mimetype ===
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    const parser = new PptxParser();
    const result = await parser.parse(file.path);

    const text = result.slides
      .map(slide => slide.texts?.join(" ") || "")
      .join("\n");

    return text;
  }

  if (file.mimetype.startsWith("image/")) {
    const imageBuffer = fs.readFileSync(file.path);
    const base64 = imageBuffer.toString("base64");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a study assistant. Use only the provided context."
        },
        {
          role: "user",
          content: `
Context:
${bestChunk}

Question:
${message}
      `
        }
      ]
    });

    return response.choices[0].message.content;
  }

  return "";
}


const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const app = express();
const upload = multer({
  dest: 'uploads/',
});
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const DB_FILE = './db.json';


const readDB = () => {
  if (!fs.existsSync(DB_FILE)) return { sessions: [] };
  return JSON.parse(fs.readFileSync(DB_FILE));
};

const writeDB = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});


app.post("/auth/google", async (req, res) => {
  try {
    const { token } = req.body;

    // 1. verify token from Google
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const google_id = payload.sub;
    const email = payload.email;
    const name = payload.name;

    // 2. check if user exists
    let userResult = await pool.query(
      `SELECT * FROM users WHERE google_id = $1 OR email = $2`,
      [google_id, email]
    );

    let user;

    if (userResult.rows.length === 0) {
      // 3. create user
      const newUser = await pool.query(
        `
        INSERT INTO users (name, email, google_id)
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [name, email, google_id]
      );

      user = newUser.rows[0];
    } else {
      user = userResult.rows[0];
    }

    // 4. return user
    res.json(user);

  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ error: "Invalid Google token" });
  }
});


app.get('/sessions', async (req, res) => {
  try {
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    const result = await pool.query(`
      SELECT *
      FROM chat_sessions
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [user_id]);

    const sessions = result.rows.map(s => ({
      id: String(s.id),
      user_id: s.user_id,
      title: s.title,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    }));

    res.json(sessions);
  } catch (err) {
    console.error("GET /sessions error:", err.message);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
});

app.post('/sessions', async (req, res) => {
  try {
    const { name, subject = "", user_id = 1 } = req.body;

    const result = await pool.query(
      `
      INSERT INTO chat_sessions (user_id, title, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
      `,
      [user_id, name || "Untitled notebook"]
    );

    const session = result.rows[0];

    res.json({
      id: String(session.id),
      title: session.title,
      user_id: session.user_id,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      messages: [],
      files: [],
    });

  } catch (err) {
    console.error("CREATE SESSION ERROR:", err.message);
    res.status(500).json({ error: "Failed to create session" });
  }
});

app.get('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. get session
    const sessionResult = await pool.query(
      `SELECT * FROM chat_sessions WHERE id = $1`,
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = sessionResult.rows[0];

    // 2. get documents linked to this session
    const docsResult = await pool.query(
      `
      SELECT d.*
      FROM documents d
      JOIN document_sessions ds ON ds.document_id = d.id
      WHERE ds.session_id = $1
      `,
      [id]
    );

    // 3. get messages
    const messagesResult = await pool.query(
      `
      SELECT *
      FROM messages
      WHERE session_id = $1
      ORDER BY created_at ASC
      `,
      [id]
    );

    // 4. return structured response
    res.json({
      id: String(session.id),
      title: session.title,
      user_id: session.user_id,
      createdAt: session.created_at,
      updatedAt: session.updated_at,

      files: docsResult.rows,
      messages: messagesResult.rows,
    });

  } catch (err) {
    console.error("GET SESSION ERROR:", err.message);
    res.status(500).json({ error: "Failed to load session" });
  }
});

app.post('/sessions/:id/messages', async (req, res) => {
  try {
    
    const { id } = req.params;
    const { content } = req.body;

    // =========================
    // 1. Check session exists
    // =========================
    const sessionCheck = await pool.query(
      `SELECT id FROM chat_sessions WHERE id = $1`,
      [id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    // =========================
    // 2. Save user message
    // =========================
    const userMessageResult = await pool.query(
      `
      INSERT INTO messages (session_id, role, content, created_at)
      VALUES ($1, 'user', $2, NOW())
      RETURNING *
      `,
      [id, content]
    );

    const userMessage = userMessageResult.rows[0];

    // =========================
    // 3. Get limited history (IMPORTANT FIX)
    // =========================
    const historyResult = await pool.query(
      `
      SELECT role, content
      FROM messages
      WHERE session_id = $1
      ORDER BY created_at DESC
      LIMIT 20
      `,
      [id]
    );

    const history = historyResult.rows.reverse();

    // =========================
    // 4. DEBUG LOG
    // =========================
    console.log("Calling OpenAI...");

    // =========================
    // 5. Call OpenAI
    // =========================
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a helpful study assistant."
        },
        ...history,
      ],
    });

    console.log("OpenAI responded");

    const aiText = completion.choices[0].message.content;

    // =========================
    // 6. Save assistant message
    // =========================
    const aiMessageResult = await pool.query(
      `
      INSERT INTO messages (session_id, role, content, created_at)
      VALUES ($1, 'assistant', $2, NOW())
      RETURNING *
      `,
      [id, aiText]
    );

    const aiMessage = aiMessageResult.rows[0];

    // =========================
    // 7. Update session timestamp
    // =========================
    await pool.query(
      `
      UPDATE chat_sessions
      SET updated_at = NOW()
      WHERE id = $1
      `,
      [id]
    );

    // =========================
    // 8. RESPONSE (IMPORTANT FIX)
    // =========================
    res.json({
      userMessage,
      aiMessage,
    });

  } catch (err) {
    console.error("MESSAGE ERROR:", err);
    res.status(500).json({
      error: "Failed to process message",
      details: err.message,
    });
  }
  
});

app.post("/sessions/:id/files", upload.array("files"), async (req, res) => {
  try {
    const session = db.sessions.find(s => s.id === req.params.id);

    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    const extractedFiles = [];

    for (const file of req.files || []) {
      let content = "";

      try {
        const text = await extractText(file);

        const chunks = await Promise.all(
          chunkText(text, 1000).map(async (chunk) => ({
            text: chunk,
            embedding: await getEmbedding(chunk),
          }))
        );

        extractedFiles.push({
          name: file.originalname,
          type: file.mimetype,
          content: chunks.map((c, i) => ({
            chunkId: i,
            text: c.text,
            embedding: c.embedding
          }))
        });

      } catch (e) {
        console.log("File extract failed:", file.originalname, e.message);

        extractedFiles.push({
          name: file.originalname,
          type: file.mimetype,
          content: ["[Could not extract text]"]
        });
      }
    }

    session.files = [...(session.files || []), ...extractedFiles];

    res.json({ success: true, files: session.files });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Server crashed" });
  }
});

app.patch("/sessions/:id/settings", (req, res) => {
  const updated = updateSession(req.params.id, (session) => ({
    ...session,
    settings: {
      ...session.settings,
      ...req.body,
    },
  }));

  if (!updated) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json(updated.settings);
});

async function testDatabase() {
  const result = await pool.query("SELECT NOW()");
  console.log("✅ PostgreSQL connected:", result.rows[0]);
}

testDatabase();

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});