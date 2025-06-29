// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist';
import type { ResumeData } from '../types';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.269/pdf.worker.min.js`;

export class PDFService {
  async parseResume(file: File): Promise<ResumeData> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + ' ';
      }

      return this.extractResumeData(fullText);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse resume PDF');
    }
  }

  private extractResumeData(text: string): ResumeData {
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    return {
      name: this.extractName(cleanText),
      email: this.extractEmail(cleanText),
      skills: this.extractSkills(cleanText),
      experience: this.extractExperience(cleanText),
      education: this.extractEducation(cleanText),
      summary: this.extractSummary(cleanText)
    };
  }

  private extractName(text: string): string {
    // Look for name patterns at the beginning of the resume
    const namePatterns = [
      /^([A-Z][a-z]+ [A-Z][a-z]+)/,
      /Name[:\s]+([A-Z][a-z]+ [A-Z][a-z]+)/i,
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return 'Name not found';
  }

  private extractEmail(text: string): string {
    const emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/;
    const match = text.match(emailPattern);
    return match ? match[0] : 'Email not found';
  }

  private extractSkills(text: string): string[] {
    const skillsSection = this.extractSection(text, ['skills', 'technical skills', 'core competencies']);
    if (!skillsSection) return [];

    const commonSkills = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'TypeScript',
      'HTML', 'CSS', 'SQL', 'Git', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL',
      'Angular', 'Vue', 'Express', 'Django', 'Flask', 'Spring', 'REST API',
      'GraphQL', 'Redux', 'Webpack', 'Babel', 'Jest', 'Cypress', 'Jenkins',
      'Kubernetes', 'Redis', 'Elasticsearch', 'Firebase', 'Next.js', 'Tailwind'
    ];

    const foundSkills: string[] = [];
    const lowerText = skillsSection.toLowerCase();

    commonSkills.forEach(skill => {
      if (lowerText.includes(skill.toLowerCase())) {
        foundSkills.push(skill);
      }
    });

    return foundSkills;
  }

  private extractExperience(text: string): any[] {
    const experienceSection = this.extractSection(text, ['experience', 'work experience', 'employment']);
    if (!experienceSection) return [];

    // This is a simplified extraction - in production, you'd use more sophisticated parsing
    const experiences = [];
    const companies = text.match(/(?:at\s+)?([A-Z][a-zA-Z\s&\.]+(?:Ltd|Inc|Corp|Company|Solutions|Technologies|Systems))/g);
    
    if (companies) {
      experiences.push({
        company: companies[0],
        position: 'Software Developer', // Simplified
        duration: '2021 - Present',
        description: ['Developed web applications', 'Collaborated with team members']
      });
    }

    return experiences;
  }

  private extractEducation(text: string): any[] {
    const educationSection = this.extractSection(text, ['education', 'academic background']);
    if (!educationSection) return [];

    const education = [];
    const degrees = text.match(/(Bachelor|Master|PhD|B\.Tech|M\.Tech|BCA|MCA|B\.Sc|M\.Sc)[\s\w]*/gi);
    
    if (degrees) {
      education.push({
        degree: degrees[0],
        institution: 'University Name',
        year: '2020'
      });
    }

    return education;
  }

  private extractSummary(text: string): string {
    const summarySection = this.extractSection(text, ['summary', 'objective', 'profile']);
    if (summarySection) {
      return summarySection.slice(0, 300) + '...';
    }

    // Generate summary from first few lines
    return text.slice(0, 200) + '...';
  }

  private extractSection(text: string, sectionNames: string[]): string | null {
    for (const sectionName of sectionNames) {
      const regex = new RegExp(`${sectionName}[:\s]*([^]*?)(?=\\n[A-Z][A-Z\\s]+:|$)`, 'i');
      const match = text.match(regex);
      if (match) {
        return match[1].trim();
      }
    }
    return null;
  }
}