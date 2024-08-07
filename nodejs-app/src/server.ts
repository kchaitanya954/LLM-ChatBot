// File: src/server.ts

import express, { Request, Response } from 'express';
import { spawn } from 'child_process';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';

const app = express();
const port = 3000;

app.use(express.json());

// Database setup
const dbPromise = open({
  filename: './database.sqlite',
  driver: sqlite3.Database
});


// Initialize database
async function initDb() {
  const db = await dbPromise;
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER,
      user_content TEXT,
      ai_content TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

initDb().catch(console.error);

// Send query to Python program
app.post('/query', async (req: Request, res: Response) => {
  const { model_choice, query, conversation_id } = req.body;

  if (!model_choice || !query || conversation_id == null) {
    res.status(400).json({ error: 'model_choice, query, and conversation_id are required' });
    return;
  }
  let db: Database | null = null;
  try {
    const pythonPath = 'python3'; 
    const scriptPath = 'app.py'; 
    
    const pythonProcess = spawn(pythonPath, [scriptPath]);
    
    let outputData = '';
    let errorData = '';

    pythonProcess.stdout.on('data', (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorData += data.toString();
    });

    pythonProcess.on('close', async (code) => {
      if (code !== 0) {
        console.error(`Python script execution failed with code ${code}`);
        console.error(`Error output: ${errorData}`);
        res.status(500).json({ error: 'Python script execution failed', details: errorData });
        return;
      }

      try {
        console.log('Python script output:', outputData);
        const result = JSON.parse(outputData);
        db = await dbPromise;
        // Start a transaction
        await db.run('BEGIN TRANSACTION');

        // Insert the conversation
        await db.run('INSERT INTO messages (conversation_id, user_content, ai_content) VALUES (?, ?, ?)', [conversation_id, query, result.response]);

        // Commit the transaction
        await db.run('COMMIT');
        res.json(result);
      } catch (error) {
        console.error('Processing error:', error);
        if (db) await db.run('ROLLBACK');
        res.status(500).json({ error: 'Failed to process response', details: error instanceof Error ? error.message : 'Unknown error' });
      }
    });

    pythonProcess.stdin.write(JSON.stringify({ model_choice, query, conversation_id }));
    pythonProcess.stdin.end();
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Failed to execute Python script', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// List conversation history
app.get('/conversations', async (_req: Request, res: Response) => {
  try {
    const db = await dbPromise;
    const conversations = await db.all(`
      SELECT id, conversation_id, timestamp, user_content, ai_content
      FROM messages 
      ORDER BY timestamp DESC
      LIMIT 10
    `);
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get specific conversation details
app.get('/conversations/:id', async (req: Request, res: Response) => {
  const conversationId = req.params.id;
  try {
    const db = await dbPromise;
    const messages = await db.all(`
      SELECT user_content, ai_content, timestamp
      FROM messages
      WHERE conversation_id = ?
      ORDER BY timestamp
    `, conversationId);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages', details: error instanceof Error ? error.message : 'Unknown error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
