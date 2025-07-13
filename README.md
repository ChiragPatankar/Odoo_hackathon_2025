# Odoo_hackathon_2025

# 📚 StackIt – Minimal Q&A Platform

> **Problem Statement 2**: StackIt – A Minimal Q&A Forum Platform  
> **Team Name**: Hackoholics
> **Team Members' Emails**:
> - chirag.17042@sakec.ac.in
> - preksha.dewoolkar17567@sakec.ac.in
> - samruddhi.17153@sakec.ac.in

---

## 🌟 Project Overview

StackIt is a comprehensive Q&A platform with advanced AI-powered features, built to foster knowledge sharing and community engagement. The platform combines traditional Q&A functionality with modern AI capabilities to provide an intelligent, user-friendly experience.

---

## 🚀 Key Features

### 📝 Core Q&A Functionality
- **Question Management**: Create detailed questions with rich text, tags, and categorization
- **Answer System**: Comprehensive answer interface with voting and acceptance features
- **Smart Search**: AI-powered search with content analysis and relevance scoring
- **Trending Questions**: Dynamic trending algorithm based on engagement metrics

### 🤖 AI-Powered Features
- **Smart Tag Suggestions**: Automatic tag generation using NLP analysis
- **Content Quality Analysis**: Real-time writing assistance and quality scoring
- **Duplicate Detection**: Intelligent duplicate question identification
- **Personalized Recommendations**: Content suggestions based on user behavior
- **Content Moderation**: Automated toxicity and spam detection
- **Answer Summarization**: AI-generated summaries for long answers
- **Sentiment Analysis**: Content sentiment evaluation

### 🏆 Gamification & Engagement
- **Medal System**: Progressive achievement system with reputation points
  - 🌱 Beginner (0-100 points): Green badge
  - 🔥 Intermediate (101-500 points): Yellow badge  
  - 💎 Advanced (501-1000 points): Red badge
- **Voting System**: Upvote/downvote functionality for answers
- **User Profiles**: Comprehensive user statistics and achievement tracking
- **Notification System**: Real-time notifications for interactions and mentions

### 🔧 Advanced Features
- **Writing Assistant**: Real-time suggestions for content improvement
- **Topic Analysis**: Automated topic extraction and clustering
- **Engagement Analytics**: Detailed engagement patterns and insights
- **Content Flagging**: Intelligent content moderation system

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 19, React Router, Tailwind CSS |
| **Backend** | Node.js, Express.js |
| **AI/NLP** | Natural, Compromise, String-similarity, Stopword |
| **Data Storage** | JSON-based file system |
| **HTTP Client** | Axios |
| **Development** | Nodemon, React Scripts |

---

## 📁 Project Structure

```
Odoo_hackathon_2025/
├── stackit-frontend/          # React frontend application
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── AskQuestion.js
│   │   │   ├── SmartSearch.js
│   │   │   ├── MedalSystem.js
│   │   │   ├── UserProfile.js
│   │   │   ├── RecommendationsDashboard.js
│   │   │   └── ...
│   │   ├── App.js
│   │   └── index.js
│   ├── public/
│   └── package.json
├── stackit-backend/           # Node.js backend API
│   ├── services/
│   │   └── aiService.js       # AI/NLP service layer
│   ├── data/                  # JSON data storage
│   │   ├── questions.json
│   │   ├── answers.json
│   │   ├── users.json
│   │   └── ...
│   ├── server.js
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Odoo_hackathon_2025
   ```

2. **Install backend dependencies**
   ```bash
   cd stackit-backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../stackit-frontend
   npm install
   ```

4. **Start the development servers**
   
   **Backend** (Terminal 1):
   ```bash
   cd stackit-backend
   npm run dev
   ```
   
   **Frontend** (Terminal 2):
   ```bash
   cd stackit-frontend
   npm start
   ```

5. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:3001`

---

## 🤖 AI Service Capabilities

The AI service (`aiService.js`) provides comprehensive NLP capabilities:

- **Content Analysis**: Quality scoring, complexity assessment, sentiment analysis
- **Smart Matching**: Question similarity detection, duplicate identification
- **Recommendation Engine**: Personalized content suggestions
- **Text Processing**: Keyword extraction, topic modeling, summarization
- **Moderation**: Toxicity detection, spam filtering, content flagging
- **Engagement Analytics**: User behavior analysis, engagement patterns

---

## 📊 Features in Detail

### Medal System
- **Dynamic Reputation**: Points awarded for questions, answers, and community engagement
- **Progressive Badges**: Visual recognition system with three tiers
- **Achievement Tracking**: Detailed statistics and milestone tracking

### Smart Search
- **Content-Based Matching**: Semantic search using NLP
- **Tag Intelligence**: Auto-suggestion based on content analysis
- **Relevance Scoring**: Advanced ranking algorithms

### User Experience
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Dynamic content updates without page refresh
- **Intuitive Navigation**: User-friendly interface design

---

## 🎯 Future Enhancements

- [ ] Database migration (SQLite/PostgreSQL)
- [ ] Enhanced AI models for better accuracy
- [ ] Real-time collaboration features
- [ ] Mobile application development
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

---

## 👥 Contributors

**Team Hackoholics**
- **Chirag** - chirag.17042@sakec.ac.in
- **Preksha Dewoolkar** - preksha.dewoolkar17567@sakec.ac.in  
- **Samruddhi** - samruddhi.17153@sakec.ac.in

**Odoo Collaborator**
- **GitHub**: [mjvi-odoo](https://github.com/mjvi-odoo)

---

## 📄 License

This project is developed for the Odoo Hackathon 2025.

---

<div align="center">
  <strong>Built with ❤️ by Team Hackoholics</strong>
</div>
