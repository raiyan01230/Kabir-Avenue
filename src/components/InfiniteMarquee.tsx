import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { getStoreSettings } from "../lib/queries";

export default function InfiniteMarquee() {
  const [content, setContent] = useState<string[]>([
    "Free Shipping",
    "Secure Payment",
    "Easy Returns",
    "Cash on Delivery",
    "Fast Delivery",
  ]);

  useEffect(() => {
    async function fetchMarquee() {
      const settings = await getStoreSettings();
      if (settings['marquee_text']) {
        // Split by bullet points, pipes, or commas if Admin enters it as a string
        const parsed = settings['marquee_text']
          .split(/•|\|/)
          .map(s => s.trim())
          .filter(Boolean);
          
        if (parsed.length > 0) {
          setContent(parsed);
        }
      }
    }
    fetchMarquee();
  }, []);

  return (
    <div className="w-full overflow-hidden bg-slate-100 py-3 border-b border-slate-200">
      <motion.div
        className="flex"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 30,
        }}
      >
        {[...content, ...content].map((item, index) => (
          <span key={index} className="mx-4 text-sm font-medium text-slate-600 whitespace-nowrap">
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}
