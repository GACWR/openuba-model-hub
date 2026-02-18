import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-blue-500/8 bg-[#050a18]/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo-w.png"
                alt="OpenUBA"
                width={100}
                height={24}
                className="h-5 w-auto"
              />
              <span className="text-sm text-muted-foreground">Model Hub</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              Open source model registry for User Behavior Analytics. Discover,
              share, and install anomaly detection models.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">
              Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/models"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Model Hub
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/GACWR/OpenUBA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  OpenUBA
                </a>
              </li>
              <li>
                <a
                  href="/openuba.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  White Paper
                </a>
              </li>
              <li>
                <a
                  href="https://forms.gle/pjNXQid5caBZbMMfA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign Up for Updates
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">
              Community
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/GACWR/openuba-model-hub"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/Ps9p9Wy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Discord
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com/OpenUBA"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Twitter
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold mb-3 uppercase tracking-wider text-muted-foreground">
              Resources
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://medium.com/georgia-cyber-warfare-range/introducing-openuba-an-open-source-user-behavior-analytics-platform-powered-by-the-scientific-5d71bc50b808"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Blog
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/GACWR/ouba-paper/blob/master/openuba.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Research Paper
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-blue-500/8 text-center text-xs text-muted-foreground">
          &copy; 2019&ndash;{new Date().getFullYear()} Georgia Cyber Warfare
          Range, Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
