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
    console.log('Generating interview question with context:', {
      type: context.type,
      difficulty: context.difficulty,
      messageCount: context.previousMessages.length,
      hasResume: !!context.resumeData
    });

    // Always use fallback questions for reliability
    return this.getFallbackQuestion(context.type, context.resumeData, context.previousMessages.length);
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
    console.log('Providing feedback for response:', context.userResponse.substring(0, 50) + '...');
    
    // Use a simpler approach for feedback since we're using free models
    const score = this.calculateBasicScore(context.userResponse);
    const feedback = this.generateBasicFeedback(context.userResponse, context.type);
    const suggestions = this.generateSuggestions(context.userResponse, context.type);

    return { score, feedback, suggestions };
  }

  private calculateBasicScore(response: string): number {
    let score = 50; // Base score
    
    // Length check
    if (response.length > 100) score += 10;
    if (response.length > 200) score += 10;
    if (response.length > 300) score += 5;
    
    // Keyword analysis for different aspects
    const positiveWords = ['experience', 'skilled', 'accomplished', 'successful', 'managed', 'led', 'developed', 'improved', 'achieved', 'responsible'];
    const structureWords = ['first', 'then', 'finally', 'because', 'therefore', 'however', 'additionally', 'furthermore', 'moreover'];
    const professionalWords = ['team', 'project', 'client', 'customer', 'solution', 'challenge', 'goal', 'result'];
    
    positiveWords.forEach(word => {
      if (response.toLowerCase().includes(word)) score += 3;
    });
    
    structureWords.forEach(word => {
      if (response.toLowerCase().includes(word)) score += 2;
    });

    professionalWords.forEach(word => {
      if (response.toLowerCase().includes(word)) score += 2;
    });
    
    // Penalize very short responses
    if (response.length < 50) score -= 20;
    if (response.length < 20) score -= 30;
    
    // Bonus for detailed responses
    if (response.length > 400) score += 5;
    
    return Math.min(Math.max(score, 0), 100);
  }

  private generateBasicFeedback(response: string, type: string): string {
    const score = this.calculateBasicScore(response);
    
    if (score >= 85) {
      return "Excellent response! You provided detailed information, used professional language, and demonstrated strong communication skills. Your answer shows good structure and relevant examples.";
    } else if (score >= 70) {
      return "Good response! You covered the key points well. Consider adding more specific examples and elaborating on your achievements to make your answer even stronger.";
    } else if (score >= 55) {
      return "Decent response, but there's room for improvement. Try to provide more detailed examples and structure your answer more clearly. Focus on specific achievements and outcomes.";
    } else {
      return "Your response could be significantly improved. Try to provide more detailed examples, use professional language, and elaborate on your points. Practice the STAR method for behavioral questions.";
    }
  }

  private generateSuggestions(response: string, type: string): string[] {
    const suggestions = [];
    
    if (response.length < 100) {
      suggestions.push("Provide more detailed responses with specific examples");
    }
    
    if (type === 'behavioral' && !response.toLowerCase().includes('situation') && !response.toLowerCase().includes('example')) {
      suggestions.push("Use the STAR method: Situation, Task, Action, Result");
    }
    
    if (type === 'technical' && response.length < 150) {
      suggestions.push("Explain your technical approach in more detail");
    }
    
    if (!response.includes('experience') && !response.includes('project') && !response.includes('work')) {
      suggestions.push("Include relevant experience or project examples");
    }

    if (response.length < 200) {
      suggestions.push("Elaborate more on your achievements and outcomes");
    }

    if (type === 'hr' && !response.toLowerCase().includes('team') && !response.toLowerCase().includes('collaborate')) {
      suggestions.push("Mention teamwork and collaboration skills");
    }
    
    suggestions.push("Practice speaking clearly and confidently");
    suggestions.push("Use specific metrics and results when possible");
    
    return suggestions.slice(0, 3); // Return max 3 suggestions
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
    
    // Use question index to cycle through questions, with some randomization
    const baseIndex = questionIndex % questions.length;
    const randomOffset = Math.floor(Math.random() * 3); // Add some randomness
    const selectedIndex = (baseIndex + randomOffset) % questions.length;
    
    let selectedQuestion = questions[selectedIndex];
    
    // If resume data is available, try to make the question more specific
    if (resumeData && Math.random() > 0.3) { // 70% chance to use resume-based question
      selectedQuestion = this.generateResumeBasedQuestion(type, resumeData, selectedQuestion, questionIndex);
    }
    
    console.log('Selected fallback question:', selectedQuestion);
    return selectedQuestion;
  }

  private generateResumeBasedQuestion(type: string, resumeData: any, fallbackQuestion: string, questionIndex: number): string {
    try {
      // Generate questions based on resume data
      if (resumeData.experience?.length > 0) {
        const experience = resumeData.experience[0]; // Use most recent experience
        
        switch (type) {
          case 'hr':
            if (questionIndex === 0) {
              return `I see you worked as ${experience.position} at ${experience.company}. Can you tell me about yourself and what drew you to that role?`;
            } else if (questionIndex === 1) {
              return `What did you enjoy most about your role as ${experience.position} at ${experience.company}?`;
            } else {
              return `How has your experience as ${experience.position} at ${experience.company} prepared you for this role?`;
            }
          case 'technical':
            if (questionIndex === 0) {
              return `Tell me about a technical challenge you faced in your role as ${experience.position} at ${experience.company}. How did you approach it?`;
            } else {
              return `What technologies did you work with as ${experience.position} at ${experience.company}, and how did you apply them?`;
            }
          case 'behavioral':
            if (questionIndex === 0) {
              return `Can you describe a specific project or achievement from your time as ${experience.position} at ${experience.company} using the STAR method?`;
            } else {
              return `Tell me about a challenging situation you faced as ${experience.position} at ${experience.company} and how you resolved it.`;
            }
        }
      }
      
      if (resumeData.skills?.length > 0 && questionIndex > 0) {
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
      
      if (resumeData.education?.length > 0 && questionIndex === 1) {
        const education = resumeData.education[0];
        return `I see you studied ${education.degree} at ${education.institution}. How has your educational background prepared you for this role?`;
      }
      
      if (resumeData.name && questionIndex === 0) {
        return `Thank you for sharing your resume, ${resumeData.name}. ${fallbackQuestion}`;
      }
    } catch (error) {
      console.error('Error generating resume-based question:', error);
    }
    
    return fallbackQuestion;
  }
}