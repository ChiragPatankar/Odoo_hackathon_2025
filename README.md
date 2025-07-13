# Odoo_hackathon_2025
# 📚 StackIt – Minimal Q&A Platform
> **Problem Statement 2**: StackIt – A Minimal Q&A Forum Platform  
> **Team Name**: Hackoholics
> **Team Members' Emails**:
> - chirag.17042@sakec.ac.in
> - preksha.dewoolkar17567@sakec.ac.in
> - samruddhi.17153@sakec.ac.in

🚀 **Odoo Hackathon 2025**  
**Odoo Collaborator:** [@mjvi-odoo](https://github.com/mjvi-odoo)

---

## 📋 Overview

StackIt is a modern, minimal Q&A forum platform designed to facilitate knowledge sharing and community engagement. Built with smart NLP-powered features, it provides an intuitive interface for users to ask questions, share answers, and discover relevant content through intelligent tagging.

---

## ✨ Features

### Core Functionality
- 📝 **Ask Questions** - Create questions with rich titles, detailed descriptions, and relevant tags
- 💬 **Answer Questions** - Respond to questions using a rich text editor with formatting options
- 👍 **Voting System** - Upvote or downvote answers to highlight quality content
- 🏷️ **Smart Tag Suggestions** - NLP-powered auto-tagging using KeyBERT for relevant content discovery
- 🔔 **Notification System** - Real-time notifications for answers and mentions
- 🛡️ **Admin Dashboard** - Comprehensive content moderation and management tools
- 🔒 **Authentication & Authorization** - Secure user authentication with role-based access (User/Admin)

### Smart Features
- 🔍 **Intelligent Tagging** - Uses NLP (KeyBERT) to automatically suggest relevant tags from question content
- 🎯 **Content Discovery** - Enhanced search and filtering capabilities through smart categorization

---

## 🔮 Planned Enhancements

- **Answer Quality Scoring** - Algorithm to rank answers based on quality metrics
- **Toxicity/Spam Detection** - NLP-powered content moderation for safer community interaction
- **Related Question Suggestions** - AI-driven recommendations for similar questions
- **Advanced Search** - Semantic search capabilities for better content discovery

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML, Tailwind CSS (or React) |
| **Backend** | Python (Flask) or Odoo Framework |
| **Database** | SQLite / PostgreSQL |
| **AI/NLP** | Python (KeyBERT, Transformers) |
| **Hosting** | Vercel / Render / GitHub Pages |

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Node.js (if using React frontend)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ChiragPatankar/Odoo_hackathon_2025.git
   cd Odoo_hackathon_2025
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Initialize the database**
   ```bash
   python manage.py migrate
   ```

6. **Run the application**
   ```bash
   python app.py
   ```

The application will be available at `http://localhost:5000`

---

## 📁 Project Structure

```
stackit/
├── app.py                 # Main application file
├── models/               # Database models
├── views/                # Route handlers
├── templates/            # HTML templates
├── static/              # CSS, JS, images
├── nlp/                 # NLP utilities and models
├── migrations/          # Database migrations
├── tests/              # Test files
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

---

## 🎯 Usage

### For Users
1. **Sign up** or **log in** to your account
2. **Browse questions** on the homepage
3. **Ask a question** by clicking the "Ask Question" button
4. **Answer questions** by clicking on any question and providing your response
5. **Vote** on answers to help the community identify quality content
6. **Get notified** when your questions receive answers or you're mentioned

### For Administrators
1. Access the **admin dashboard** at `/admin`
2. **Moderate content** by reviewing flagged posts
3. **Manage users** and assign roles
4. **Monitor platform** activity and engagement

---

## 🤖 NLP Features

### Smart Tagging with KeyBERT
- Automatically extracts relevant keywords from question content
- Suggests contextually appropriate tags
- Improves content discoverability and organization

### Implementation
```python
from keybert import KeyBERT

kw_model = KeyBERT()
keywords = kw_model.extract_keywords(question_text, keyphrase_ngram_range=(1, 2))
```

---

## 🧪 Testing

Run the test suite:
```bash
python -m pytest tests/
```

Run with coverage:
```bash
python -m pytest tests/ --cov=app
```

---

## 🚀 Deployment

### Using Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow the prompts

### Using Render
1. Connect your GitHub repository
2. Set build command: `pip install -r requirements.txt`
3. Set start command: `python app.py`

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Odoo Hackathon 2025 organizers
- KeyBERT for NLP capabilities
- Open source community for inspiration and tools

---

## 📞 Support

For support, please open an issue on GitHub or contact the team members.

---

**Built with ❤️ for Odoo Hackathon 2025**
