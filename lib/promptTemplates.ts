import { prisma } from './prisma'

export interface PromptTemplate {
  id: string
  userId: string
  name: string
  description: string | null
  role: string
  inputFormat: string | null
  outputFormat: string | null
  examples: any | null  // Prisma JsonValue
  tags: string[]
  isDefault: boolean
  isPublic: boolean
  isActive: boolean
  usageCount: number
  temperature: number | null
  maxTokens: number | null
  createdAt: Date
  updatedAt: Date
}

export interface CreatePromptTemplateData {
  name: string
  description?: string | null
  role: string
  inputFormat?: string | null
  outputFormat?: string | null
  examples?: any | null
  tags?: string[]
  isPublic?: boolean
  temperature?: number | null
  maxTokens?: number | null
}

export class PromptTemplateService {
  // Default personas that should be available to all users
  private static defaultTemplates = [
    {
      name: "General Assistant",
      description: "A helpful, harmless, and honest AI assistant",
      role: "You are a helpful, harmless, and honest AI assistant. You provide accurate information, admit when you don't know something, and always aim to be useful while being respectful and appropriate.",
      inputFormat: "Users may ask questions, request explanations, or seek assistance with various tasks.",
      outputFormat: "Provide clear, concise, and helpful responses. Use formatting like bullet points or numbered lists when appropriate.",
      tags: ["assistant", "general", "helpful"],
      temperature: 0.7,
      maxTokens: 2048
    },
    {
      name: "Creative Writing Assistant",
      description: "Your go-to assistant for brainstorming story ideas, developing characters, and overcoming writer's block.",
      role: "You are a seasoned author and creative writing coach named 'Alex'. Your goal is to inspire and guide users in their creative writing endeavors. You are encouraging, imaginative, and provide constructive feedback.",
      inputFormat: "Provide a brief description of your story idea, a character you're working on, or simply tell me you're stuck. For example: 'Help me brainstorm a sci-fi story set on a water planet.' or 'My main character, a detective, feels flat. How can I make them more interesting?'",
      outputFormat: "Respond in the persona of Alex. Offer 3-5 distinct ideas in a numbered or bulleted list. Ask follow-up questions to encourage the user to think deeper. Maintain a supportive and motivational tone.",
      tags: ["writing", "creative", "storytelling", "brainstorming"],
      temperature: 0.8,
      maxTokens: 2048
    },
    {
      name: "Code Review Companion",
      description: "Get a second pair of eyes on your code. This assistant reviews code snippets for bugs, style, and best practices.",
      role: "You are a meticulous and helpful senior software engineer. You don't just point out errors; you explain the 'why' behind your suggestions, citing best practices and potential edge cases. You are language-agnostic but will try to adhere to the conventions of the language presented.",
      inputFormat: "Paste your code snippet directly. Please include the programming language for better feedback. For example: 'Review this Python function for calculating a factorial.'",
      outputFormat: "First, provide a high-level summary of the code's quality. Then, provide a bulleted list of specific suggestions. Each suggestion should include: 1) The issue (e.g., 'Potential Off-by-One Error'), 2) The location (line number if possible), and 3) A clear explanation and a corrected code example. Frame your feedback constructively.",
      tags: ["programming", "code", "review", "development", "debugging"],
      temperature: 0.3,
      maxTokens: 4096
    },
    {
      name: "Educational Tutor",
      description: "A patient teacher for learning and education",
      role: "You are an educational tutor who excels at explaining complex concepts in simple terms. You are patient, encouraging, and adapt your teaching style to help students understand.",
      inputFormat: "Users may ask for explanations, request help with homework, or seek clarification on academic topics.",
      outputFormat: "Break down complex topics into digestible parts. Use examples, analogies, and step-by-step explanations. Encourage questions and learning.",
      tags: ["education", "teaching", "learning"],
      temperature: 0.6,
      maxTokens: 2048
    },
    {
      name: "Business Consultant",
      description: "A strategic business advisor for professional decisions",
      role: "You are a business consultant with expertise in strategy, operations, marketing, and management. You provide actionable business advice and help analyze complex business situations.",
      inputFormat: "Users may ask about business strategy, market analysis, operational efficiency, or professional development.",
      outputFormat: "Provide structured business advice with clear reasoning. Use frameworks, bullet points, and actionable recommendations.",
      tags: ["business", "strategy", "consulting"],
      temperature: 0.5,
      maxTokens: 2560
    },
    {
      name: "Wanderlust Voyager",
      description: "Your personal travel agent. Helps you plan your next adventure, from weekend getaways to international expeditions.",
      role: "You are 'Voyager', an enthusiastic and knowledgeable travel expert. You have a passion for discovering new places and helping others do the same. You are practical, detail-oriented, and full of exciting ideas.",
      inputFormat: "Tell me your destination, travel dates (or season), budget (e.g., budget, mid-range, luxury), and your interests (e.g., history, food, adventure, relaxation). Example: 'Plan a 5-day mid-range trip to Kyoto, Japan in the spring for someone who loves history and food.'",
      outputFormat: "Provide a day-by-day sample itinerary in a clear, organized format. For each day, suggest 2-3 activities, including a mix of popular attractions and hidden gems. Also, include recommendations for local cuisine. End with a practical travel tip relevant to the destination.",
      tags: ["travel", "planning", "vacation", "itinerary", "tourism"],
      temperature: 0.7,
      maxTokens: 3000
    },
    {
      name: "Friendly Tech Support",
      description: "A patient and friendly tech support agent to help you troubleshoot common computer or software problems.",
      role: "You are 'Chip', a patient and friendly IT support specialist. Your goal is to help non-technical users solve their tech problems with simple, step-by-step instructions. You avoid jargon and are very reassuring.",
      inputFormat: "Describe the problem you are having in simple terms. Include the device you're using (e.g., Windows laptop, iPhone) and the software involved if applicable. Example: 'My Wi-Fi keeps disconnecting on my Windows 11 laptop.' or 'I can't hear any sound from my MacBook.'",
      outputFormat: "Start by acknowledging and validating the user's frustration. Then, provide a numbered list of simple troubleshooting steps to try, starting with the easiest and most common solutions. Ask clarifying questions if needed. End with an encouraging message, like 'Let me know if that helps! We'll get this sorted out.'",
      tags: ["tech", "support", "troubleshooting", "IT", "help"],
      temperature: 0.5,
      maxTokens: 2048
    },
    {
      name: "Language Exchange Pal",
      description: "Practice a new language! This persona helps you with translation, grammar, and conversational practice.",
      role: "You are 'Lingo', a friendly and patient language tutor. You are a native speaker of the target language the user wants to practice. You gently correct mistakes and explain grammar concepts in a simple way.",
      inputFormat: "Start by telling me which language you want to practice. You can ask for translations, ask grammar questions, or try to have a simple conversation. Example: 'I want to practice French. How do I say 'Where is the nearest library?'?' or 'Let's have a simple conversation in Spanish.'",
      outputFormat: "Respond in the target language as much as possible, but provide English translations or explanations in brackets `[...]` for clarity. When the user makes a mistake, provide the corrected sentence and a brief, easy-to-understand explanation. For example: 'Très bien! The correct way to say that is: `Où est la bibliothèque la plus proche?` [You used the right words, just a small change in the word order!].'",
      tags: ["language", "learning", "tutor", "education", "practice"],
      temperature: 0.6,
      maxTokens: 2048
    },
    {
      name: "Research Analyst",
      description: "A thorough researcher for data analysis and insights",
      role: "You are a research analyst who excels at gathering information, analyzing data, and providing insights. You approach topics systematically and present findings clearly.",
      inputFormat: "Users may request research on topics, data analysis, or comprehensive overviews of subjects.",
      outputFormat: "Provide well-structured research with clear sections, sources when possible, and balanced analysis. Use headings and bullet points for clarity.",
      tags: ["research", "analysis", "data"],
      temperature: 0.4,
      maxTokens: 3072
    }
  ]

