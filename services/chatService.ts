import { ChatMessage, StarterIntent } from '@/types/chat';
import { PersonalityTone } from '@/types/user';
import { storageService } from './storageService';

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'welcome-msg-1',
    sessionId: 'default-session',
    role: 'assistant',
    content: "Hey, sunshine! ☀️ I'm really glad you're here. What's on your mind today?",
    createdAt: new Date().toISOString(),
    deliveryStatus: 'sent',
    isDemoResponse: true,
  },
];

export const chatService = {
  async getMessages(sessionId: string = 'default-session'): Promise<ChatMessage[]> {
    const key = `${storageService.KEYS.CHAT_MESSAGES}_${sessionId}`;
    return await storageService.getItem<ChatMessage[]>(key, INITIAL_MESSAGES);
  },

  async saveMessages(sessionId: string, messages: ChatMessage[]): Promise<void> {
    const key = `${storageService.KEYS.CHAT_MESSAGES}_${sessionId}`;
    await storageService.setItem(key, messages);
  },

  async clearMessages(sessionId: string = 'default-session'): Promise<void> {
    const key = `${storageService.KEYS.CHAT_MESSAGES}_${sessionId}`;
    await storageService.setItem(key, INITIAL_MESSAGES);
  },

  getStarterGreeting(intent: StarterIntent, tone: PersonalityTone = 'adaptive'): string {
    switch (intent) {
      case 'listen':
        return "I'm right here with you. Take all the time you need—what's been weighing on your heart or mind?";
      case 'laugh':
        return "Tiny adventure time! 😄 Would you like a silly question, a bizarre fun fact, or just a little playful distraction?";
      case 'encourage':
        return "Hey, take a slow breath with me. 💛 You don't have to carry the whole mountain today. What feels heavy right now?";
      case 'anything':
      default:
        return "Anything goes! A random thought, something cool you saw today, or just daydreaming—what are you thinking about?";
    }
  },

  async generateDemoResponse(
    userMessage: string,
    tone: PersonalityTone = 'adaptive',
    _sessionId: string = 'default-session'
  ): Promise<string> {
    // Realistic simulation delay for thoughtful AI generation
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const lower = userMessage.toLowerCase().trim();

    // Check for crisis/distress keywords first for emotional safety
    if (
      lower.includes('hurt myself') ||
      lower.includes('end it all') ||
      lower.includes('suicide') ||
      lower.includes('want to die')
    ) {
      return (
        "I hear how much pain you're feeling right now, and I care deeply about your safety. 💛\n\n" +
        "Because I'm an AI companion, I can't provide crisis support or replace human care. Please reach out to someone who can help right now:\n\n" +
        "• Suicide & Crisis Lifeline: Call or text 988 (US & Canada, free & confidential 24/7)\n" +
        "• Crisis Text Line: Text HOME to 741741\n" +
        "• International resources: findahelpline.com\n\n" +
        "You don't have to carry this alone. Please connect with people who can support you."
      );
    }

    if (lower.includes('bad day') || lower.includes('rough day') || lower.includes('sad') || lower.includes('tired')) {
      if (tone === 'gentle') {
        return "Oh, sunshine. 💛 I'm really sorry today was so rough. No need to put on a brave face here. Do you want to vent about what happened, or would you prefer a soft distraction for a little bit?";
      }
      if (tone === 'playful') {
        return "Oof, sounds like today was not on its best behavior. 🫂 I'm sending you the warmest digital blanket. Want me to tell you the world's most ridiculous animal fact to help take the edge off?";
      }
      if (tone === 'calm') {
        return "Take a deep breath and let your shoulders drop. 🌙 Today asked a lot of you. You don't have to fix anything right this second. I'm right here listening whenever you're ready.";
      }
      return "Oh, sunshine. 💛 I'm sorry today was so rough. Want to tell me what happened, or would you rather take your mind off it for a little while?";
    }

    if (lower.includes('finished') || lower.includes('did it') || lower.includes('happy') || lower.includes('proud') || lower.includes('won')) {
      if (tone === 'playful') {
        return "YESSS! 🎉 Throwing confetti for you right now! That is genuinely awesome. How are you going to celebrate this win?";
      }
      if (tone === 'calm') {
        return "That is wonderful news. 💛 Take a moment to genuinely soak that in. You put in the effort, and you saw it through. How does it feel to look back on it now?";
      }
      return "Yesss! ☀️ That's such a satisfying feeling. How are you feeling now that it's finally done?";
    }

    if (lower.includes('bored')) {
      if (tone === 'playful') {
        return "Okay, tiny adventure time. 😄 If you could instantly become a world-renowned master at any ridiculous, useless skill, what would you choose?";
      }
      return "Boredom is just your brain asking for a little spark! 🌟 Want a curious riddle, a weird fun fact about the solar system, or a creative prompt?";
    }

    if (lower.includes('anxious') || lower.includes('nervous') || lower.includes('stress') || lower.includes('worried')) {
      return "I hear you. Anxiety can feel so loud and physical. Let's ground for five seconds: unclench your jaw, soften your shoulders, and exhale slowly. 💛 What is the one smallest thing within your control right now?";
    }

    if (lower.includes('who are you') || lower.includes('what are you')) {
      return "I'm Sunny! ☀️ Your personal AI companion and little corner of sunshine. I'm here to listen, share everyday laughs, offer gentle encouragement, and help you reflect—at whatever pace feels good to you.";
    }

    // Default responses based on tone
    switch (tone) {
      case 'playful':
        return `I love hearing what's on your mind! 😄 "${userMessage.length > 40 ? userMessage.slice(0, 40) + '...' : userMessage}"—tell me more, I'm all ears!`;
      case 'gentle':
        return `Thank you for sharing that with me. 💛 It's really nice just talking through things together. How has that been feeling for you lately?`;
      case 'calm':
        return `Thank you for taking a moment to reflect on that. There is plenty of space here to explore it. What comes to mind next as you think about it?`;
      case 'adaptive':
      default:
        return `I appreciate you telling me that. ☀️ You always have a warm, nonjudgmental space right here. Tell me a bit more about what you're thinking!`;
    }
  },
};
