/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Download, Tag, Info, Star } from "lucide-react";
import { Addon } from "../types";

interface AddonSliderProps {
  addons: Addon[];
  onOpenDetails: (addon: Addon) => void;
  onDownload: (addon: Addon) => void;
}

export default function AddonSlider({ addons, onOpenDetails, onDownload }: AddonSliderProps) {
  // Sort addons by download count to find the top 4 featured popular ones
  const featuredAddons = [...addons]
    .sort((a, b) => b.downloads - a.downloads)
    .slice(0, 4);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 for left, 1 for right
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      handleNext();
    }, 5000); // Auto slide every 5 seconds
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  useEffect(() => {
    if (featuredAddons.length > 1) {
      startTimer();
    }
    return () => stopTimer();
  }, [currentIndex, addons]);

  if (featuredAddons.length === 0) {
    return null;
  }

  const handleNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % featuredAddons.length);
  };

  const handlePrev = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + featuredAddons.length) % featuredAddons.length);
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
      },
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
      },
    }),
  };

  const currentAddon = featuredAddons[currentIndex];

  return (
    <div
      id="addon-slider-container"
      className="relative w-full overflow-hidden rounded-3xl glass-premium card-hover-border glaze-reflection glow-emerald hover:glow-emerald-active border border-slate-800/80 shadow-2xl group backdrop-blur-md transition-all duration-300"
      onMouseEnter={stopTimer}
      onMouseLeave={startTimer}
    >
      {/* Background Cover Overlay */}
      <div className="absolute inset-0 z-0 opacity-20 filter blur-xl scale-110 pointer-events-none transition-all duration-700">
        <img
          src={currentAddon.coverUrl}
          alt=""
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="relative z-10 flex flex-col md:flex-row h-full min-h-[380px] md:min-h-[340px]">
        {/* Left Side: Image Cover Container */}
        <div className="w-full md:w-5/12 h-[200px] md:h-auto relative overflow-hidden flex items-center justify-center p-4 md:p-6">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentAddon.id + "-cover"}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full h-full rounded-2xl overflow-hidden border border-slate-700/50 shadow-lg relative group/cover"
            >
              <img
                src={currentAddon.coverUrl}
                alt={currentAddon.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover/cover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-3 left-3 bg-emerald-500/95 text-slate-950 text-xs font-bold font-mono px-3 py-1 rounded-full shadow-md backdrop-blur-sm">
                POPULER 🔥
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Information Panel */}
        <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-between">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentAddon.id + "-info"}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="flex-1 flex flex-col justify-center"
            >
              {/* Category Badge & Version */}
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                  <Tag size={12} />
                  {currentAddon.category}
                </span>
                <span className="text-xs font-mono text-slate-400 bg-slate-800/80 border border-slate-700/50 px-2.5 py-0.5 rounded-full">
                  MC {currentAddon.compatibleVersion}
                </span>
              </div>

              {/* Addon Name */}
              <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-100 tracking-tight leading-tight mb-3 group-hover:text-emerald-400 transition-colors">
                {currentAddon.name}
              </h2>

              {/* Addon Description Snippet */}
              <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 mb-6">
                {currentAddon.description}
              </p>

              {/* Download Stats and File Info */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-slate-400 mb-6">
                <div>
                  Unduhan:{" "}
                  <span className="text-emerald-400 font-bold">
                    {currentAddon.downloads.toLocaleString("id-ID")}x
                  </span>
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                <div>
                  Ukuran: <span className="text-slate-200">{currentAddon.fileSize}</span>
                </div>
                <div className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                <div className="flex items-center gap-1">
                  Rating:{" "}
                  {currentAddon.ratingCount && currentAddon.ratingCount > 0 ? (
                    <span className="flex items-center gap-0.5 text-amber-400 font-bold">
                      <Star size={12} className="fill-amber-400 stroke-amber-400" />
                      <span>{(currentAddon.ratingSum! / currentAddon.ratingCount).toFixed(1)}</span>
                      <span className="text-[10px] text-slate-500 font-normal">({currentAddon.ratingCount})</span>
                    </span>
                  ) : (
                    <span className="text-slate-500">Belum dinilai</span>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 mt-auto">
            <button
              id={`slide-download-btn-${currentAddon.id}`}
              onClick={() => onDownload(currentAddon)}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Download size={16} className="animate-bounce" />
              Unduh Langsung
            </button>
            <button
              id={`slide-detail-btn-${currentAddon.id}`}
              onClick={() => onOpenDetails(currentAddon)}
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700/80 font-semibold text-sm px-4 py-3 rounded-xl transition-colors active:scale-95 cursor-pointer"
            >
              <Info size={16} />
              Detail
            </button>
          </div>
        </div>
      </div>

      {/* Slide Navigation Dots (Mobile Friendly Slider Indicators) */}
      <div className="absolute bottom-4 right-6 flex items-center gap-1.5 z-20">
        {featuredAddons.map((_, index) => (
          <button
            key={index}
            id={`slide-dot-${index}`}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              index === currentIndex ? "w-6 bg-emerald-500" : "w-2 bg-slate-700 hover:bg-slate-500"
            }`}
            aria-label={`Slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Navigation Arrows (Desktop Hidden hover) */}
      <button
        id="slide-prev-arrow"
        onClick={handlePrev}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-slate-950/80 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-emerald-500 hover:text-slate-950 transition-all opacity-0 group-hover:opacity-100 hidden md:flex cursor-pointer"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        id="slide-next-arrow"
        onClick={handleNext}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 items-center justify-center rounded-full bg-slate-950/80 border border-slate-800/80 text-slate-400 hover:text-white hover:bg-emerald-500 hover:text-slate-950 transition-all opacity-0 group-hover:opacity-100 hidden md:flex cursor-pointer"
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}
