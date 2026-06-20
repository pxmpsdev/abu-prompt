export type RubricRating = {
  label: string;
  score: number;
  rating: string;
};

export type PromptVariant = {
  id: string;
  name: string;
  technique: string;
  isWinner: boolean;
  baselineDelta: number;
  rating: string;
  prompt: string;
  score: number;
  rubric: {
    empathy: RubricRating;
    solutionOrientation: RubricRating;
    conciseness: RubricRating;
    complaintResolution: RubricRating;
  };
  strengths: string[];
  weaknesses: string[];
  matchingWords: string[];
  unhelpfulWords: string[];
  reason: string;
  shareLabel: string;
};

export type PromptImprovementResult = {
  inputPrompt: string;
  complaints: string[];
  bestVariantId: string;
  variants: PromptVariant[];
  overallAdvice: string;
};

export type PromptImprover = {
  improve(prompt: string): Promise<PromptImprovementResult>;
};
