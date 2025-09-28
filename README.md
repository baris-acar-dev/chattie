# Chattie - AI Chatbot with RAG Knowledge Base

A Next.js chatbot application with local/cloud AI models, document processing, web scraping, and intelligent conversation management.

## ✨ Key Features

- 🤖 **Multi-AI Support**: Local Ollama models + Cloud AI (OpenAI, Gemini)
- 📚 **Knowledge Base**: Upload documents (PDF, DOCX, Excel, etc.) for RAG-enhanced responses
- 🌐 **Web Scraping**: Real-time web content analysis
- 👥 **Multi-User**: Secure authentication with personal conversations
- 🗂️ **Smart Organization**: Auto-generated titles, date grouping, folder management
- 🎭 **Custom Personas**: Create AI personas for different use cases
- 📱 **Mobile Responsive**: Touch-friendly design with hamburger navigation
- 🌙 **Dark/Light Mode**: Automatic theme detection

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- Ollama installed and running
- PostgreSQL database (or SQLite for dev)

### Installation

```bash
# Clone and install
git clone https://github.com/baris-acar-dev/chattie
cd chattie
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your database URL and secrets

# Set up database
npm run db:generate
npm run db:push

# Start development server
npm run dev
```

### Ollama Setup
```bash
# Install Ollama from https://ollama.ai
# Then pull models:
ollama pull llama2
ollama pull mistral
ollama pull codellama
```

### Environment Variables
```env
DATABASE_URL="postgresql://username:password@localhost:5432/chattie_db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
OLLAMA_BASE_URL="http://localhost:11434"
ENCRYPTION_KEY="your-64-character-encryption-key-here"
```

## 📚 Usage

### Basic Chat
1. Select AI model (Ollama local or cloud providers)
2. Toggle Knowledge Base and Web Scraping as needed
3. Type your message and chat!

### Knowledge Base (RAG)
1. Go to `/knowledge` to upload documents
2. Enable "Knowledge Base" toggle in chat
3. Ask questions about your documents
4. Get responses with source citations

### Custom Personas
1. Click "Personas" to manage templates
2. Create custom AI personas for specific tasks
3. Select personas from the dropdown in chat

### Folder Organization
1. Create custom folders for organizing conversations
2. Move conversations between folders
3. Use date-based grouping (Today, Yesterday, etc.)

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **AI**: Ollama, OpenAI GPT, Google Gemini
- **Features**: NextAuth.js, Framer Motion, Web Scraping, Retrieval Augmented Generation (RAG)

## 📁 Project Structure

```
chattie/
├── app/                 # Next.js App Router + API routes
├── components/          # React components
├── lib/                 # Core services (RAG, AI, file parsing)
├── prisma/              # Database schema
└── ...
```

## 🔧 Troubleshooting

**Ollama Issues:**
- Ensure Ollama is running: `ollama serve`
- Check models: `ollama list`

**Database Issues:**
- Reset: `npx prisma db push --force-reset`
- Regenerate client: `npx prisma generate`

**Build Issues:**
- Clear cache: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`

## 📞 API Endpoints

- `POST /api/chat` - Main chat with RAG/web scraping
- `GET /api/conversations` - List conversations
- `POST /api/documents` - Upload documents
- `GET /api/rag` - Search knowledge base
- `GET /api/models` - Available AI models

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
