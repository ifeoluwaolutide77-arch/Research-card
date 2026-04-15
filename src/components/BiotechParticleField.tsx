"use client";

import { useEffect, useMemo, useState } from "react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useReducedMotion } from "framer-motion";

export function BiotechParticleField() {
  const [ready, setReady] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const options = useMemo(
    () => ({
      fullScreen: { enable: false },
      detectRetina: true,
      fpsLimit: 60,
      background: { opacity: 0 },
      particles: {
        number: { value: 38, density: { enable: true, width: 1400, height: 700 } },
        color: { value: ["#4fd1ff", "#8bf7d4", "#6ee7ff"] },
        links: {
          enable: true,
          distance: 110,
          opacity: 0.18,
          color: "#79d4ff",
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.45,
          outModes: { default: "out" as const },
        },
        opacity: { value: { min: 0.2, max: 0.55 } },
        size: { value: { min: 1, max: 3 } },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: "grab" },
          resize: { enable: true },
        },
        modes: {
          grab: { distance: 140, links: { opacity: 0.42 } },
        },
      },
    }),
    [],
  );

  if (!ready || prefersReducedMotion) return null;

  return <Particles id="biotech-particles" className="absolute inset-0 -z-[1] opacity-70" options={options} />;
}
