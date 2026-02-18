"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/* ─── Hex grid background ─── */
interface Hex {
  cx: number;
  cy: number;
  brightness: number;
}

function HexCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  const onMouse = useCallback((e: MouseEvent) => {
    const canvas = document.querySelector<HTMLCanvasElement>("#hero-hex-canvas");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current.x = e.clientX - rect.left;
    mouseRef.current.y = e.clientY - rect.top;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let w = 0;
    let h = 0;
    let hexes: Hex[] = [];

    const HEX_RADIUS = 55;
    const GAP = 3;
    const HOVER_RADIUS = 250;

    function buildGrid() {
      w = canvas!.width = canvas!.offsetWidth * window.devicePixelRatio;
      h = canvas!.height = canvas!.offsetHeight * window.devicePixelRatio;
      ctx!.scale(window.devicePixelRatio, window.devicePixelRatio);

      const rw = canvas!.offsetWidth;
      const rh = canvas!.offsetHeight;

      hexes = [];
      // Tight honeycomb: horizontal spacing = radius * 1.5 + gap, vertical = sqrt(3) * radius + gap
      const colStep = HEX_RADIUS * 1.5 + GAP;
      const rowStep = Math.sqrt(3) * (HEX_RADIUS + GAP * 0.5);

      const cols = Math.ceil(rw / colStep) + 3;
      const rows = Math.ceil(rh / rowStep) + 3;

      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const offset = col % 2 === 0 ? 0 : rowStep * 0.5;
          const cx = col * colStep;
          const cy = row * rowStep + offset;
          hexes.push({ cx, cy, brightness: 0 });
        }
      }
    }

    function hexPath(cx: number, cy: number, r: number) {
      ctx!.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        if (i === 0) ctx!.moveTo(x, y);
        else ctx!.lineTo(x, y);
      }
      ctx!.closePath();
    }

    function draw() {
      const rw = canvas!.offsetWidth;
      const rh = canvas!.offsetHeight;

      ctx!.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
      ctx!.clearRect(0, 0, rw, rh);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      for (const hex of hexes) {
        const dx = hex.cx - mx;
        const dy = hex.cy - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Target brightness based on mouse proximity
        const target = dist < HOVER_RADIUS ? 1 - dist / HOVER_RADIUS : 0;
        hex.brightness += (target - hex.brightness) * 0.12;

        const b = hex.brightness;
        const r = HEX_RADIUS - GAP * 0.5;

        // Idle hex — always slightly visible
        hexPath(hex.cx, hex.cy, r);
        ctx!.fillStyle = `rgba(8, 18, 40, ${0.4 + b * 0.15})`;
        ctx!.fill();

        hexPath(hex.cx, hex.cy, r);
        ctx!.strokeStyle = `rgba(50, 80, 140, ${0.12 + b * 0.2})`;
        ctx!.lineWidth = 0.7 + b * 0.6;
        ctx!.stroke();

        // Ominous metallic shimmer on hover
        if (b > 0.01) {
          const angle = Math.atan2(dy, dx);
          const gx1 = hex.cx + Math.cos(angle) * r;
          const gy1 = hex.cy + Math.sin(angle) * r;
          const gx2 = hex.cx - Math.cos(angle) * r;
          const gy2 = hex.cy - Math.sin(angle) * r;

          // Dark metallic gradient — cool steel with moody blue
          const grad = ctx!.createLinearGradient(gx1, gy1, gx2, gy2);
          grad.addColorStop(0, `rgba(140, 160, 200, ${b * 0.14})`);
          grad.addColorStop(0.2, `rgba(40, 60, 110, ${b * 0.2})`);
          grad.addColorStop(0.5, `rgba(80, 110, 170, ${b * 0.1})`);
          grad.addColorStop(0.8, `rgba(25, 40, 80, ${b * 0.22})`);
          grad.addColorStop(1, `rgba(120, 145, 190, ${b * 0.12})`);

          hexPath(hex.cx, hex.cy, r);
          ctx!.fillStyle = grad;
          ctx!.fill();

          // Eerie edge glow — dim cold light on the edges
          hexPath(hex.cx, hex.cy, r);
          ctx!.strokeStyle = `rgba(100, 140, 200, ${b * 0.3})`;
          ctx!.lineWidth = 1;
          ctx!.stroke();

          // Inner specular highlight — faint hot spot
          const spec = ctx!.createRadialGradient(
            hex.cx - Math.cos(angle) * r * 0.3,
            hex.cy - Math.sin(angle) * r * 0.3,
            0,
            hex.cx, hex.cy, r * 0.9
          );
          spec.addColorStop(0, `rgba(160, 190, 230, ${b * b * 0.15})`);
          spec.addColorStop(1, `rgba(40, 60, 100, 0)`);
          hexPath(hex.cx, hex.cy, r);
          ctx!.fillStyle = spec;
          ctx!.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    }

    buildGrid();
    draw();

    window.addEventListener("mousemove", onMouse);

    const handleResize = () => {
      buildGrid();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, [onMouse]);

  return (
    <canvas
      id="hero-hex-canvas"
      ref={canvasRef}
      className="absolute inset-0 z-0 w-full h-full"
    />
  );
}

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#010510] via-[#040c1a] to-background">
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-blue-600/5 rounded-full blur-[200px] z-0" />

      <HexCanvas />

      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="mb-6"
        >
          {["Open", "Source", "User", "Behavior", "Analytics"].map(
            (word, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                className={`inline-block text-4xl sm:text-5xl md:text-7xl font-bold mr-3 ${
                  i === 0 || i === 4
                    ? "bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent"
                    : "text-white"
                }`}
              >
                {word}
              </motion.span>
            )
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-lg sm:text-xl text-blue-200/60 mb-8 max-w-2xl mx-auto"
        >
          AI-Powered Anomaly Detection. Open Model Standard. SIEM Agnostic.
          <br />
          Discover and install community-driven detection models.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/models">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8"
            >
              Explore Models
            </Button>
          </Link>
          <a
            href="https://github.com/GACWR/OpenUBA"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              className="border-blue-500/25 text-blue-200 hover:bg-blue-500/10 px-8"
            >
              Get Started
            </Button>
          </a>
          <a
            href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/openuba.pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="ghost"
              className="text-blue-300/70 hover:text-blue-200 px-8"
            >
              Read the Paper
            </Button>
          </a>
        </motion.div>
      </div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <ChevronDown className="h-6 w-6 text-blue-400/40" />
      </motion.div>
    </section>
  );
}
