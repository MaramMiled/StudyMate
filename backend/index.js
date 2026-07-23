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
    return "Image uploaded. Text extraction from images is not implemented yet.";
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

async function findRelevantChunks(sessionId, question) {
  // 1. get question embedding
  const questionEmbedding = await getEmbedding(question);

  // 2. get chunks belonging to this session
  const result = await pool.query(
    `
    SELECT dc.*
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    JOIN document_sessions ds ON ds.document_id = d.id
    WHERE ds.session_id = $1
    `,
    [sessionId]
  );


  const scoredChunks = result.rows.map(chunk => ({
    ...chunk,
    score: cosineSimilarity(
      questionEmbedding,
      chunk.embedding
    )
  }));


  return scoredChunks
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}


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
    const baseTitle = name || "Untitled notebook";

    // Count existing untitled notebooks for this user
    const countResult = await pool.query(
      `
  SELECT COUNT(*) AS count
  FROM chat_sessions
  WHERE user_id = $1
    AND title LIKE 'Untitled notebook%'
  `,
      [user_id]
    );

    const count = Number(countResult.rows[0].count);

    const finalTitle =
      count === 0
        ? baseTitle
        : `${baseTitle} (${count})`;

    const result = await pool.query(
      `
      INSERT INTO chat_sessions (user_id, title, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
      `,
      [user_id, finalTitle]
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

app.patch('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const result = await pool.query(
      `
      UPDATE chat_sessions
      SET title = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [title, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Session not found"
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("UPDATE SESSION ERROR:", err);
    res.status(500).json({
      error: "Failed to update session"
    });
  }
});

app.post('/sessions/:id/messages', async (req, res) => {
  try {

    const { id } = req.params;
    const { content } = req.body;


    // 1. Check session exists
    const sessionCheck = await pool.query(
      `SELECT id FROM chat_sessions WHERE id = $1`,
      [id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }


    // 2. Save user message
    const userMessageResult = await pool.query(
      `
      INSERT INTO messages (session_id, role, content, created_at)
      VALUES ($1, 'user', $2, NOW())
      RETURNING *
      `,
      [id, content]
    );

    const userMessage = userMessageResult.rows[0];


    // 3. Get limited history
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


    // Get document context

    const docsResult = await pool.query(
      `
  SELECT d.title, d.content
  FROM documents d
  JOIN document_sessions ds 
  ON ds.document_id = d.id
  WHERE ds.session_id = $1
  `,
      [id]
    );

    const documentContext = docsResult.rows
      .map(doc => `
Document: ${doc.title}

${doc.content}
`)
      .join("\n\n");

    const history = historyResult.rows.reverse();


    // 4. DEBUG LOG
    console.log("Calling OpenAI...");


    // 5. Call OpenAI
    const relevantChunks = await findRelevantChunks(id, content);

    const context = relevantChunks
      .map(c => c.content)
      .join("\n\n");
    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
            `
You are a study assistant.

The user is asking questions about an uploaded course document.

Use the provided context.
Pay attention to course structure, chapter titles, and sections.
If the user asks about "next chapter", "previous chapter", or course organization, prioritize information from the course plan/table of contents.

If the information is not available, say you don't know.

Context:
${context}
`
        },
        ...history
      ],
    });

    console.log("OpenAI responded");

    const aiText = completion.choices[0].message.content;


    // 6. Save assistant message
    const aiMessageResult = await pool.query(
      `
      INSERT INTO messages (session_id, role, content, created_at)
      VALUES ($1, 'assistant', $2, NOW())
      RETURNING *
      `,
      [id, aiText]
    );

    const aiMessage = aiMessageResult.rows[0];


    // 7. Update session timestamp
    await pool.query(
      `
      UPDATE chat_sessions
      SET updated_at = NOW()
      WHERE id = $1
      `,
      [id]
    );


    // 8. RESPONSE 
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

app.post('/sessions/:id/files', upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;

    // Get uploaded file FIRST
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const user_id = 1;

    const title = file.originalname;
    const file_path = file.path;
    const file_type = file.mimetype;

    const content = await extractText(file);
    console.log(file);

    // Check session exists
    const sessionCheck = await pool.query(
      `SELECT id FROM chat_sessions WHERE id = $1`,
      [id]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Insert document
    const docResult = await pool.query(
      `
      INSERT INTO documents
      (user_id, title, file_path, file_type, content, upload_date)
      VALUES ($1,$2,$3,$4,$5,NOW())
      RETURNING *
      `,
      [user_id, title, file_path, file_type, content]
    );

    const document = docResult.rows[0];


    // Create chunks + embeddings
    const chunks = chunkText(content);

    console.log("NUMBER OF CHUNKS:", chunks.length);

    for (const chunk of chunks) {

      const embedding = await getEmbedding(chunk);

      await pool.query(
        `
    INSERT INTO document_chunks
    (document_id, content, embedding)
    VALUES ($1,$2,$3)
    `,
        [
          document.id,
          chunk,
          JSON.stringify(embedding)
        ]
      );
    }


    await pool.query(
      `
  INSERT INTO document_sessions (session_id, document_id)
  VALUES ($1,$2)
  `,
      [id, document.id]
    );

    res.json({
      document,
      session_id: id,
    });

  } catch (err) {
    console.error("🔥 FULL UPLOAD ERROR:", err);
    console.error("MESSAGE:", err.message);
    console.error("DETAILS:", err.detail);

    res.status(500).json({
      error: "Failed to upload document",
      message: err.message,
      detail: err.detail,
    });
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

app.delete('/files/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Remove the relation with sessions first
    await pool.query(
      `
      DELETE FROM document_sessions
      WHERE document_id = $1
      `,
      [id]
    );

    // Delete the actual document
    const result = await pool.query(
      `
      DELETE FROM documents
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({
      message: "Document deleted successfully",
      document: result.rows[0],
    });

  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({
      error: "Failed to delete document",
      message: err.message,
    });
  }
});

