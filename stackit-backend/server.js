const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Data file paths
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const ANSWERS_FILE = path.join(DATA_DIR, 'answers.json');

// Initialize data directory and files
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Initialize data files if they don't exist
const initializeDataFiles = () => {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([
      {
        id: 'user1',
        username: 'admin',
        email: 'admin@stackit.com',
        password: 'admin123',
        isAdmin: true,
        avatar: 'https://via.placeholder.com/40/007bff/ffffff?text=A',
        createdAt: new Date().toISOString()
      },
      {
        id: 'user2',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        isAdmin: false,
        avatar: 'https://via.placeholder.com/40/28a745/ffffff?text=J',
        createdAt: new Date().toISOString()
      }
    ], null, 2));
  }
  
  if (!fs.existsSync(QUESTIONS_FILE)) {
    fs.writeFileSync(QUESTIONS_FILE, JSON.stringify([
      {
        id: 'q1',
        title: 'How to connect to SQL Server database?',
        description: 'I need help connecting to SQL Server database using Node.js. What are the best practices?',
        tags: ['SQL', 'Database', 'Node.js'],
        userId: 'user2',
        username: 'johndoe',
        votes: 5,
        answers: 2,
        acceptedAnswerId: null,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'q2',
        title: 'React hooks vs class components',
        description: 'When should I use React hooks versus class components? What are the performance implications?',
        tags: ['React', 'JavaScript', 'Hooks'],
        userId: 'user1',
        username: 'admin',
        votes: 3,
        answers: 1,
        acceptedAnswerId: null,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date(Date.now() - 172800000).toISOString()
      }
    ], null, 2));
  }
  
  if (!fs.existsSync(ANSWERS_FILE)) {
    fs.writeFileSync(ANSWERS_FILE, JSON.stringify([
      {
        id: 'a1',
        questionId: 'q1',
        content: 'You can use the `mssql` package for Node.js. Here\'s a simple example:\n\n```javascript\nconst sql = require(\'mssql\');\n\nconst config = {\n  user: \'your_username\',\n  password: \'your_password\',\n  server: \'your_server\',\n  database: \'your_database\'\n};\n\nsql.connect(config)\n  .then(pool => {\n    return pool.request().query(\'SELECT * FROM users\');\n  })\n  .then(result => {\n    console.log(result);\n  });\n```\n\nMake sure to handle errors and use connection pooling for better performance.',
        userId: 'user1',
        username: 'admin',
        votes: 8,
        isAccepted: false,
        createdAt: new Date(Date.now() - 82800000).toISOString()
      },
      {
        id: 'a2',
        questionId: 'q1',
        content: 'Another approach is to use TypeORM which provides better type safety:\n\n```typescript\nimport { createConnection } from \'typeorm\';\n\nconst connection = await createConnection({\n  type: \'mssql\',\n  host: \'localhost\',\n  port: 1433,\n  username: \'your_username\',\n  password: \'your_password\',\n  database: \'your_database\',\n  entities: [User, Question]\n});\n```',
        userId: 'user2',
        username: 'johndoe',
        votes: 3,
        isAccepted: false,
        createdAt: new Date(Date.now() - 79200000).toISOString()
      }
    ], null, 2));
  }
};

// Helper functions
const readDataFile = (filePath) => {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeDataFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Initialize data files
initializeDataFiles();

// Routes

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = readDataFile(USERS_FILE);
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
        avatar: user.avatar
      },
      token: `token_${user.id}`
    });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { username, email, password } = req.body;
  const users = readDataFile(USERS_FILE);
  
  // Check if user already exists
  const existingUser = users.find(u => u.email === email || u.username === username);
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'User already exists' });
  }
  
  const newUser = {
    id: uuidv4(),
    username,
    email,
    password,
    isAdmin: false,
    avatar: `https://via.placeholder.com/40/007bff/ffffff?text=${username.charAt(0).toUpperCase()}`,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  writeDataFile(USERS_FILE, users);
  
  res.json({
    success: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      isAdmin: newUser.isAdmin,
      avatar: newUser.avatar
    },
    token: `token_${newUser.id}`
  });
});

