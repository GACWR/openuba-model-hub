import { notFound } from "next/navigation";
import { getAllModels, getModelBySlug } from "@/lib/models";
import { ModelDetailClient } from "./client";
import fs from "fs";
import path from "path";

export function generateStaticParams() {
  return getAllModels().map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) return {};
  return {
    title: `${model.name} — OpenUBA Model Hub`,
    description: model.description,
  };
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = getModelBySlug(slug);
  if (!model) notFound();

  const modelDir = path.join(process.cwd(), model.path);
  let modelPy = "";
  let modelYaml = "";

  try {
    modelPy = fs.readFileSync(path.join(modelDir, "MODEL.py"), "utf-8");
  } catch {
    modelPy = "# Source not available";
  }
  try {
    modelYaml = fs.readFileSync(path.join(modelDir, "model.yaml"), "utf-8");
  } catch {
    modelYaml = "# Source not available";
  }

  return (
    <ModelDetailClient model={model} modelPy={modelPy} modelYaml={modelYaml} />
  );
}
