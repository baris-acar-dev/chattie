# Chattie - AI Chatbot with Advanced RAG Knowledge Base

A comprehensive Next.js chatbot application with local Ollama AI models, cloud AI integration, web scraping capabilities, advanced document processing, and intelligent conversation management.

## ✨ Features

### 🤖 **AI & Model Integration**
- 🏠 **Local AI chat** with Ollama models (Llama, Mistral, CodeLlama, etc.)
- ☁️ **Cloud AI chat** with OpenAI GPT models and Google Gemini
- 🔄 **Multi-provider support** with seamless model switching
- ⚙️ **User preferences** with model selection, temperature, and token limits
- 🔑 **Secure API key management** with encrypted storage per user

### 👥 **User Experience & Management**
- 🔐 **Multi-user authentication** with secure login/logout
- 👤 **User profiles** with personal conversations and settings
- 🚪 **Guest access** for immediate testing and exploration
- 📱 **Fully responsive design** - works perfectly on mobile devices
- 🌙 **Dark/Light mode** with automatic theme detection
- ⚡ **Beautiful animations** with Framer Motion and GSAP loading screens

### 🗪 **Advanced Conversation Management**
- 🧠 **Smart conversation titles** - Auto-generated from AI responses using clean content (excludes thinking tokens)
- ✏️ **Inline title editing** - Click to edit conversation titles directly
- 🔍 **Conversation search** - Find conversations by title and content
- 📅 **Date-based grouping** - Organize conversations by Today, Yesterday, This Week, Older
- 💾 **Persistent storage** with PostgreSQL database
- 🗑️ **Easy management** - Delete, rename, and organize conversations

### 📚 **Advanced RAG (Retrieval-Augmented Generation)**
- 🎯 **Smart document selection** and filtering for targeted responses
- 📄 **Multi-format support** (PDF, DOCX, Excel, CSV, TXT, MD, JSON)
- 🧠 **Intelligent chunking** with context-aware content splitting
- 🔍 **Enhanced search** with relevance scoring and corrective RAG
- 📊 **Document analytics** with chunk counts and metadata
- 🎪 **Corrective RAG evaluation** - Automatically validates content relevance

### 🌐 **Web Integration & Scraping**
- 🌍 **Toggleable web scraping** for URL content analysis
- 📰 **Smart content extraction** from web pages
- 🔄 **Real-time web data** integration with chat responses
- � **Privacy controls** - Enable/disable web features per conversation

### 🎭 **Prompt Templates & Personas**
- 👨‍ **Custom AI personas** for different use cases
- 📝 **Template management** with create, edit, delete functionality
- 🏷️ **Tagging system** for easy template organization
- 📊 **Usage tracking** to see which templates are most effective
- 🎯 **Role-specific responses** (Business Consultant, Technical Expert, Creative Writer, etc.)

### 💭 **Enhanced Message Display**
- 🧠 **Thinking message visualization** - Shows AI reasoning process separately
- 📱 **Responsive chat bubbles** that adapt to screen size
-  ℹ  **Source citations** for RAG responses with document references
- ⏰ **Timestamps** with human-readable relative time
- 🎨 **Rich markdown rendering** with syntax highlighting

## 📱 Mobile Responsive Design

Chattie provides an exceptional mobile experience with:

### **📲 Mobile-First Features**
- **Hamburger Navigation** - Standard mobile menu pattern with slide-out sidebar
- **Touch-Friendly Controls** - All buttons meet 44px minimum touch target size
- **Responsive Headers** - Separate optimized headers for mobile and desktop
- **Dark Overlay** - Clear visual feedback when sidebar is open on mobile

### **🎨 Adaptive Interface**
- **Stacked Layouts** - Input and controls stack vertically on small screens
- **Compact Labels** - Shortened text for mobile ("Web" vs "Web Scraping")
- **Flexible Typography** - Appropriate text sizes for different screen sizes
- **Smooth Interactions** - Native momentum scrolling and touch gestures

