import registry from "@/registry/models.json";

export interface ModelParameter {
  name: string;
  type: string;
  default: number | string | boolean;
  description: string;
  enum?: string[];
}

export interface ModelEntry {
  name: string;
  slug: string;
  version: string;
  runtime: string;
  framework: string;
  description: string;
  author: string;
  license: string;
  tags: string[];
  parameters: ModelParameter[];
  path: string;
}

export interface ModelRegistry {
  version: string;
  updated: string;
  models: ModelEntry[];
}

export function getRegistry(): ModelRegistry {
  return registry as ModelRegistry;
}

export function getAllModels(): ModelEntry[] {
  return getRegistry().models;
}

export function getModelBySlug(slug: string): ModelEntry | undefined {
  return getAllModels().find((m) => m.slug === slug);
}

export function getFrameworks(): string[] {
  const frameworks = new Set(getAllModels().map((m) => m.framework));
  return Array.from(frameworks).sort();
}

export function getAllTags(): string[] {
  const tags = new Set(getAllModels().flatMap((m) => m.tags));
  return Array.from(tags).sort();
}
