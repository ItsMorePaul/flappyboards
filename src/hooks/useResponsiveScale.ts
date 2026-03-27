"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BOARD_ROWS, BOARD_COLS } from "@/lib/vestaboard/layout";

// Base tile dimensions (from CSS custom properties)
const TILE_WIDTH = 48;
const TILE_HEIGHT = 64;
const TILE_GAP = 3;
const BOARD_PADDING_X = 40; // 20px each side
const BOARD_PADDING_Y = 32; // 16px each side

export function useResponsiveScale() {
  const [scale, setScale] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const calculate = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const boardWidth =
      BOARD_COLS * TILE_WIDTH + (BOARD_COLS - 1) * TILE_GAP + BOARD_PADDING_X;
    const boardHeight =
      BOARD_ROWS * TILE_HEIGHT + (BOARD_ROWS - 1) * TILE_GAP + BOARD_PADDING_Y;

    const scaleX = (vw * 0.95) / boardWidth;
    const scaleY = (vh * 0.9) / boardHeight;

    setScale(Math.min(scaleX, scaleY));
  }, []);

  useEffect(() => {
    calculate();

    const debouncedResize = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(calculate, 200);
    };

    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [calculate]);

  return scale;
}
