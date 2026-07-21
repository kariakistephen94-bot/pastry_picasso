"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import FoodImage from "@/components/FoodImage";
import SiteFooter from "@/components/blocks/SiteFooter";
import { GALLERY, IMG } from "@/lib/data";
import { useLockBody } from "@/lib/hooks";

interface Tile {
  src: string;
  alt: string;
  position?: string;
  zoom?: number;
  /** aspect class for crop tiles; natural ratio when omitted */
  aspect?: string;
  w: number;
  h: number;
}

const TILES: Tile[] = [
  GALLERY[0],
  { src: IMG.waffleBurger, alt: "Waffle Burger up close", position: "52% 40%", zoom: 1.5, aspect: "aspect-square", w: 960, h: 960 },
  GALLERY[3],
  { src: IMG.hero, alt: "Signature milk tea with boba pearls", position: "31% 21%", zoom: 2, aspect: "aspect-[4/5]", w: 853, h: 1066 },
  GALLERY[2],
  { src: IMG.hero, alt: "Chocolate Oreo milkshake", position: "88% 76%", zoom: 2, aspect: "aspect-[4/5]", w: 853, h: 1066 },
  GALLERY[5],
  { src: IMG.allInOne, alt: "Money bags and golden spring rolls", position: "40% 38%", zoom: 1.8, aspect: "aspect-square", w: 960, h: 960 },
  GALLERY[1],
  { src: IMG.hero, alt: "Chocolate drizzle waffles", position: "84% 32%", zoom: 2, aspect: "aspect-[4/5]", w: 853, h: 1066 },
  GALLERY[4],
];

export default function GalleryPage() {
  const [selected, setSelected] = useState<number | null>(null);
  useLockBody(selected !== null);

  const prev = useCallback(
    () => setSelected((s) => (s === null ? null : (s + TILES.length - 1) % TILES.length)),
    []
  );
  const next = useCallback(
    () => setSelected((s) => (s === null ? null : (s + 1) % TILES.length)),
    []
  );

  useEffect(() => {
    if (selected === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, prev, next]);

  const current = selected !== null ? TILES[selected] : null;

  return (
    <div className="mx-auto max-w-[1020px] px-4 sm:px-6 lg:px-8">
      <header className="pt-5 lg:pt-7">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink-900 lg:text-[30px]">
          Gallery
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500 lg:text-[14px]">
          Real orders, fresh from our kitchen in Egbeda.
        </p>
      </header>

      {/* Masonry */}
      <div className="mt-5 columns-2 gap-3 sm:columns-3 lg:gap-4">
        {TILES.map((tile, i) => (
          <motion.button
            key={`${tile.src}-${i}`}
            type="button"
            aria-label={`View photo: ${tile.alt}`}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: (i % 3) * 0.06 }}
            onClick={() => setSelected(i)}
            className="group mb-3 block w-full overflow-hidden rounded-[22px] shadow-soft transition-shadow duration-300 [break-inside:avoid] hover:shadow-card lg:mb-4"
          >
            <motion.div layoutId={`gallery-${i}`} className="relative">
              {tile.aspect ? (
                <FoodImage
                  src={tile.src}
                  alt={tile.alt}
                  position={tile.position}
                  zoom={tile.zoom}
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className={`${tile.aspect} w-full`}
                />
              ) : (
                <span className="block overflow-hidden">
                  <Image
                    src={tile.src}
                    alt={tile.alt}
                    width={tile.w}
                    height={tile.h}
                    sizes="(max-width: 640px) 50vw, 33vw"
                    className="h-auto w-full transition-transform duration-700 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                  />
                </span>
              )}
            </motion.div>
          </motion.button>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {current && selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex flex-col bg-ink-950/92 backdrop-blur-md"
            onClick={() => setSelected(null)}
          >
            <div className="flex items-center justify-between p-4 sm:p-5">
              <span className="rounded-full bg-white/10 px-3.5 py-1.5 text-[12px] font-bold text-white/80 backdrop-blur">
                {selected + 1} / {TILES.length}
              </span>
              <button
                type="button"
                aria-label="Close gallery"
                onClick={() => setSelected(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              className="relative flex flex-1 items-center justify-center px-3 pb-6 sm:px-16"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                key={selected}
                layoutId={`gallery-${selected}`}
                className="relative max-h-full w-full max-w-[520px]"
              >
                <motion.div
                  initial={{ opacity: 0.6, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.4}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -80) next();
                    else if (info.offset.x > 80) prev();
                  }}
                  className="overflow-hidden rounded-[26px] shadow-float"
                >
                  <Image
                    src={current.src}
                    alt={current.alt}
                    width={current.w}
                    height={current.h}
                    sizes="(max-width: 640px) 100vw, 520px"
                    className="h-auto max-h-[72dvh] w-full object-contain"
                    priority
                  />
                </motion.div>
                <p className="mt-3.5 text-center text-[13px] font-medium text-white/70">
                  {current.alt}
                </p>
              </motion.div>

              <button
                type="button"
                aria-label="Previous photo"
                onClick={prev}
                className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 sm:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={next}
                className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20 sm:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10">
        <SiteFooter />
      </div>
    </div>
  );
}
