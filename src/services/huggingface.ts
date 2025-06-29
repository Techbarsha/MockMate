import { StorageService } from './storage';

export class HuggingFaceService {
  private baseUrl = 'https://api-inference.huggingface.co/models';
  private model = 'microsoft/DialoGPT-large';
  private storageService: StorageService;

  constructor() {
    this.storageService = StorageService.getInstance();
  }

  async generateInterviewQuestion(context: {
    type: string;
    difficulty: string;
    previousMessages: any[];
    resumeData?: any;
  }): Promise<string> {
    const prompt = this.buildPrompt(context);
    const apiKey = this.storageService.getHuggingFaceApiKey();
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add authorization header if API key is available
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(`${this.baseUrl}/${this.model}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          inputs: prompt,
          parameters: {
            max_length: 150,
            temperature: 0.7,
            do_sample: true,
            pad_token_id: 50256
          }
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('Hugging Face API requires authentication. Using fallback questions.');
          return this.getFallbackQuestion(context.type, context.resumeData);
        }
        
        const errorMessage = response.statusText || 
          `HTTP ${response.status} - This could be due to network issues, server unavailability, or API rate limits`;
        console.warn(`Hugging Face API error: ${errorMessage}. Using fallback questions.`);
        return this.getFallbackQuestion(context.type, context.resumeData);
      }

      const data = await response.json();
      
      // Handle different response formats
      let generatedText = '';
      if (Array.isArray(data) && data[0]?.generated_text) {
        generatedText = data[0].generated_text;
      } else if (data.generated_text) {
        generatedText = data.generated_text;
      }

      // Extract the question from the generated text
      const question = this.extractQuestion(generatedText, prompt);
      return question || this.getFallbackQuestion(context.type, context.resumeData);
    } catch (error) {
      console.error('Error generating question:', error);
      return this.getFallbackQuestion(context.type, context.resumeData);
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
    // Use a simpler approach for feedback since we're using free models
    const score = this.calculateBasicScore(context.userResponse);
    const feedback = this.generateBasicFeedback(context.userResponse, context.type);
    const suggestions = this.generateSuggestions(context.userResponse, context.type);

    return { score, feedback, suggestions };
  }

  private buildPrompt(context: any): string {
    const roleContext = this.getRoleContext(context.type);
    const difficultyContext = this.getDifficultyContext(context.difficulty);
    
    let prompt = `You are a professional interviewer conducting a ${context.type} interview. ${roleContext} ${difficultyContext}`;
    
    // Add conversation history for context
    if (context.previousMessages.length > 0) {
      const lastMessages = context.previousMessages.slice(-4); // Keep last 4 messages
      prompt += '\n\nConversation so far:\n';
      lastMessages.forEach(msg => {
        const role = msg.role === 'assistant' ? 'Interviewer' : 'Candidate';
        prompt += `${role}: ${msg.content}\n`;
      });
    }

    // Add resume context if available - ENHANCED FOR RESUME-BASED QUESTIONS
    if (context.resumeData) {
      prompt += `\n\nCandidate's Resume Information:`;
      prompt += `\nName: ${context.resumeData.name || 'Not provided'}`;
      prompt += `\nSummary: ${context.resumeData.summary || 'Not provided'}`;
      
      if (context.resumeData.skills?.length > 0) {
        prompt += `\nSkills: ${context.resumeData.skills.join(', ')}`;
      }
      
      if (context.resumeData.experience?.length > 0) {
        prompt += `\nExperience:`;
        context.resumeData.experience.forEach((exp: any, index: number) => {
          prompt += `\n${index + 1}. ${exp.position} at ${exp.company} (${exp.duration})`;
          if (exp.description?.length > 0) {
            prompt += ` - ${exp.description.join(', ')}`;
          }
        });
      }
      
      if (context.resumeData.education?.length > 0) {
        prompt += `\nEducation:`;
        context.resumeData.education.forEach((edu: any, index: number) => {
          prompt += `\n${index + 1}. ${edu.degree} from ${edu.institution} (${edu.year})`;
        });
      }
      
      prompt += `\n\nBased on this resume, ask specific questions about their experience, skills, or projects mentioned.`;
    }

    prompt += '\n\nInterviewer: ';
    return prompt;
  }

  private getRoleContext(type: string): string {
    switch (type) {
      case 'hr':
        return 'Ask questions about background, motivation, cultural fit, and work experience.';
      case 'technical':
        return 'Ask technical questions relevant to the role, including problem-solving scenarios.';
      case 'behavioral':
        return 'Ask behavioral questions using the STAR method about past experiences.';
      default:
        return 'Ask professional interview questions.';
    }
  }

  private getDifficultyContext(difficulty: string): string {
    switch (difficulty) {
      case 'fresher':
        return 'Keep questions suitable for entry-level candidates with 0-2 years experience.';
      case 'mid':
        return 'Ask intermediate-level questions for candidates with 2-5 years experience.';
      case 'senior':
        return 'Ask advanced questions suitable for senior professionals with 5+ years experience.';
      default:
        return 'Ask appropriate questions for the candidate level.';
    }
  }

  private extractQuestion(generatedText: string, originalPrompt: string): string {
    // Remove the original prompt from the generated text
    let question = generatedText.replace(originalPrompt, '').trim();
    
    // Clean up the response
    question = question.split('\n')[0]; // Take first line
    question = question.replace(/^(Interviewer:|Assistant:|AI:)/i, '').trim();
    
    // Ensure it ends with a question mark
    if (question && !question.endsWith('?')) {
      question += '?';
    }

    // Validate the question
    if (question.length < 10 || question.length > 200) {
      return '';
    }

    return question;
  }

