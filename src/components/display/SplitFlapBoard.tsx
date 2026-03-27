"use client";

import {
  useRef,
  useCallback,
  useImperativeHandle,
  forwardRef,
  createRef,
} from "react";
import SplitFlapRow, { type SplitFlapRowRef } from "./SplitFlapRow";
import { BOARD_ROWS, BOARD_COLS } from "@/lib/vestaboard/layout";
import { calculateFlipPath } from "@/lib/vestaboard/charset";
import type { BoardState } from "@/types";
import styles from "@/styles/board.module.css";

export interface SplitFlapBoardRef {
  /**
   * Transition the entire board to a new message.
   * Calculates flip paths for each tile and animates them with stagger.
   */
  transitionTo: (
    target: BoardState,
    flipSpeed?: number,
    staggerDelay?: number,
    onFlipStep?: (row: number, col: number) => void
  ) => Promise<void>;
}

interface SplitFlapBoardProps {
  initialBoard: BoardState;
}

interface TileFlipTask {
  row: number;
  col: number;
  flipPath: number[];
  startTime: number;
  tileRef: { flipTo: (code: number, duration: number) => Promise<void> };
  onFlipStep?: (row: number, col: number) => void;
  flipSpeed: number;
}

const SplitFlapBoard = forwardRef<SplitFlapBoardRef, SplitFlapBoardProps>(
  function SplitFlapBoard({ initialBoard }, ref) {
    const rowRefs = useRef<React.RefObject<SplitFlapRowRef | null>[]>(
      Array.from({ length: BOARD_ROWS }, () => createRef<SplitFlapRowRef>())
    );

    const transitionTo = useCallback(
      async (
        target: BoardState,
        flipSpeed: number = 280,
        staggerDelay: number = 35,
        onFlipStep?: (row: number, col: number) => void
      ) => {
        // Pre-calculate all tile tasks with their start times
        const tasks: TileFlipTask[] = [];

        for (let row = 0; row < BOARD_ROWS; row++) {
          for (let col = 0; col < BOARD_COLS; col++) {
            const rowRef = rowRefs.current[row]?.current;
            if (!rowRef) continue;

            const tileRef = rowRef.getTileRef(col);
            if (!tileRef) continue;

            const currentCode = tileRef.getCurrentCode();
            const targetCode = target[row]?.[col] ?? 0;

            if (currentCode === targetCode) continue;

            const flipPath = calculateFlipPath(currentCode, targetCode);
            if (flipPath.length === 0) continue;

            // Calculate stagger: left-to-right, top-to-bottom with jitter
            const linearIndex = row * BOARD_COLS + col;
            const jitter = (Math.random() - 0.5) * staggerDelay * 0.3;
            const startTime = linearIndex * staggerDelay + jitter;

            tasks.push({
              row,
              col,
              flipPath,
              startTime: Math.max(0, startTime),
              tileRef,
              onFlipStep,
              flipSpeed,
            });
          }
        }

        if (tasks.length === 0) return;

        // Use a single rAF scheduling loop instead of per-tile setTimeouts
        return new Promise<void>((resolve) => {
          const startTimestamp = performance.now();
          // Track each task's current flip step and its completion promise
          const taskState = tasks.map(() => ({
            started: false,
            stepIndex: 0,
            flipping: false,
            done: false,
            currentPromise: null as Promise<void> | null,
          }));
          let allDone = false;

          function tick() {
            if (allDone) return;

            const elapsed = performance.now() - startTimestamp;
            let pendingCount = 0;

            for (let i = 0; i < tasks.length; i++) {
              const state = taskState[i];
              if (state.done) continue;

              pendingCount++;
              const task = tasks[i];

              // Check if it's time to start this tile
              if (!state.started && elapsed >= task.startTime) {
                state.started = true;
              }

              if (!state.started || state.flipping) continue;

              // Start the next flip step
              if (state.stepIndex < task.flipPath.length) {
                state.flipping = true;
                task.onFlipStep?.(task.row, task.col);
                const stepCode = task.flipPath[state.stepIndex];
                state.currentPromise = task.tileRef
                  .flipTo(stepCode, task.flipSpeed)
                  .then(() => {
                    state.stepIndex++;
                    state.flipping = false;
                    if (state.stepIndex >= task.flipPath.length) {
                      state.done = true;
                    }
                  });
              }
            }

            if (pendingCount === 0) {
              allDone = true;
              resolve();
              return;
            }

            requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
        });
      },
      []
    );

    useImperativeHandle(ref, () => ({ transitionTo }), [transitionTo]);

    return (
      <div className={styles.boardContainer}>
        <div className={styles.board}>
          {Array.from({ length: BOARD_ROWS }, (_, row) => (
            <SplitFlapRow
              key={row}
              ref={rowRefs.current[row]}
              rowIndex={row}
              codes={initialBoard[row] ?? []}
            />
          ))}
        </div>
      </div>
    );
  }
);

SplitFlapBoard.displayName = "SplitFlapBoard";

export default SplitFlapBoard;
