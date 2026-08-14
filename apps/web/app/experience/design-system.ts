export const EV_TOKENS = {
  typography: {
    sans: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", monospace',
  },
  spacing: [4, 8, 12, 16, 20, 24, 32, 40, 48, 64],
  radii: { xs: 6, sm: 8, md: 10, lg: 14, xl: 18, pill: 999 },
  motion: { fast: 120, base: 180, slow: 260 },
} as const;

export const EV_SEMANTIC_TONES = ["critical", "warning", "success", "info", "brand", "neutral"] as const;
export type EVSemanticTone = (typeof EV_SEMANTIC_TONES)[number];

export const EV_SURFACES = ["base", "subtle", "default", "raised", "interactive"] as const;
export type EVSurface = (typeof EV_SURFACES)[number];