  private calculateBasicScore(response: string): number {
    let score = 50; // Base score
    
    // Length check
    if (response.length > 100) score += 10;
    if (response.length > 200) score += 10;
    
    // Keyword analysis for different aspects
    const positiveWords = ['experience', 'skilled', 'accomplished', 'successful', 'managed', 'led', 'developed', 'improved'];
    const structureWords = ['first', 'then', 'finally', 'because', 'therefore', 'however', 'additionally'];
    
    positiveWords.forEach(word => {
      if (response.toLowerCase().includes(word)) score += 3;
    });
    
    structureWords.forEach(word => {
      if (response.toLowerCase().includes(word)) score += 2;
    });
    
    // Penalize very short responses
    if (response.length < 50) score -= 20;
    
    return Math.min(Math.max(score, 0), 100);
  }

  private generateBasicFeedback(response: string, type: string): string {
    const score = this.calculateBasicScore(response);
    
    if (score >= 80) {
      return "Excellent response! You provided detailed information and demonstrated good communication skills.";
    } else if (score >= 60) {
      return "Good response! Consider adding more specific examples to strengthen your answer.";
    } else {
      return "Your response could be improved. Try to provide more detailed examples and elaborate on your points.";
    }
  }

  private generateSuggestions(response: string, type: string): string[] {
    const suggestions = [];
    
    if (response.length < 100) {
      suggestions.push("Provide more detailed responses with specific examples");
    }
    
    if (type === 'behavioral' && !response.toLowerCase().includes('situation')) {
      suggestions.push("Use the STAR method: Situation, Task, Action, Result");
    }
    
    if (type === 'technical' && response.length < 150) {
      suggestions.push("Explain your technical approach in more detail");
    }
    
    if (!response.includes('experience') && !response.includes('project')) {
      suggestions.push("Include relevant experience or project examples");
    }
    
    suggestions.push("Practice speaking clearly and confidently");
    
    return suggestions.slice(0, 3); // Return max 3 suggestions
  }

  private getFallbackQuestion(type: string, resumeData?: any): string {
    // Enhanced fallback questions that can use resume data
    const fallbacks = {
      hr: [
        "Tell me about yourself and what interests you about this role?",
        "What are your greatest strengths and how do they apply to this position?",
        "Where do you see yourself in five years?",
        "Why are you looking to leave your current position?",
        "What motivates you in your work?",
        "How do you handle stress and pressure?",
        "What's your ideal work environment?",
        "Tell me about a time you overcame a challenge."
      ],
      technical: [
        "Can you walk me through your approach to solving complex technical problems?",
        "Describe a challenging technical project you've worked on recently.",
        "How do you stay updated with the latest technology trends?",
        "Explain a time when you had to debug a difficult issue.",
        "What's your experience with version control systems?",
        "How do you ensure code quality in your projects?",
        "Describe your experience with testing methodologies.",
        "What's your approach to learning new technologies?"
      ],
      behavioral: [
        "Describe a challenging situation you faced at work and how you handled it?",
        "Tell me about a time when you had to work with a difficult team member.",
        "Give me an example of when you had to meet a tight deadline.",
        "Describe a situation where you had to learn something new quickly.",
        "Tell me about a time when you made a mistake and how you handled it.",
        "Describe a time when you had to lead a team or project.",
        "Tell me about a time when you disagreed with your manager.",
        "Give me an example of when you went above and beyond."
      ]
    };
    
    const questions = fallbacks[type as keyof typeof fallbacks] || fallbacks.hr;
    let selectedQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    // If resume data is available, try to make the question more specific
    if (resumeData && Math.random() > 0.5) { // 50% chance to use resume-based question
      selectedQuestion = this.generateResumeBasedQuestion(type, resumeData, selectedQuestion);
    }
    
    return selectedQuestion;
  }

  private generateResumeBasedQuestion(type: string, resumeData: any, fallbackQuestion: string): string {
    try {
      // Generate questions based on resume data
      if (resumeData.experience?.length > 0) {
        const experience = resumeData.experience[0]; // Use most recent experience
        
        switch (type) {
          case 'hr':
            return `I see you worked as ${experience.position} at ${experience.company}. What drew you to that role and what did you enjoy most about it?`;
          case 'technical':
            return `Tell me about a technical challenge you faced in your role as ${experience.position} at ${experience.company}. How did you approach it?`;
          case 'behavioral':
            return `Can you describe a specific project or achievement from your time as ${experience.position} at ${experience.company} using the STAR method?`;
        }
      }
      
      if (resumeData.skills?.length > 0) {
        const randomSkill = resumeData.skills[Math.floor(Math.random() * resumeData.skills.length)];
        
        switch (type) {
          case 'hr':
            return `I notice you have experience with ${randomSkill}. How did you develop this skill and how has it helped you in your career?`;
          case 'technical':
            return `Can you walk me through a project where you used ${randomSkill}? What challenges did you face and how did you overcome them?`;
          case 'behavioral':
            return `Tell me about a time when your expertise in ${randomSkill} helped solve a problem or improve a process.`;
        }
      }
      
      if (resumeData.education?.length > 0) {
        const education = resumeData.education[0];
        return `I see you studied ${education.degree} at ${education.institution}. How has your educational background prepared you for this role?`;
      }
      
      if (resumeData.name) {
        return `Thank you for sharing your resume, ${resumeData.name}. ${fallbackQuestion}`;
      }
    } catch (error) {
      console.error('Error generating resume-based question:', error);
    }
    
    return fallbackQuestion;
  }
}