app.delete('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. delete session (cascade will handle document_sessions if FK is correct)
    const result = await pool.query(
      `DELETE FROM chat_sessions WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      success: true,
      deletedSession: result.rows[0]
    });

  } catch (err) {
    console.error("DELETE SESSION ERROR:", err);
    res.status(500).json({ error: "Failed to delete session" });
  }
});

app.patch('/sessions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    const result = await pool.query(
      `
      UPDATE chat_sessions
      SET title = $1,
          updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [title, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Rename failed" });
  }
});

app.post('/sessions/:id/duplicate', async (req, res) => {
  try {
    const { id } = req.params;

    const oldSession = await pool.query(
      `SELECT * FROM chat_sessions WHERE id=$1`,
      [id]
    );

    if (oldSession.rows.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    const session = oldSession.rows[0];

    const result = await pool.query(
      `
      INSERT INTO chat_sessions(user_id,title,created_at,updated_at)
      VALUES($1,$2,NOW(),NOW())
      RETURNING *
      `,
      [session.user_id, session.title + " Copy"]
    );

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Duplicate failed" });
  }
});


//summarrrrrrryyyyyy partttt
app.post("/documents/:id/summary", async (req, res) => {
  try {

    const { id } = req.params;
    const { type } = req.body;

    const allowedTypes = [
      "short",
      "detailed",
      "keypoints",
      "definitions"
    ];

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({
        error: "Invalid summary type"
      });
    }

    const existing = await pool.query(
      `
      SELECT *
      FROM summaries
      WHERE document_id = $1
      AND summary_type = $2
      `,
      [id, type]
    );

    if (existing.rows.length > 0) {
      return res.json(existing.rows[0]);
    }

    const documentResult = await pool.query(
      `
  SELECT *
  FROM documents
  WHERE id = $1
  `,
      [id]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        error: "Document not found"
      });
    }

    const document = documentResult.rows[0];
    const content = document.content.slice(0, 15000);
    let prompt = "";

    switch (type) {

      case "short":
        prompt = `
Create a short summary of this course.

Rules:
- Use bullet points.
- Keep only important concepts.
- Make it easy for students to revise.

Course title:
${document.title}

Course content:
${content}
`;
        break;


      case "detailed":
        prompt = `
Create a detailed summary of this course.
Explain the main ideas clearly.

Course title:
${document.title}

Course content:
${content}
`;
        break;


      case "keypoints":
        prompt = `
Extract the most important key points from this course.

Use bullet points.

Course title:
${document.title}

Course content:
${content}
`;
        break;


      case "definitions":
        prompt = `
Extract important definitions from this course.

Format:
Term: Definition

Course title:
${document.title}

Course content:
${content}
`;
        break;


      default:
        return res.status(400).json({
          error: "Invalid summary type"
        });
    }

    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You are a helpful study assistant."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });


    const summaryContent =
      completion.choices[0].message.content;

    const savedSummary = await pool.query(
      `
INSERT INTO summaries
(document_id, summary_type, content, created_at)
VALUES ($1,$2,$3,NOW())
RETURNING *
`,
      [
        id,
        type,
        summaryContent
      ]
    );

    res.json(savedSummary.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to generate summary"
    });
  }
});