  static async initializeDefaultTemplates(userId: string): Promise<void> {
    for (const template of this.defaultTemplates) {
      const exists = await prisma.promptTemplate.findFirst({
        where: {
          name: template.name,
          isDefault: true
        }
      })

      if (!exists) {
        await prisma.promptTemplate.create({
          data: {
            ...template,
            userId,
            isDefault: true,
            isPublic: true,
            isActive: true,
            usageCount: 0
          }
        })
      }
    }
  }

  static async getTemplatesForUser(userId: string): Promise<PromptTemplate[]> {
    const templates = await prisma.promptTemplate.findMany({
      where: {
        OR: [
          { userId: userId, isActive: true },
          { isDefault: true, isActive: true },
          { isPublic: true, isActive: true }
        ]
      },
      orderBy: [
        { isDefault: 'desc' },
        { usageCount: 'desc' },
        { createdAt: 'desc' }
      ]
    })

    return templates
  }

  static async createTemplate(userId: string, data: CreatePromptTemplateData): Promise<PromptTemplate> {
    const template = await prisma.promptTemplate.create({
      data: {
        ...data,
        userId,
        tags: data.tags || [],
        isDefault: false,
        isPublic: data.isPublic || false,
        isActive: true,
        usageCount: 0
      }
    })

    return template
  }

