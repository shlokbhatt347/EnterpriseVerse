export const PHASE_3_COMPLETION_CONTRACT = Object.freeze({
  world: ['macro', 'industry', 'market', 'customers', 'suppliers', 'workforce', 'capital', 'regulation', 'events'],
  business: ['production', 'capacity', 'pricing', 'inventory', 'finance', 'investment', 'valuation'],
  behavior: ['segmentation', 'elasticity', 'customer-memory', 'churn', 'supplier-relationships', 'competitor-strategy', 'investor-response'],
  emergence: ['feedback-loops', 'event-propagation', 'crisis-propagation', 'strategy-diversity', 'long-run-stability'],
  engineering: ['determinism', 'explainability', 'observability', 'bounds', 'replay', 'backward-compatibility'],
  qa: ['unit', 'integration', 'property', 'monte-carlo', 'long-run', 'adversarial', 'ci-green'],
} as const);
