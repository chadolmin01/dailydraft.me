// Simple store for validation results that can be used across components

export interface ValidationResult {
  id: string;
  timestamp: number;
  projectIdea: string;
  conversationHistory: string;
  reflectedAdvice: string[];
  artifacts?: {
    prd?: string;
    jd?: string;
  };
}

const STORAGE_KEY = 'draft_validation_results';

export const validationResultsStore = {
  getAll: (): ValidationResult[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  save: (result: Omit<ValidationResult, 'id' | 'timestamp'>): ValidationResult => {
    const newResult: ValidationResult = {
      ...result,
      id: `val_${Date.now()}`,
      timestamp: Date.now(),
    };

    const existing = validationResultsStore.getAll();
    const updated = [newResult, ...existing].slice(0, 10); // Keep last 10

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }

    return newResult;
  },

  getById: (id: string): ValidationResult | undefined => {
    return validationResultsStore.getAll().find(r => r.id === id);
  },

  getLatest: (): ValidationResult | undefined => {
    const all = validationResultsStore.getAll();
    return all[0];
  },

  updateArtifacts: (id: string, artifacts: { prd?: string; jd?: string }) => {
    const all = validationResultsStore.getAll();
    const updated = all.map(r =>
      r.id === id ? { ...r, artifacts } : r
    );
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  },

  delete: (id: string) => {
    const all = validationResultsStore.getAll();
    const filtered = all.filter(r => r.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  },

  clear: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
};
