import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "OpenUBA Model Hub — Open Source Anomaly Detection Models",
  description:
    "Discover, share, and install community-driven anomaly detection models for User Behavior Analytics. scikit-learn, PyTorch, TensorFlow, Keras, NetworkX and more.",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/favicon.png`,
  },
  openGraph: {
    title: "OpenUBA Model Hub",
    description:
      "Open source model registry for User Behavior Analytics. AI-powered anomaly detection.",
    type: "website",
    url: "https://openuba.org",
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenUBA Model Hub",
    description:
      "Open source model registry for User Behavior Analytics.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
