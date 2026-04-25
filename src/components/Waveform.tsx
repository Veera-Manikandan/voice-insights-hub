import { motion } from "framer-motion";

export function Waveform({ className = "" }: { className?: string }) {
  const bars = Array.from({ length: 48 });
  return (
    <div className={`flex items-center justify-center gap-[3px] ${className}`}>
      {bars.map((_, i) => {
        const delay = (i % 12) * 0.08;
        const height = 20 + Math.sin(i * 0.5) * 30 + Math.random() * 30;
        return (
          <motion.span
            key={i}
            className="w-[3px] rounded-full bg-gradient-primary"
            initial={{ scaleY: 0.3 }}
            animate={{
              scaleY: [0.3, 1, 0.5, 0.9, 0.3],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
            style={{ height: `${height}%`, transformOrigin: "center" }}
          />
        );
      })}
    </div>
  );
}