### **⚡ Mobile Performance**
- **Proper Viewport** - Prevents unwanted zooming on iOS devices
- **Font Size Optimization** - 16px inputs prevent iOS virtual keyboard zoom
- **Efficient Rendering** - Conditional components based on screen size
- **Touch Accessibility** - Screen reader friendly navigation

### **📱 How to Test Mobile**
1. Open browser developer tools
2. Toggle device simulation (mobile view)
3. Test different screen sizes (iPhone, Android, iPad)
4. Verify touch interactions work smoothly
5. Check sidebar navigation opens/closes properly

## 🚀 Quick Start

Before running this application, ensure you have:

1. **Node.js** (v18 or higher)
2. **Ollama** installed and running
3. **PostgreSQL** database (or SQLite for development)

## Installation

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/baris-acar-dev/chattie
cd chattie
npm install
```

### 2. Install and Configure Ollama

```bash
# Install Ollama (visit https://ollama.ai for your OS)
# Then pull some models:
ollama pull llama2
ollama pull mistral
ollama pull codellama
```

### 3. Set Up Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Database - PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/chattie_db"
# OR SQLite for development:
# DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Ollama
OLLAMA_BASE_URL="http://localhost:11434"

# Encryption key for user preferences (generate a secure 64-character hex string)
ENCRYPTION_KEY="your-64-character-encryption-key-here"
```

### 4. (Optional) Configure Google Gemini
To use Google Gemini models alongside Ollama:

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key
3. In the application, click **Preferences** in the chat header
4. Enter your Gemini API key and save
5. Gemini models will now appear in the model selector

### 5. Set Up Database

```bash
# Generate Prisma client
npm run db:generate

# Set up database (for PostgreSQL)
npm run db:push

# For development with migrations
npm run db:migrate
```

### 6. Start the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

Visit `http://localhost:3000` to use the application.

## 🔐 First Time Setup

### Authentication
1. **Open the application** at `http://localhost:3000`
2. **Sign in** with any email address (no password required for demo)
3. **Optional:** Enter your name for personalization
4. **Alternative:** Click "Continue as Guest" for immediate access

### Initial Configuration
1. **Choose your AI model** from the dropdown (local Ollama or cloud Gemini)
2. **Set up Gemini** (optional): Click Preferences → Enter API key
3. **Explore prompt templates** by clicking the "Templates" button
4. **Upload documents** to the Knowledge Base for enhanced AI responses

## Usage

### 🚀 Getting Started with Chattie

#### Basic Chat
1. Select a model from the dropdown (Ollama local models or Gemini cloud models)
2. Local models are marked with "Local" and Gemini models with "Cloud"
3. **Toggle web scraping and knowledge base** features as needed
4. Type your message and press Enter
5. The AI will respond using your selected model and enabled features

### **Smart Conversation Management**

Chattie now includes advanced conversation management features that make it easy to organize and find your chat history:

#### **🧠 Auto-Generated Smart Titles**
- **Intelligent Naming**: Conversation titles are automatically generated from AI responses
- **Clean Content Focus**: Uses actual AI responses (excludes thinking tokens) for meaningful titles
- **Contextual Understanding**: Analyzes both user questions and AI responses to create relevant titles
- **Fallback Protection**: Defaults to "New Conversation" if title generation fails

#### **✏️ Inline Title Editing**
- **Click to Edit**: Simply click the edit icon next to any conversation title
- **Keyboard Shortcuts**: Press Enter to save, Escape to cancel
- **Real-time Validation**: Save button is disabled for empty titles
- **Instant Updates**: Changes are saved immediately to the database

#### **🔍 Advanced Search & Organization**
- **Live Search**: Search through conversation titles and message content in real-time
- **Smart Filtering**: Results update as you type, case-insensitive matching
- **Content Search**: Searches both titles and the actual conversation messages
- **Date-based Grouping**: Organize conversations by Today, Yesterday, This Week, and Older
- **Toggle Views**: Switch between grouped and flat list views
- **Count Badges**: See how many conversations are in each time period

