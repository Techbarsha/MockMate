import React from 'react';
import {
  ArrowLeft,
  Bot,
  Heart,
  Shield,
  Zap,
  Users,
  Code,
  Globe,
  CheckCircle,
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Footer from '../Common/Footer';

interface AboutPageProps {
  onBack: () => void;
}

export default function AboutPage({ onBack }: AboutPageProps) {
  const values = [
    {
      icon: Shield,
      title: 'Privacy First',
      description: 'Your data stays on your device. We believe privacy is a fundamental right, not a premium feature.',
    },
    {
      icon: Zap,
      title: 'Always Free',
      description: 'No subscriptions, no API costs, no hidden fees. Quality interview practice should be accessible to everyone.',
    },
    {
      icon: Code,
      title: 'Open Source',
      description: 'Transparent, community-driven development. See exactly how MockMate works and contribute to its growth.',
    },
    {
      icon: Globe,
      title: 'Accessible',
      description: 'Built for everyone, everywhere. No barriers, no restrictions, just pure interview practice.',
    },
  ];

  const team = [
    {
      name: 'Barsha Saha',
      role: 'Founder & Lead Developer',
      bio: 'Passionate about new tech stacks and solving real-world problems.',
      avatar: '👩‍💻',
      github: 'https://github.com/Techbarsha',
      linkedin: 'https://linkedin.com/in/barsha-saha',
    },
  ];

  const milestones = [
    {
      year: '2025-06-03',
      title: 'Idea Born',
      description: 'The concept for MockMate was conceived — a free, open-source AI interview coach to help people prepare anytime, anywhere.',
    },
    {
      year: '2025-06-06',
      title: 'Development Kickoff',
      description: 'Started full-stack development with a focus on AI logic, UX design, and accessibility from day one.',
    },
    {
      year: '2025-06-29',
      title: 'Project Complete',
      description: 'Core functionalities were finalized including question generator, real-time feedback, and privacy-preserving AI features.',
    },
    {
      year: '2025-06-30',
      title: 'Official Launch',
      description: 'MockMate officially launched to the public — free, open-source, and ready to help the world ace interviews.',
    },
  ];

  const techStack = ['React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Lucide Icons', 'OpenAI API'];

  const futurePlans = [
    'Voice-based Interviews: Practice speaking answers with feedback',
    'Mobile App: Seamless prep on the go',
    'Community Challenges: Compete in weekly interview battles',
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Home
            </button>

            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center mr-3">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  MockMate
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">About Us</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-800 dark:to-gray-900 py-20 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-8">
            <Bot className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">About MockMate</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            We're on a mission to democratize interview preparation by making high-quality,
            AI-powered coaching accessible to everyone — completely free.
          </p>
          <div className="inline-flex items-center px-6 py-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-lg font-medium">
            <Heart className="w-5 h-5 mr-2 text-red-500" />
            Made with love for the community
          </div>
        </motion.div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-white dark:bg-gray-900 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16 px-4 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Our Mission</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            Everyone deserves access to quality interview preparation. Traditional coaching can be expensive and exclusive. 
            MockMate is breaking these barriers with AI-driven coaching — private, open, and completely free.
          </p>
        </motion.div>

        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 mx-auto max-w-4xl border border-primary-200 dark:border-gray-600 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { title: 'Accessibility', desc: 'Quality interview prep shouldn\'t be a luxury.' },
              { title: 'Privacy', desc: 'Your practice data remains fully private.' },
              { title: 'Innovation', desc: 'AI makes prep more personalized and efficient.' },
              { title: 'Community', desc: 'Open source enables global collaboration.' },
            ].map((item, i) => (
              <div key={i} className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-500 mr-3 mt-1" />
                <div>
                  <h4 className="font-semibold text-primary-900 dark:text-primary-300">{item.title}</h4>
                  <p className="text-primary-800 dark:text-primary-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Our Values</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">The principles that guide everything we do</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-lg text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">{value.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section - Centered */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Meet Our Team</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12">Driven individuals making MockMate possible</p>
          
          {/* Centered single team member */}
          <div className="flex justify-center">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-gray-700 p-8 rounded-xl shadow-lg text-center border border-gray-200 dark:border-gray-600 max-w-sm"
              >
                <div className="text-6xl mb-4">{member.avatar}</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{member.name}</h3>
                <p className="text-primary-600 dark:text-primary-400 font-medium mb-4">{member.role}</p>
                <p className="text-gray-600 dark:text-gray-300">{member.bio}</p>
                <div className="flex justify-center space-x-4 mt-4">
                  {member.github && (
                    <a href={member.github} target="_blank" rel="noopener noreferrer">
                      <Github className="w-5 h-5 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white" />
                    </a>
                  )}
                  {member.linkedin && (
                    <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-5 h-5 text-blue-600 hover:text-blue-800" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Our Journey</h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-10">Milestones that shaped MockMate</p>
          <div className="space-y-8 text-left">
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start"
              >
                <div className="flex-shrink-0 w-24 text-right mr-8">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{m.year}</span>
                </div>
                <div className="flex-shrink-0 w-4 h-4 bg-primary-500 rounded-full mt-2 mr-8"></div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{m.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300">{m.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-4xl font-bold mb-6">Join Our Community</h2>
            <p className="text-xl text-blue-100 mb-8">Help make interview prep free and fair for all</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8">
              <a
                href="https://github.com/mockmate/mockmate"
                className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold flex items-center shadow-lg hover:shadow-xl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-5 h-5 mr-2" />
                Contribute on GitHub
              </a>
              <a
                href="https://twitter.com/mockmate"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="w-5 h-5 mr-2" />
                Follow Updates
              </a>
            </div>
            <p className="text-blue-100">Together, we're making interview success universal.</p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}