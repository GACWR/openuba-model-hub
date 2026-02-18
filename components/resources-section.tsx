"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const resources = [
  {
    image: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/mural.jpeg`,
    category: "Blog",
    title: "Introducing OpenUBA V2: Modern Security Analytics for All",
    description:
      "A deep dive into the new features of OpenUBA v0.0.2",
    href: "https://medium.com/georgia-cyber-warfare-range/introducing-openuba-v2-modern-security-analytics-for-all-08a62fd32013",
    comingSoon: true,
  },
  {
    image: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/medium.jpg`,
    category: "Blog",
    title:
      "Introducing OpenUBA: an open source user behavior analytics platform",
    description:
      "Powered by the scientific computing ecosystem — read the original announcement on Medium.",
    href: "https://medium.com/georgia-cyber-warfare-range/introducing-openuba-an-open-source-user-behavior-analytics-platform-powered-by-the-scientific-5d71bc50b808",
  },
  {
    image: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/framework.jpg`,
    category: "Architecture",
    title: "The OpenUBA Technology Stack v1",
    description:
      "Using the scientific computing ecosystem to enable behavior-based modeling.",
    href: "https://github.com/GACWR/OpenUBA/blob/master/images/framework.jpg",
  },
];

export function ResourcesSection() {
  return (
    <section className="py-24 px-4 relative">
      <div className="absolute bottom-0 left-1/3 w-[400px] h-[400px] bg-blue-600/4 rounded-full blur-[140px] -z-10" />
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Resources</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Blog posts, architecture deep dives, and announcements from the
            OpenUBA project.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.12 } },
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {resources.map((r) => (
            <motion.div
              key={r.title}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
            >
              {r.href ? (
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block h-full"
                >
                  <ResourceCard resource={r} />
                </a>
              ) : (
                <ResourceCard resource={r} />
              )}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ResourceCard({
  resource: r,
}: {
  resource: (typeof resources)[number];
}) {
  return (
    <div className="glass-card overflow-hidden h-full group transition-all duration-300 hover:ring-1 hover:ring-white/[0.06]">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden bg-[#0a0f1e]">
        {r.image ? (
          <Image
            src={r.image}
            alt={r.title}
            fill
            className="object-cover opacity-80 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-950/80 to-indigo-950/80">
            <span className="text-sm text-blue-300/50 font-medium">
              Coming Soon
            </span>
          </div>
        )}
        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span className="text-[10px] font-medium uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/50 text-blue-200/80 backdrop-blur-sm">
            {r.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-sm font-semibold mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
          {r.title}
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {r.description}
        </p>
      </div>
    </div>
  );
}