#### **📱 Mobile-Optimized Conversation List**
- **Touch-Friendly**: All edit and delete buttons are properly sized for mobile
- **Responsive Design**: Conversation list adapts to all screen sizes
- **Smooth Animations**: Framer Motion animations for better user experience
- **Hover States**: Edit and delete buttons appear on hover (desktop) or are always visible (mobile)

#### **🎯 How to Use Conversation Management**
1. **New conversations automatically get smart titles** after the first AI response
2. **Edit titles** by clicking the pencil icon next to any conversation
3. **Search conversations** using the search bar at the top of the conversation list
4. **Group by date** by clicking the calendar toggle for better organization
5. **Delete conversations** using the trash icon (hover to reveal on desktop)

### 📚 Knowledge Base (RAG) - Step by Step Guide

#### **Step 1: Upload Documents**
1. Navigate to the **Knowledge Base** page by clicking on the knowledge icon or visiting `/knowledge`
2. Upload your documents using the drag-and-drop interface
3. **Supported formats:**
   - 📄 **PDF Documents** - Automatically extracts text with metadata
   - 📝 **Word Documents (.docx)** - Full text extraction
   - 📊 **Excel Files (.xlsx, .xls)** - Converts data to searchable text
   - 📋 **Text Files (.txt, .md, .csv, .json)** - Direct text processing
4. **File size limit:** 50MB per document
5. Watch as your documents are processed and chunked for optimal search

#### **Step 2: Enable Knowledge Base in Chat**
1. Return to the main chat interface
2. Look for the feature toggles above the message input
3. Check the **"Knowledge Base"** checkbox ✅
4. The system will now consult your uploaded documents when answering questions

#### **Step 3: Select Specific Documents (Optional)**
1. When Knowledge Base is enabled, a document selector dropdown appears
2. **Choose specific documents** to focus your queries on particular content
3. **Select All** to search across your entire knowledge base
4. **Targeted selection** helps get more relevant responses

#### **Step 4: Ask Questions About Your Documents**

Once your knowledge base is enabled, you can ask various types of questions. The AI will automatically search your uploaded documents and provide answers with source citations.

**📋 General Information Queries:**
- *"What are the main points in the uploaded contract?"*
- *"Summarize the key findings from my research papers"*
- *"What topics are covered in my documentation?"*
- *"Give me an overview of the uploaded financial report"*

**🔍 Specific Information Searches:**
- *"Find information about [specific topic] in my documents"*
- *"What does the PDF say about data privacy policies?"*
- *"Where is [specific term/concept] mentioned in my files?"*
- *"Show me details about pricing from the contract"*

**📊 Data Analysis & Comparisons:**
- *"Compare the financial data between Q1 and Q2 reports"*
- *"What are the differences between document A and document B?"*
- *"Analyze the trends shown in my Excel spreadsheets"*
- *"Contrast the approaches mentioned in these research papers"*

**📖 Content Extraction & Summaries:**
- *"Extract all the action items from my meeting notes"*
- *"List the requirements mentioned in the specification document"*
- *"Summarize each chapter/section of the uploaded manual"*
- *"What are the key deadlines mentioned across all documents?"*

**🎯 Targeted Document Queries:**
- *"Based on the technical documentation, how do I implement feature X?"*
- *"According to the legal contract, what are our termination rights?"*
- *"From the user manual, what are the troubleshooting steps for issue Y?"*
- *"What does the research paper conclude about [specific hypothesis]?"*

**💡 Tips for Better Results:**
- **Be specific:** Instead of "tell me about this," ask "what are the security requirements mentioned in the compliance document?"
- **Use document context:** Reference document types (PDF, Excel, contract, manual) in your questions
- **Ask follow-ups:** Build on previous answers with "Can you elaborate on that point?" or "What else does it say about X?"
- **Use natural language:** Ask questions as you would to a human expert who has read all your documents

