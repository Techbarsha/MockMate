export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent';

  constructor() {
    this.apiKey = this.getApiKey();
  }

  private getApiKey(): string {
    // Try to get from environment or localStorage
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    const storedKey = localStorage.getItem('gemini_api_key');
    
    if (envKey) return envKey;
    if (storedKey) return storedKey;
    
    // Return empty string if no key found - will use fallback questions
    return '';
  }

  async generateInterviewQuestion(context: {
    type: string;
    difficulty: string;
    previousMessages: any[];
    resumeData?: any;
  }): Promise<string> {
    console.log('Generating interview question with Gemini API');

    if (!this.apiKey) {
      console.log('No Gemini API key found, using fallback questions');
      return this.getFallbackQuestion(context.type, context.resumeData, context.previousMessages.length);
    }

    try {
      const prompt = this.buildInterviewPrompt(context);
      const response = await this.callGeminiAPI(prompt);
      
      if (response && response.trim()) {
        console.log('Generated question with Gemini:', response.substring(0, 100) + '...');
        return response;
      } else {
        throw new Error('Empty response from Gemini API');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      console.log('Falling back to predefined questions');
      return this.getFallbackQuestion(context.type, context.resumeData, context.previousMessages.length);
    }
  }

  async provideFeedback(context: {
    userResponse: string;
    question: string;
    type: string;
  }): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    console.log('Generating feedback with Gemini API');

    if (!this.apiKey) {
      console.log('No Gemini API key found, using basic feedback');
      return this.generateBasicFeedback(context.userResponse, context.type);
    }

    try {
      const prompt = this.buildFeedbackPrompt(context);
      const response = await this.callGeminiAPI(prompt);
      
      if (response) {
        return this.parseFeedbackResponse(response, context.userResponse, context.type);
      } else {
        throw new Error('Empty feedback response from Gemini API');
      }
    } catch (error) {
      console.error('Error getting feedback from Gemini API:', error);
      return this.generateBasicFeedback(context.userResponse, context.type);
    }
  }

  async generateAvatarPersonality(interviewType: string, difficulty: string): Promise<{
    personality: string;
    tone: string;
    questioningStyle: string;
  }> {
    if (!this.apiKey) {
      return this.getDefaultPersonality(interviewType, difficulty);
    }

    try {
      const prompt = `Create a professional interviewer personality for a ${interviewType} interview at ${difficulty} level.

Return a JSON object with:
- personality: Brief description of interviewer's personality
- tone: How they should speak (professional, friendly, etc.)
- questioningStyle: Their approach to asking questions

Keep it professional and realistic for a ${interviewType} interview.`;

      const response = await this.callGeminiAPI(prompt);
      
      if (response) {
        try {
          const parsed = JSON.parse(response);
          return {
            personality: parsed.personality || 'Professional and experienced',
            tone: parsed.tone || 'Professional and encouraging',
            questioningStyle: parsed.questioningStyle || 'Structured and thorough'
          };
        } catch {
          return this.getDefaultPersonality(interviewType, difficulty);
        }
      }
    } catch (error) {
      console.error('Error generating avatar personality:', error);
    }

    return this.getDefaultPersonality(interviewType, difficulty);
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

  private buildInterviewPrompt(context: {
    type: string;
    difficulty: string;
    previousMessages: any[];
    resumeData?: any;
  }): string {
    const { type, difficulty, previousMessages, resumeData } = context;
    
    let prompt = `You are a professional interviewer conducting a ${type} interview for a ${difficulty} level position.

Interview Context:
- Interview Type: ${type}
- Experience Level: ${difficulty}
- Question Number: ${previousMessages.filter(m => m.role === 'assistant').length + 1}

`;

    if (resumeData) {
      prompt += `Candidate's Resume Information:
- Name: ${resumeData.name}
- Skills: ${resumeData.skills?.join(', ') || 'Not specified'}
- Experience: ${resumeData.experience?.map(exp => `${exp.position} at ${exp.company}`).join(', ') || 'Not specified'}
- Education: ${resumeData.education?.map(edu => `${edu.degree} from ${edu.institution}`).join(', ') || 'Not specified'}

`;
    }

    if (previousMessages.length > 0) {
      prompt += `Previous conversation:\n`;
      previousMessages.slice(-4).forEach(msg => {
        prompt += `${msg.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }

    prompt += `Generate the next interview question that:
1. Is appropriate for a ${type} interview at ${difficulty} level
2. Follows naturally from the previous conversation
3. Is professional and realistic
4. ${resumeData ? 'References the candidate\'s background when relevant' : 'Is general but engaging'}
5. Is clear and specific

Return only the question, no additional text or formatting.`;

    return prompt;
  }

  private buildFeedbackPrompt(context: {
    userResponse: string;
    question: string;
    type: string;
  }): string {
    return `You are an expert interview coach providing feedback on a candidate's response.

Interview Question: "${context.question}"
Candidate's Response: "${context.userResponse}"
Interview Type: ${context.type}

Analyze the response and provide feedback in this exact JSON format:
{
  "score": [number from 0-100],
  "feedback": "[2-3 sentences of constructive feedback]",
  "suggestions": ["[suggestion 1]", "[suggestion 2]", "[suggestion 3]"]
}

Evaluate based on:
- Clarity and structure of response
- Relevance to the question
- Professional communication
- Specific examples and details
- Overall interview performance

Be constructive and encouraging while providing actionable advice.`;
  }

  private parseFeedbackResponse(response: string, userResponse: string, type: string): {
    score: number;
    feedback: string;
    suggestions: string[];
  } {
    try {
      const parsed = JSON.parse(response);
      return {
        score: Math.max(0, Math.min(100, parsed.score || 75)),
        feedback: parsed.feedback || 'Good response! Keep practicing to improve your interview skills.',
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [
          'Provide more specific examples',
          'Structure your response clearly',
          'Practice speaking confidently'
        ]
      };
    } catch (error) {
      console.error('Error parsing feedback response:', error);
      return this.generateBasicFeedback(userResponse, type);
    }
  }

  private generateBasicFeedback(response: string, type: string): {
    score: number;
    feedback: string;
    suggestions: string[];
  } {
    const score = this.calculateBasicScore(response);
    
    let feedback = '';
    if (score >= 85) {
      feedback = "Excellent response! You provided detailed information and demonstrated strong communication skills.";
    } else if (score >= 70) {
      feedback = "Good response! Consider adding more specific examples to make your answer even stronger.";
    } else if (score >= 55) {
      feedback = "Decent response, but there's room for improvement. Try to provide more detailed examples.";
    } else {
      feedback = "Your response could be improved. Practice providing more detailed examples and structure.";
    }

    const suggestions = [
      'Provide more specific examples from your experience',
      'Structure your response using the STAR method',
      'Practice speaking clearly and confidently'
    ];

    return { score, feedback, suggestions };
  }

  private calculateBasicScore(response: string): number {
    let score = 50;
    
    if (response.length > 100) score += 10;
    if (response.length > 200) score += 10;
    if (response.length > 300) score += 5;
    
    const positiveWords = ['experience', 'skilled', 'accomplished', 'managed', 'led', 'developed', 'achieved'];
    positiveWords.forEach(word => {
      if (response.toLowerCase().includes(word)) score += 3;
    });
    
    if (response.length < 50) score -= 20;
    
    return Math.min(Math.max(score, 0), 100);
  }

  private getFallbackQuestion(type: string, resumeData?: any, questionIndex: number = 0): string {
    const fallbacks = {
      hr: [
        "Tell me about yourself and what interests you about this role.",
        "What are your greatest strengths and how do they apply to this position?",
        "Where do you see yourself in five years?",
        "Why are you looking to leave your current position?",
        "What motivates you in your work?",
        "How do you handle stress and pressure?",
        "What's your ideal work environment?",
        "Tell me about a time you overcame a challenge.",
        "What are your salary expectations?",
        "Do you have any questions for me?"
      ],
      technical: [
        "Can you walk me through your approach to solving complex technical problems?",
        "Describe a challenging technical project you've worked on recently.",
        "How do you stay updated with the latest technology trends?",
        "Explain a time when you had to debug a difficult issue.",
        "What's your experience with version control systems like Git?",
        "How do you ensure code quality in your projects?",
        "Describe your experience with testing methodologies.",
        "What's your approach to learning new technologies?",
        "How do you handle technical debt in your projects?",
        "Explain your experience with database design and optimization."
      ],
      behavioral: [
        "Describe a challenging situation you faced at work and how you handled it.",
        "Tell me about a time when you had to work with a difficult team member.",
        "Give me an example of when you had to meet a tight deadline.",
        "Describe a situation where you had to learn something new quickly.",
        "Tell me about a time when you made a mistake and how you handled it.",
        "Describe a time when you had to lead a team or project.",
        "Tell me about a time when you disagreed with your manager.",
        "Give me an example of when you went above and beyond.",
        "Describe a time when you had to adapt to a significant change.",
        "Tell me about a time when you had to give difficult feedback."
      ]
    };
    
    const questions = fallbacks[type as keyof typeof fallbacks] || fallbacks.hr;
    const selectedIndex = questionIndex % questions.length;
    
    return questions[selectedIndex];
  }

  private getDefaultPersonality(interviewType: string, difficulty: string): {
    personality: string;
    tone: string;
    questioningStyle: string;
  } {
    const personalities = {
      hr: {
        personality: 'Warm and professional HR manager with excellent people skills',
        tone: 'Friendly yet professional, encouraging and supportive',
        questioningStyle: 'Focuses on cultural fit, motivation, and interpersonal skills'
      },
      technical: {
        personality: 'Experienced technical lead with deep industry knowledge',
        tone: 'Professional and analytical, detail-oriented',
        questioningStyle: 'Probes technical depth, problem-solving approach, and practical experience'
      },
      behavioral: {
        personality: 'Skilled interviewer focused on past experiences and decision-making',
        tone: 'Professional and inquisitive, seeks specific examples',
        questioningStyle: 'Uses STAR method, focuses on real situations and outcomes'
      }
    };

    return personalities[interviewType as keyof typeof personalities] || personalities.hr;
  }

  // Method to save API key
  saveApiKey(apiKey: string): void {
    localStorage.setItem('gemini_api_key', apiKey);
    this.apiKey = apiKey;
  }

  // Method to check if API key is available
  hasApiKey(): boolean {
    return !!this.apiKey;
  }
}