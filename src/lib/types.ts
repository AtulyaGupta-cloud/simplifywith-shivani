export interface Feedback {
  score: number;
  maxScore: number;
  coveredPoints: string[];
  missingPoints: string[];
  improvementSuggestions: string[];
  modelAnswer: string;
  examinerTip: string;
}

export type Screen = 'landing' | 'input' | 'feedback';