#### **Advanced Knowledge Base Features:**

🔍 **Smart Search Tab:**
- Use the **Search** tab in Knowledge Base to test queries
- See relevance scores and preview content chunks
- Understand how your documents are processed and ranked

🎯 **Intelligent Document Processing:**
- **PDF files:** Advanced text extraction with paragraph-aware chunking
- **Large documents:** Automatically split into contextual chunks
- **Metadata preservation:** Document titles, page numbers, creation dates
- **Relevance scoring:** AI prioritizes most relevant content sections

📊 **Enhanced RAG Features:**
- **Context-aware chunking** maintains semantic meaning
- **Smart overlap** prevents information loss at chunk boundaries  
- **Document type optimization** - PDFs get special processing treatment
- **Relevance boosting** for longer, more contextual chunks

### 🌐 Web Scraping (Toggleable)

#### **Enable/Disable Web Scraping:**
1. In the chat interface, find the **"Web Scraping"** checkbox
2. **When enabled:** Include URLs in your messages for automatic content analysis
   - Example: *"Analyze this article: https://example.com/article"*
3. **When disabled:** URLs are ignored, focus on direct conversation or knowledge base

#### **Smart Feature Combination:**
- ✅ **Both enabled:** AI can reference web content AND your documents
- 🌐 **Only web scraping:** AI analyzes live web content  
- 📚 **Only knowledge base:** AI uses only your uploaded documents
- ❌ **Both disabled:** Standard AI conversation without external content

### 🔐 Authentication & User Management

#### **Secure Login System:**
1. **Multiple Login Options:**
   - Email-based authentication (no password required for demo)
   - Guest user access for quick start
   - OAuth providers ready (GitHub, Google - when configured)

2. **Getting Started:**
   - Visit the application at `http://localhost:3000`
   - You'll be redirected to the sign-in page automatically
   - Enter your email address (any email works for demo)
   - Optionally enter your name
   - Click "Sign In" or "Continue as Guest"

3. **User Features:**
   - Each user has separate conversations and settings
   - Personal prompt templates and preferences
   - Secure session management with NextAuth.js
   - Easy logout from user menu in top-right corner

#### **User Management:**
- **Personal Data:** Each user's conversations, templates, and settings are isolated
- **Session Security:** JWT-based sessions with automatic expiration
- **Multi-User:** Switch between users by logging out and signing in with different email
- **Guest Access:** Quick guest accounts for testing and demonstrations

### 🎭 Persona (Prompt Templates) System

#### **What are Personas?**
Personas allow you to create custom AI personas and behaviors for different use cases. Instead of always getting a general assistant, you can have specialized AI assistants for specific tasks.

#### **Built-in Personas:**
- 🤖 **General Assistant** - Helpful, harmless, and honest AI assistant
- 📝 **Creative Storyteller** - Imaginative storytelling with vivid narratives
- 💻 **Technical Expert** - Programming and engineering guidance
- 💼 **Business Consultant** - Strategic business advice and analysis
- 🎓 **Educational Tutor** - Patient teaching and explanations
- 🔍 **Research Analyst** - Thorough research and data analysis

#### **Using Personas:**
1. **Select a Persona:**
   - In the chat interface, click the template dropdown above the message input
   - Choose from available templates or select "No Template" for default behavior
   - The selected template appears as a purple indicator

2. **Template Effects:**
   - Changes the AI's personality and response style
   - Provides specialized knowledge and approaches
   - Maintains consistency throughout the conversation
   - Templates are saved with each conversation

#### **Creating Custom Personas:**
1. **Access Persona Manager:**
   - Click the "Personas" button in the chat header
   - Or use the template dropdown and select "Manage Personas"

