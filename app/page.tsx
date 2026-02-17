import { Hero } from "@/components/hero";
import { FeaturesSection } from "@/components/features-section";
import { DashboardPreview } from "@/components/dashboard-preview";
import { OpenModelSection } from "@/components/open-model-section";
import { ModelShowcase } from "@/components/model-showcase";
import { ArchitectureSection } from "@/components/architecture-section";
import { ResourcesSection } from "@/components/resources-section";
import { CTASection } from "@/components/cta-section";

export default function Home() {
  return (
    <main>
      <Hero />
      <FeaturesSection />
      <DashboardPreview />
      <OpenModelSection />
      <ModelShowcase />
      <ArchitectureSection />
      <ResourcesSection />
      <CTASection />
    </main>
  );
}
