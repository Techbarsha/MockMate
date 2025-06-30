export class GeminiVideoService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  private conversationHistory: Array<{ role: string; content: string }> = [];
  private currentInterviewContext: any = null;

  constructor() {
    this.apiKey = this.getApiKey();
  }

  private getApiKey(): string {
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    const storedKey = localStorage.getItem('gemini_api_key');
    
    if (envKey) return envKey;
    if (storedKey) return storedKey;
    
    return '';
  }

  async startInterviewSession(config: {
    interviewType: string;
    difficulty: string;
    duration: number;
    resumeData?: any;
    candidateName?: string;
  }): Promise<{
    sessionId: string;
    welcomeMessage: string;
    status: string;
  }> {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    this.currentInterviewContext = {
      ...config,
      sessionId: Date.now().toString(),
      startTime: new Date(),
      questionCount: 0,
      maxQuestions: Math.floor(config.duration / 2) // Roughly 2 minutes per question
    };

    this.conversationHistory = [];

    try {
      const welcomeMessage = await this.generateWelcomeMessage(config);
      
      return {
        sessionId: this.currentInterviewContext.sessionId,
        welcomeMessage,
        status: 'active'
      };
    } catch (error) {
      console.error('Error starting Gemini interview session:', error);
      throw error;
    }
  }

  private async generateWelcomeMessage(config: any): Promise<string> {
    const prompt = `You are a professional ${config.interviewType} interviewer conducting a ${config.difficulty} level interview. 

${config.resumeData ? `The candidate's background:
- Name: ${config.candidateName || 'the candidate'}
- Skills: ${config.resumeData.skills?.join(', ') || 'Not specified'}
- Experience: ${config.resumeData.experience?.map((exp: any) => `${exp.position} at ${exp.company}`).join(', ') || 'Not specified'}
` : ''}

Generate a warm, professional welcome message that:
1. Introduces yourself as the interviewer
2. Sets a comfortable tone
3. Briefly explains the interview format
4. Asks the first question: "Tell me about yourself and what interests you about this role"

Keep it conversational and under 100 words. Be encouraging and professional.`;

    return await this.callGeminiAPI(prompt);
  }

  async generateResponse(userMessage: string): Promise<{
    response: string;
    isComplete: boolean;
    nextAction: 'continue' | 'wrap_up' | 'complete';
  }> {
    if (!this.apiKey || !this.currentInterviewContext) {
      throw new Error('Interview session not properly initialized');
    }

    // Add user message to history
    this.conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    this.currentInterviewContext.questionCount++;

    try {
      const response = await this.generateInterviewerResponse();
      
      // Add AI response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: response
      });

      // Determine if interview should continue
      const shouldContinue = this.currentInterviewContext.questionCount < this.currentInterviewContext.maxQuestions;
      const nextAction = shouldContinue ? 'continue' : 
                        this.currentInterviewContext.questionCount >= this.currentInterviewContext.maxQuestions - 1 ? 'wrap_up' : 'complete';

      return {
        response,
        isComplete: !shouldContinue,
        nextAction
      };
    } catch (error) {
      console.error('Error generating Gemini response:', error);
      throw error;
    }
  }

  private async generateInterviewerResponse(): Promise<string> {
    const context = this.currentInterviewContext;
    const lastUserMessage = this.conversationHistory[this.conversationHistory.length - 1]?.content || '';
    
    let prompt = `You are a professional ${context.interviewType} interviewer. This is question ${context.questionCount} of ${context.maxQuestions} in a ${context.difficulty} level interview.

Interview Context:
- Type: ${context.interviewType}
- Level: ${context.difficulty}
- Progress: ${context.questionCount}/${context.maxQuestions}

${context.resumeData ? `Candidate Background:
- Skills: ${context.resumeData.skills?.join(', ') || 'Not specified'}
- Experience: ${context.resumeData.experience?.map((exp: any) => `${exp.position} at ${exp.company}`).join(', ') || 'Not specified'}
` : ''}

Conversation History:
${this.conversationHistory.slice(-6).map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`).join('\n')}

The candidate just responded: "${lastUserMessage}"