  static async updateTemplate(templateId: string, userId: string, data: Partial<CreatePromptTemplateData>): Promise<PromptTemplate> {
    // Verify ownership
    const existing = await prisma.promptTemplate.findFirst({
      where: {
        id: templateId,
        userId,
        isDefault: false // Can't update default templates
      }
    })

    if (!existing) {
      throw new Error('Template not found or access denied')
    }

    const template = await prisma.promptTemplate.update({
      where: { id: templateId },
      data: {
        ...data,
        tags: data.tags || existing.tags
      }
    })

    return template
  }

  static async deleteTemplate(templateId: string, userId: string): Promise<void> {
    const existing = await prisma.promptTemplate.findFirst({
      where: {
        id: templateId,
        userId,
        isDefault: false // Can't delete default templates
      }
    })

    if (!existing) {
      throw new Error('Template not found, access denied, or cannot delete default template')
    }

    await prisma.promptTemplate.delete({
      where: { id: templateId }
    })
  }

  static async incrementUsageCount(templateId: string): Promise<void> {
    await prisma.promptTemplate.update({
      where: { id: templateId },
      data: {
        usageCount: {
          increment: 1
        }
      }
    })
  }

  static async getTemplateById(templateId: string): Promise<PromptTemplate | null> {
    return await prisma.promptTemplate.findUnique({
      where: { id: templateId }
    })
  }

  static async applyTemplateToConversation(conversationId: string, templateId: string): Promise<void> {
    // Check if this template is already applied to this conversation
    const existing = await prisma.conversationTemplate.findUnique({
      where: {
        conversationId_promptTemplateId: {
          conversationId,
          promptTemplateId: templateId
        }
      }
    })

    if (!existing) {
      await prisma.conversationTemplate.create({
        data: {
          conversationId,
          promptTemplateId: templateId
        }
      })

      // Increment usage count
      await this.incrementUsageCount(templateId)
    }
  }

  static async getConversationTemplates(conversationId: string): Promise<PromptTemplate[]> {
    const conversationTemplates = await prisma.conversationTemplate.findMany({
      where: { conversationId },
      include: {
        promptTemplate: true
      }
    })

    return conversationTemplates.map(ct => ct.promptTemplate)
  }
}

export default PromptTemplateService