// Question routes
app.get('/api/questions', (req, res) => {
  const questions = readDataFile(QUESTIONS_FILE);
  const { search, tag, filter } = req.query;
  
  let filteredQuestions = questions;
  
  // Search filter
  if (search) {
    filteredQuestions = filteredQuestions.filter(q => 
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      q.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Tag filter
  if (tag) {
    filteredQuestions = filteredQuestions.filter(q => 
      q.tags.includes(tag)
    );
  }
  
  // Sort filter
  if (filter === 'newest') {
    filteredQuestions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } else if (filter === 'unanswered') {
    filteredQuestions = filteredQuestions.filter(q => q.answers === 0);
  } else if (filter === 'score') {
    filteredQuestions.sort((a, b) => b.votes - a.votes);
  }
  
  res.json(filteredQuestions);
});

app.get('/api/questions/:id', (req, res) => {
  const questions = readDataFile(QUESTIONS_FILE);
  const question = questions.find(q => q.id === req.params.id);
  
  if (!question) {
    return res.status(404).json({ message: 'Question not found' });
  }
  
  // Get answers for this question
  const answers = readDataFile(ANSWERS_FILE);
  const questionAnswers = answers.filter(a => a.questionId === req.params.id);
  
  res.json({
    ...question,
    answers: questionAnswers
  });
});

app.post('/api/questions', (req, res) => {
  const { title, description, tags, userId, username } = req.body;
  const questions = readDataFile(QUESTIONS_FILE);
  
  const newQuestion = {
    id: uuidv4(),
    title,
    description,
    tags: tags || [],
    userId,
    username,
    votes: 0,
    answers: 0,
    acceptedAnswerId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  questions.push(newQuestion);
  writeDataFile(QUESTIONS_FILE, questions);
  
  res.json(newQuestion);
});

app.put('/api/questions/:id/vote', (req, res) => {
  const { voteType } = req.body; // 'up' or 'down'
  const questions = readDataFile(QUESTIONS_FILE);
  
  const questionIndex = questions.findIndex(q => q.id === req.params.id);
  if (questionIndex === -1) {
    return res.status(404).json({ message: 'Question not found' });
  }
  
  questions[questionIndex].votes += voteType === 'up' ? 1 : -1;
  writeDataFile(QUESTIONS_FILE, questions);
  
  res.json(questions[questionIndex]);
});

// Answer routes
app.post('/api/answers', (req, res) => {
  const { questionId, content, userId, username } = req.body;
  const answers = readDataFile(ANSWERS_FILE);
  const questions = readDataFile(QUESTIONS_FILE);
  
  const newAnswer = {
    id: uuidv4(),
    questionId,
    content,
    userId,
    username,
    votes: 0,
    isAccepted: false,
    createdAt: new Date().toISOString()
  };
  
  answers.push(newAnswer);
  writeDataFile(ANSWERS_FILE, answers);
  
  // Update question answer count
  const questionIndex = questions.findIndex(q => q.id === questionId);
  if (questionIndex !== -1) {
    questions[questionIndex].answers += 1;
    writeDataFile(QUESTIONS_FILE, questions);
  }
  
  res.json(newAnswer);
});

app.put('/api/answers/:id/vote', (req, res) => {
  const { voteType } = req.body; // 'up' or 'down'
  const answers = readDataFile(ANSWERS_FILE);
  
  const answerIndex = answers.findIndex(a => a.id === req.params.id);
  if (answerIndex === -1) {
    return res.status(404).json({ message: 'Answer not found' });
  }
  
  answers[answerIndex].votes += voteType === 'up' ? 1 : -1;
  writeDataFile(ANSWERS_FILE, answers);
  
  res.json(answers[answerIndex]);
});

app.put('/api/answers/:id/accept', (req, res) => {
  const { questionId } = req.body;
  const answers = readDataFile(ANSWERS_FILE);
  const questions = readDataFile(QUESTIONS_FILE);
  
  // First, unaccept all answers for this question
  answers.forEach(answer => {
    if (answer.questionId === questionId) {
      answer.isAccepted = false;
    }
  });
  
  // Accept the specific answer
  const answerIndex = answers.findIndex(a => a.id === req.params.id);
  if (answerIndex !== -1) {
    answers[answerIndex].isAccepted = true;
    writeDataFile(ANSWERS_FILE, answers);
    
    // Update question with accepted answer
    const questionIndex = questions.findIndex(q => q.id === questionId);
    if (questionIndex !== -1) {
      questions[questionIndex].acceptedAnswerId = req.params.id;
      writeDataFile(QUESTIONS_FILE, questions);
    }
  }
  
  res.json(answers[answerIndex]);
});

// Tags route
app.get('/api/tags', (req, res) => {
  const questions = readDataFile(QUESTIONS_FILE);
  const allTags = questions.flatMap(q => q.tags);
  const uniqueTags = [...new Set(allTags)];
  
  res.json(uniqueTags);
});

// Users route
app.get('/api/users/:id', (req, res) => {
  const users = readDataFile(USERS_FILE);
  const user = users.find(u => u.id === req.params.id);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin,
    avatar: user.avatar,
    createdAt: user.createdAt
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`- POST /api/auth/login`);
  console.log(`- POST /api/auth/register`);
  console.log(`- GET /api/questions`);
  console.log(`- GET /api/questions/:id`);
  console.log(`- POST /api/questions`);
  console.log(`- PUT /api/questions/:id/vote`);
  console.log(`- POST /api/answers`);
  console.log(`- PUT /api/answers/:id/vote`);
  console.log(`- PUT /api/answers/:id/accept`);
  console.log(`- GET /api/tags`);
  console.log(`- GET /api/users/:id`);
}); 