2. **Persona Components:**
   - **Name & Description:** Identify your template's purpose
   - **Role/Persona:** Define the AI's character and expertise
   - **Input Format:** Guide users on how to interact
   - **Output Format:** Specify desired response structure
   - **Examples:** Provide conversation examples
   - **Tags:** Categorize for easy filtering
   - **Model Settings:** Temperature and token limits

3. **Persona Management:**
   - **Create:** Design templates for specific use cases
   - **Edit:** Modify existing custom templates
   - **Delete:** Remove templates you no longer need
   - **Search & Filter:** Find templates by name or tags
   - **Usage Tracking:** See how often templates are used

#### **Advanced Persona Features:**
- **Model-Specific Settings:** Each template can have optimal temperature/token settings
- **Public Personas:** Share Personas with other users (when enabled)
- **Template Categories:** Organize by tags like "business", "creative", "technical"
- **Usage Analytics:** Track which templates are most effective
- **Template Inheritance:** Build variations of successful templates

#### **Example Use Cases:**

**📧 Email Assistant:**
- Role: Professional email writer with business communication expertise
- Input Format: Bullet points or rough notes about the email's purpose
- Output Format: Well-structured, professional emails with appropriate tone

**🎨 Creative Writing Coach:**
- Role: Experienced creative writing mentor with expertise in various genres
- Input Format: Writing prompts, character ideas, or plot outlines
- Output Format: Detailed creative guidance with examples and techniques

**📊 Data Analysis Expert:**
- Role: Senior data analyst with expertise in statistical analysis and visualization
- Input Format: Data descriptions, analysis questions, or dataset information
- Output Format: Structured analysis with insights, recommendations, and next steps

**🧑‍💻 Code Review Assistant:**
- Role: Senior software engineer specializing in code quality and best practices
- Input Format: Code snippets or programming questions
- Output Format: Detailed reviews with explanations, suggestions, and examples

**🎓 Study Buddy:**
- Role: Patient tutor who excels at breaking down complex concepts
- Input Format: Topics to study, questions, or concepts to understand
- Output Format: Step-by-step explanations with analogies and practice questions

## Project Structure

```
chattie/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── chat/          # Main chat endpoint with RAG integration
│   │   ├── documents/     # Document upload and management
│   │   ├── rag/          # Knowledge base search endpoints
│   │   ├── models/        # AI model management
│   │   └── ...           # Other API routes
│   ├── knowledge/         # Knowledge base management page
│   ├── globals.css        # Global styles with dark mode
│   ├── layout.tsx         # Root layout with theme providers
│   └── page.tsx          # Home page with app loader
├── components/            # React components
│   ├── ChatInterface.tsx  # Main chat UI with feature toggles
│   ├── MessageList.tsx    # Enhanced message display with thinking messages
│   ├── DocumentSelector.tsx # Smart document selection dropdown
│   ├── RAGManager.tsx     # Knowledge base management interface
│   ├── ThinkingMessage.tsx # Special AI reasoning display
│   ├── AppLoader.tsx      # Beautiful startup animation
│   ├── LoadingSpinner.tsx # GSAP-powered loading animations
│   └── ...               # Other components
├── lib/                   # Core services
│   ├── rag.ts            # Advanced RAG system with smart chunking
│   ├── fileParser.ts     # Multi-format document processing
│   ├── ollama.ts         # Ollama integration
│   ├── gemini.ts         # Enhanced Gemini integration
│   ├── webscraper.ts     # Web scraping service
│   ├── prisma.ts         # Database client
│   └── ...               # Other utilities
├── prisma/
│   └── schema.prisma     # Enhanced database schema
└── ...                   # Config files
```

## API Endpoints

### Core Chat & AI
- `POST /api/chat` - Enhanced chat with automatic title generation, RAG, and web scraping
- `GET /api/models` - List available AI models (Ollama, OpenAI GPT, Google Gemini)
- Multiple AI provider support with unified interface

