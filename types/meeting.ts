export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface MeetingAnalysis {
  summary: string;
  actionItems: string[];
  keyPoints: string[];
}