Generate your next response as the interviewer that:
1. Briefly acknowledges their answer (1-2 sentences)
2. ${context.questionCount >= context.maxQuestions - 1 ? 
   'Asks a final wrap-up question like "Do you have any questions for me?" or "Is there anything else you\'d like me to know?"' :
   'Asks a relevant follow-up question appropriate for this interview type and level'}
3. Maintains a professional, encouraging tone
4. Keeps the response under 80 words
5. ${context.resumeData ? 'References their background when relevant' : 'Stays general but engaging'}

Types of questions for ${context.interviewType}:
${this.getQuestionGuidelines(context.interviewType)}

Return only the interviewer's response, no additional formatting.`;

    return await this.callGeminiAPI(prompt);
  }

  private getQuestionGuidelines(interviewType: string): string {
    const guidelines = {
      hr: `- Background and motivation questions
- Cultural fit and values alignment
- Career goals and aspirations
- Strengths and weaknesses
- Why this company/role
- Work style and preferences`,
      
      technical: `- Technical skills and experience
- Problem-solving approaches
- System design concepts
- Code quality and best practices
- Technology choices and trade-offs
- Learning and staying current`,
      
      behavioral: `- STAR method scenarios
- Past experiences and decisions
- Leadership and teamwork
- Conflict resolution
- Adaptability and change management
- Achievement and failure stories`
    };

    return guidelines[interviewType as keyof typeof guidelines] || guidelines.hr;
  }

  async generateFinalFeedback(): Promise<{
    overallScore: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    summary: string;
  }> {
    if (!this.currentInterviewContext || this.conversationHistory.length === 0) {
      throw new Error('No interview data available for feedback');
    }

    const prompt = `Analyze this ${this.currentInterviewContext.interviewType} interview and provide comprehensive feedback.

Interview Details:
- Type: ${this.currentInterviewContext.interviewType}
- Level: ${this.currentInterviewContext.difficulty}
- Duration: ${this.currentInterviewContext.duration} minutes

Full Conversation:
${this.conversationHistory.map(msg => `${msg.role === 'user' ? 'Candidate' : 'Interviewer'}: ${msg.content}`).join('\n\n')}

Provide feedback in this exact JSON format:
{
  "overallScore": [number from 0-100],
  "feedback": "[2-3 sentences of overall assessment]",
  "strengths": ["[strength 1]", "[strength 2]", "[strength 3]"],
  "improvements": ["[improvement 1]", "[improvement 2]", "[improvement 3]"],
  "summary": "[1-2 sentences summarizing the interview performance]"
}

Evaluate based on:
- Communication clarity and structure
- Relevance and depth of responses
- Professional demeanor
- Specific examples and details
- Overall interview performance for the ${this.currentInterviewContext.difficulty} level

Be constructive and encouraging while providing actionable feedback.`;

    try {
      const response = await this.callGeminiAPI(prompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Error generating feedback:', error);
      // Return default feedback if parsing fails
      return {
        overallScore: 75,
        feedback: "You demonstrated good communication skills throughout the interview. Your responses showed relevant experience and a professional attitude.",
        strengths: [
          "Clear communication style",
          "Relevant examples provided",
          "Professional demeanor maintained"
        ],
        improvements: [
          "Provide more specific metrics and results",
          "Use the STAR method for behavioral questions",
          "Ask more thoughtful questions about the role"
        ],
        summary: "Overall, this was a solid interview performance with room for improvement in providing more detailed examples."
      };
    }
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('No Gemini API key available');
    }

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error('Invalid response format from Gemini API');
    }
  }

  getConversationHistory(): Array<{ role: string; content: string }> {
    return [...this.conversationHistory];
  }

  getSessionInfo(): any {
    return this.currentInterviewContext;
  }

  endSession(): void {
    this.conversationHistory = [];
    this.currentInterviewContext = null;
  }

  saveApiKey(apiKey: string): void {
    localStorage.setItem('gemini_api_key', apiKey);
    this.apiKey = apiKey;
  }

  hasApiKey(): boolean {
    return !!this.apiKey;
  }
}