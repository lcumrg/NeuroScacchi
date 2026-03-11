import { useRef, useEffect } from 'react'
import { Chessground } from '@lichess-org/chessground'
import './Chessboard.css'

export default function Chessboard({
  fen,
  orientation = 'white',
  turnColor,
  dests,
  onMove,
  interactive = true,
  arrows = [],
  circles = [],
  lastMove,
  check,
  viewOnly = false,
}) {
  const containerRef = useRef(null)
  const cgRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    const cg = Chessground(containerRef.current, buildConfig())
    cgRef.current = cg

    return () => {
      cg.destroy()
      cgRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!cgRef.current) return
    cgRef.current.set(buildConfig())
  }, [fen, orientation, turnColor, dests, interactive, arrows, circles, lastMove, check, viewOnly])

  function buildConfig() {
    const movableColor = viewOnly || !interactive ? undefined : (turnColor || 'white')

    const shapes = [
      ...arrows.map(a => ({
        orig: a.orig,
        dest: a.dest,
        brush: a.brush || 'green',
      })),
      ...circles.map(c => ({
        orig: c.key,
        dest: c.key,
        brush: c.brush || 'green',
      })),
    ]

    return {
      fen,
      orientation,
      turnColor: turnColor || 'white',
      check: check || false,
      lastMove: lastMove || undefined,
      viewOnly,
      coordinates: true,
      highlight: {
        lastMove: true,
        check: true,
      },
      animation: {
        enabled: true,
        duration: 200,
      },
      movable: {
        free: false,
        color: movableColor,
        dests: dests || new Map(),
        showDests: true,
        events: {
          after: (orig, dest) => {
            if (onMove) onMove(orig, dest)
          },
        },
      },
      draggable: {
        enabled: interactive && !viewOnly,
        showGhost: true,
      },
      selectable: {
        enabled: interactive && !viewOnly,
      },
      premovable: {
        enabled: false,
      },
      drawable: {
        enabled: true,
        visible: true,
        autoShapes: shapes,
      },
    }
  }

  return <div ref={containerRef} className="chessboard-container" />
}