//quiiizzzzzz
app.post("/documents/:id/quiz", async (req, res) => {
  try {

    const { id } = req.params;
    const { difficulty = "medium", number = 5, type = "mcq" } = req.body;
    console.log("REQUESTED QUIZ TYPE:", type);

    // 1. Get document
    const documentResult = await pool.query(
      `
      SELECT *
      FROM documents
      WHERE id = $1
      `,
      [id]
    );


    if (documentResult.rows.length === 0) {
      return res.status(404).json({
        error: "Document not found"
      });
    }


    const document = documentResult.rows[0];


    // 2. Ask AI to create quiz

    const prompt = `
Generate a ${type} quiz.

The requested type is: ${type}

You MUST follow this type.
Do not create multiple choice questions.

Generate ${number} questions.
Difficulty: ${difficulty}


Return ONLY a JSON array.
Do not write any explanation.
Do not use markdown.
Start your response with [
and end your response with ].

Required format:

[
  {
    "question": "question text",
    "options": [],
    "answer": "answer"
  }
]


Special rules:

TYPE: true_false
- The question must be a statement.
- The answer must be only "True" or "False".
- options must be [].


TYPE: multiple_choice
- options must contain 4 choices.
- answer must match one option.


TYPE: open_question
- options must be [].
- answer is a possible correct answer.


TYPE: flashcard
- question is the front.
- answer is the explanation.
- options must be [].


TYPE: fill_blank
- question must contain ___.
- answer is the missing word.
- options must be [].


Course content:

${document.content}
`;


    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You generate educational quizzes."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });


    const aiResponse = completion.choices[0].message.content;


    console.log("QUIZ AI RESPONSE:");
    console.log(aiResponse);



    // 3. Convert AI response to JSON

    const jsonStart = aiResponse.indexOf("[");
    const jsonEnd = aiResponse.lastIndexOf("]");

    const jsonString = aiResponse.substring(
      jsonStart,
      jsonEnd + 1
    );

    const questions = JSON.parse(jsonString);
    const fixedQuestions = questions.map(q => {

      if (type === "true_false") {
        return {
          ...q,
          options: []
        };
      }


      if (type === "open_question") {
        return {
          ...q,
          options: []
        };
      }


      if (type === "flashcard") {
        return {
          ...q,
          options: []
        };
      }


      if (type === "fill_blank") {
        return {
          ...q,
          options: []
        };
      }


      return q;

    });

    // 4. Create quiz

    const quizResult = await pool.query(
      `
      INSERT INTO quizzes
      (document_id, difficulty, created_at)
      VALUES ($1,$2,NOW())
      RETURNING *
      `,
      [
        id,
        difficulty
      ]
    );


    const quiz = quizResult.rows[0];



    // 5. Save questions

    for (const q of fixedQuestions) {

      await pool.query(
        `
        INSERT INTO quiz_questions
        (
          quiz_id,
          type,
          question_text,
          options,
          correct_answer
        )
        VALUES ($1,$2,$3,$4,$5)
        `,
        [
          quiz.id,
          type,
          q.question,
          JSON.stringify(q.options || []),
          q.answer
        ]
      );

    }

    res.json({
      quiz_id: quiz.id,
      questions: fixedQuestions.map(q => ({
        ...q,
        type
      }))
    });


  } catch (err) {

    console.error("QUIZ ERROR:", err);

    res.status(500).json({
      error: "Failed to generate quiz",
      message: err.message
    });

  }
});

app.post("/quizzes/submit", async (req, res) => {
  try {

    const {
      quiz_id,
      answers,
      score
    } = req.body;


    console.log("QUIZ SUBMISSION:");
    console.log(quiz_id);
    console.log(answers);
    console.log(score);


    res.json({
      message: "Quiz submitted successfully",
      score
    });


  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: "Failed to submit quiz"
    });
  }
});

app.post("/planner", async (req, res) => {

  try {

    const {
      exam_date,
      daily_hours,
    } = req.body;


    // 1. Generate plan with AI

    const prompt = `
Create a study schedule.

Exam date:
${exam_date}

Available hours per day:
${daily_hours}

Return ONLY a valid JSON array.
Do not write explanations.
Do not add markdown.
Do not add text before or after the JSON.

Format:

[
 {
  "subject":"Database",
  "day":"2026-07-12",
  "time":"18:00",
  "duration":60
 }
]

`;



    const completion = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: "You create study plans for students."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });


    const aiPlan =
      completion.choices[0].message.content;


    // remove markdown if AI adds ```json
    console.log("AI PLAN:");
    console.log(aiPlan);
    const cleanAI = aiPlan
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const jsonStart = cleanAI.indexOf("[");
    const jsonEnd = cleanAI.lastIndexOf("]");

    const sessions = JSON.parse(
      cleanAI.substring(jsonStart, jsonEnd + 1)
    );



    const user_id = 1;


    // 2. Create plan

    const planResult = await pool.query(
      `
INSERT INTO study_plans
(user_id, exam_date, daily_available_hours)
VALUES($1,$2,$3)
RETURNING *
`,
      [
        user_id,
        exam_date,
        daily_hours
      ]
    );


    const plan = planResult.rows[0];


    // 3. Save sessions

    for (const session of sessions) {

      await pool.query(
        `
INSERT INTO study_sessions
(plan_id, start_time, duration, status)
VALUES($1,$2,$3,$4)
`,
        [
          plan.id,
          `${session.day} ${session.time}`,
          session.duration,
          "planned"
        ]
      );

    }



    res.json({
      plan,
      sessions
    });


  } catch (err) {

    console.error("PLANNER ERROR:", err);

    res.status(500).json({
      error: "Failed to create planner",
      message: err.message
    });

  }

});

async function testDatabase() {
  const result = await pool.query("SELECT NOW()");
  console.log("PostgreSQL connected:", result.rows[0]);
}

testDatabase();

app.listen(5000, () => {
  console.log('Server running on http://localhost:5000');
});