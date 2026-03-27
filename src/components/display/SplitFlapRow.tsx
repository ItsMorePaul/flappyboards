"use client";

import { memo, useRef, useImperativeHandle, forwardRef, createRef } from "react";
import SplitFlapTile, { type SplitFlapTileRef } from "./SplitFlapTile";
import { BOARD_COLS } from "@/lib/vestaboard/layout";

export interface SplitFlapRowRef {
  getTileRef: (col: number) => SplitFlapTileRef | null;
}

interface SplitFlapRowProps {
  rowIndex: number;
  codes: number[];
}

const SplitFlapRow = memo(
  forwardRef<SplitFlapRowRef, SplitFlapRowProps>(
    function SplitFlapRow({ rowIndex, codes }, ref) {
      const tileRefs = useRef<React.RefObject<SplitFlapTileRef | null>[]>(
        Array.from({ length: BOARD_COLS }, () => createRef<SplitFlapTileRef>())
      );

      useImperativeHandle(
        ref,
        () => ({
          getTileRef: (col: number) => tileRefs.current[col]?.current ?? null,
        }),
        []
      );

      return (
        <>
          {Array.from({ length: BOARD_COLS }, (_, col) => (
            <SplitFlapTile
              key={col}
              ref={tileRefs.current[col]}
              initialCode={codes[col] ?? 0}
              row={rowIndex}
              col={col}
            />
          ))}
        </>
      );
    }
  )
);

SplitFlapRow.displayName = "SplitFlapRow";

export default SplitFlapRow;
