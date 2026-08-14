import type { ReactNode } from "react";
import type { ExperienceArea, ExperienceSurface } from "./architecture";

export type ShellMode = "explore" | "decide" | "reflect";

export type ShellContext = {
  area?: ExperienceArea;
  surface?: ExperienceSurface;
  mode?: ShellMode;
  title?: string;
  description?: string;
};

export type AttentionItem = {
  id: string;
  priority: "critical" | "important" | "signal" | "background";
  title: string;
  description?: string;
  href?: string;
};

export type InspectorState = {
  open: boolean;
  title?: string;
  subtitle?: string;
  content?: ReactNode;
};

export type ExperienceShellProps = {
  children: ReactNode;
  context?: ShellContext;
  attention?: AttentionItem[];
  inspector?: InspectorState;
};