### Conversation Management
- `GET /api/conversations` - Get user conversations with smart titles and metadata
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/[id]` - Get specific conversation with messages
- `PUT /api/conversations/[id]/edit` - Update conversation title (inline editing)
- `DELETE /api/conversations/[id]` - Delete conversation and all messages
- `GET /api/conversations/organize` - Get organized conversations with grouping and search

### Authentication & Users
- `POST /api/auth/[...nextauth]` - Sign in/out endpoints (email-based, guest access)
- `GET /api/auth/session` - Current user session with profile data
- JWT-based session management with secure cookies and multi-user support

### Prompt Templates & Personas
- `GET /api/prompt-templates` - List user's custom prompt templates
- `POST /api/prompt-templates` - Create new template with role, examples, and settings
- `PUT /api/prompt-templates` - Update existing template
- `DELETE /api/prompt-templates` - Remove template
- `POST /api/prompt-templates/init` - Initialize default persona templates
- `POST /api/prompt-templates/[id]/usage` - Track template usage analytics

### Knowledge Base (RAG)
- `POST /api/documents` - Upload and process documents (PDF, DOCX, Excel, CSV, TXT, MD, JSON)
- `GET /api/documents` - List uploaded documents with chunk counts and metadata
- `DELETE /api/documents` - Remove documents from knowledge base
- `GET /api/rag` - Advanced search with corrective RAG and relevance scoring

### Web Integration
- `POST /api/scrape` - Smart web content scraping and extraction
- Real-time web data integration with chat responses

### User Preferences
- `GET /api/preferences` - User preferences, API keys, and model settings
- `POST /api/preferences` - Update preferences with encrypted API key storage

## Troubleshooting

### Ollama Issues
- Ensure Ollama is running: `ollama serve`
- Check if models are available: `ollama list`
- Verify Ollama is accessible at `http://localhost:11434`

### Database Issues
- For PostgreSQL: Ensure database exists and credentials are correct
- For SQLite: Database file will be created automatically
- Reset database: `npx prisma db push --force-reset`

### Knowledge Base (RAG) Issues
- **Upload fails:** Check file size (max 50MB) and format support
- **No search results:** Verify documents are uploaded and chunks were created
- **Poor relevance:** Try more specific queries or upload more relevant documents
- **PDF processing errors:** Ensure PDF is not password-protected or corrupted

### Question & Answer Quality Issues
- **Generic responses:** Make questions more specific with exact terms from your documents
- **Missing information:** Try rephrasing questions or ask about related topics
- **Incorrect answers:** Check source citations and verify against original documents
- **No sources cited:** Ensure Knowledge Base toggle is enabled and documents are selected

### Improving Search Results
- **Use exact terminology:** Include specific terms, names, and phrases from your documents
- **Be more specific:** Instead of "what does it say about X?", ask "what are the requirements for X?"
- **Check document selection:** Ensure relevant documents are selected in the dropdown
- **Try different phrasings:** Ask the same question in different ways to get varied perspectives

