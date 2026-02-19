"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Github, PlusCircle, Compass, FileText, Mail } from "lucide-react";
import Link from "next/link";
import { trackCtaClick } from "@/lib/analytics";
import { useTrackSectionView } from "@/hooks/use-track-section-view";

export function CTASection() {
  const sectionRef = useTrackSectionView("cta");
  return (
    <section ref={sectionRef} className="py-24 px-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-600/3 to-transparent -z-10" />
      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Join the Community
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            OpenUBA is fully open source. Contribute your own detection models,
            improve existing ones, or build integrations. Every PR makes the
            security community stronger.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="https://forms.gle/pjNXQid5caBZbMMfA"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCtaClick("Sign Up for Updates", "https://forms.gle/pjNXQid5caBZbMMfA")}
            >
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold gap-2.5 px-6 h-11">
                <Mail className="h-5 w-5" strokeWidth={1.5} /> Sign Up for Updates
              </Button>
            </a>
            <a
              href="https://github.com/GACWR/openuba-model-hub"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCtaClick("Add Your Model", "https://github.com/GACWR/openuba-model-hub")}
            >
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold gap-2.5 px-6 h-11">
                <PlusCircle className="h-5 w-5" strokeWidth={1.5} /> Add Your Model
              </Button>
            </a>
            <a
              href="https://github.com/GACWR/OpenUBA"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCtaClick("Star on GitHub", "https://github.com/GACWR/OpenUBA")}
            >
              <Button
                variant="outline"
                className="border-blue-500/20 text-blue-300 hover:bg-blue-500/10 gap-2.5 px-6 h-11"
              >
                <Github className="h-5 w-5" strokeWidth={1.5} /> Star on GitHub
              </Button>
            </a>
            <Link href="/models" onClick={() => trackCtaClick("Browse Models", "/models")}>
              <Button
                variant="ghost"
                className="text-blue-300/70 hover:text-blue-200 gap-2.5 px-6 h-11"
              >
                <Compass className="h-5 w-5" strokeWidth={1.5} /> Browse Models
              </Button>
            </Link>
            <a
              href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/openuba.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackCtaClick("Read the Paper", "openuba.pdf")}
            >
              <Button
                variant="ghost"
                className="text-blue-300/70 hover:text-blue-200 gap-2.5 px-6 h-11"
              >
                <FileText className="h-5 w-5" strokeWidth={1.5} /> Read the Paper
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