### Build Issues
- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules package-lock.json && npm install`
- PDF processing warnings: Normal during build, indicates PDF parsing is working

### Performance Issues
- **Large document uploads:** Break into smaller files if possible
- **Slow search:** Reduce number of selected documents for faster queries
- **Memory usage:** Consider using PostgreSQL instead of SQLite for large knowledge bases

## 🎯 Example Use Cases

### Business Documentation
- Upload company policies, procedures, and manuals
- Ask: *"What's our policy on remote work?"*
- Get instant answers with source references

### Research & Analysis  
- Upload research papers, reports, and articles
- Ask: *"Compare the findings between study A and study B"*
- Get comprehensive analysis across multiple documents

### Legal & Compliance
- Upload contracts, legal documents, and regulations
- Ask: *"What are the termination clauses in this contract?"*
- Get precise answers with exact document references

### Educational Content
- Upload textbooks, lecture notes, and course materials
- Ask: *"Explain the key concepts from chapter 5"*
- Get detailed explanations based on your specific materials

### Technical Documentation
- Upload API docs, technical specs, and manuals
- Ask: *"How do I implement feature X according to our docs?"*
- Get step-by-step guidance from your documentation

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## 🆕 What's New in Latest Version

### **🧠 Smart Conversation Management**
- **Auto-Generated Titles**: Conversations now get meaningful titles automatically generated from AI responses
- **Clean Content Focus**: Title generation excludes thinking tokens, using only actual AI responses
- **Inline Editing**: Click any conversation title to edit it directly in the sidebar
- **Advanced Search**: Search through both conversation titles and message content
- **Date Grouping**: Organize conversations by Today, Yesterday, This Week, and Older

### **📱 Full Mobile Responsiveness**  
- **Mobile-First Design**: Completely redesigned interface that works perfectly on smartphones
- **Touch-Friendly**: All buttons and controls meet 44px minimum touch target size
- **Hamburger Navigation**: Standard mobile menu with slide-out sidebar and dark overlay
- **Responsive Layouts**: Components automatically adapt to screen size
- **iOS Optimization**: Prevents unwanted zooming and provides native scroll feel

### **🤖 Enhanced AI Integration**
- **OpenAI GPT Support**: Added support for GPT-4 and GPT-3.5 models alongside Ollama and Gemini
- **Multi-Provider Management**: Seamlessly switch between local and cloud AI providers
- **Improved Title Generation**: Uses OpenAI GPT-4 for creating contextual conversation titles
- **Better Error Handling**: More robust error messages and fallback mechanisms

### **🎯 Advanced RAG Improvements**
- **Corrective RAG**: Automatically evaluates content relevance and provides better search results
- **Enhanced Document Processing**: Improved parsing for PDF, DOCX, and Excel files
- **Smart Relevance Scoring**: Better ranking of search results with confidence scores
- **Document Analytics**: See chunk counts and processing status for uploaded documents

### **🎨 UI/UX Enhancements**
- **Smooth Animations**: Framer Motion animations throughout the interface
- **Loading Improvements**: GSAP-powered loading screens and better loading states
- **Responsive Typography**: Text sizes and spacing optimized for all screen sizes
- **Better Visual Feedback**: Hover states, loading indicators, and status messages

## 🛠️ Tech Stack

### **Frontend & UI**
- **Framework:** Next.js 15 with App Router
- **UI Library:** React 19 with TypeScript
- **Styling:** Tailwind CSS with responsive design system
- **Animations:** Framer Motion for smooth transitions, GSAP for loading animations
- **Theme:** Dark/Light mode with automatic detection
- **Mobile:** Fully responsive design with touch-friendly interactions

### **Backend & API**
- **API:** Next.js API Routes with RESTful endpoints
- **Database:** Prisma ORM with PostgreSQL (SQLite for development)
- **Authentication:** NextAuth.js with JWT sessions and multi-user support
- **Security:** Encrypted API key storage, secure session management

### **AI & Machine Learning**
- **Local AI:** Ollama integration (Llama, Mistral, CodeLlama, etc.)
- **Cloud AI:** OpenAI GPT models (GPT-4, GPT-3.5) and Google Gemini
- **RAG System:** Advanced retrieval-augmented generation with corrective evaluation
- **Document Processing:** Multi-format parsing (PDF, DOCX, Excel, CSV, TXT, MD, JSON)
- **Search:** Intelligent chunking, relevance scoring, semantic search

### **Features & Integration**
- **Web Scraping:** Cheerio and Axios for smart content extraction
- **File Processing:** PDF-lib, Mammoth (DOCX), XLSX for document parsing
- **Real-time Features:** Live search, instant title updates, responsive UI
- **Data Management:** Conversation organization, template system, user preferences

### **Development & Deployment**
- **Language:** TypeScript with strict type checking
- **Package Manager:** npm with lockfile for reproducible builds
- **Database Migrations:** Prisma schema management
- **Environment:** Environment-based configuration with .env files
- **Error Handling:** Comprehensive error boundaries and user feedback
