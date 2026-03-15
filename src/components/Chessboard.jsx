import { useRef, useEffect, useState, useCallback } from 'react'
import { Chessground } from '@lichess-org/chessground'
import './Chessboard.css'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1']

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
  shapes: shapesOverride,
  onSquareClick,
}) {
  const wrapperRef = useRef(null)
  const cgContainerRef = useRef(null)
  const cgRef = useRef(null)
  const [size, setSize] = useState(0)
  const onSquareClickRef = useRef(onSquareClick)
  useEffect(() => { onSquareClickRef.current = onSquareClick }, [onSquareClick])

  // Overlay click handler: calcola la casa dalla posizione del click
  // Usato in detective mode perché Chessground non emette select senza pezzi movibili
  const handleOverlayClick = useCallback((e) => {
    if (!onSquareClickRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const col = Math.min(Math.floor((x / rect.width) * 8), 7)
    const row = Math.min(Math.floor((y / rect.height) * 8), 7)
    const file = orientation === 'white' ? FILES[col] : FILES[7 - col]
    const rank = orientation === 'white' ? RANKS[row] : RANKS[7 - row]
    onSquareClickRef.current(`${file}${rank}`)
  }, [orientation])

  // Measure container width and keep it square
  useEffect(() => {
    if (!wrapperRef.current) return

    const measure = () => {
      const w = wrapperRef.current.clientWidth
      if (w > 0 && w !== size) setSize(w)
    }

    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(wrapperRef.current)
    return () => ro.disconnect()
  }, [])

  // Init/destroy Chessground — dipende solo da size.
  // Il remount al cambio di interactive/viewOnly è gestito tramite prop key
  // sul container div (React smonta e rimonta il nodo → cleanup/init naturale).
  useEffect(() => {
    if (!cgContainerRef.current || size === 0) return

    const cg = Chessground(cgContainerRef.current, buildConfig())
    cgRef.current = cg

    return () => {
      cg.destroy()
      cgRef.current = null
    }
  }, [size])

  // Update config on prop changes
  useEffect(() => {
    if (!cgRef.current) return
    cgRef.current.set(buildConfig())
  }, [fen, orientation, turnColor, dests, interactive, arrows, circles, lastMove, check, viewOnly, shapesOverride])

  function buildConfig() {
    const movableColor = viewOnly || !interactive ? undefined : (turnColor || 'white')

    const builtShapes = shapesOverride != null
      ? shapesOverride
      : [
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
        autoShapes: builtShapes,
      },
    }
  }

  // Key che forza il remount del container quando interactive/viewOnly cambiano.
  // Necessario perché Chessground non aggiorna draggable.enabled via .set().
  const cgKey = `cg-${interactive ? 'i' : 'n'}-${viewOnly ? 'v' : 'n'}`

  return (
    <div ref={wrapperRef} style={{ width: '100%', position: 'relative' }}>
      <div
        key={cgKey}
        ref={cgContainerRef}
        style={{ width: size, height: size }}
      />
      {/* Overlay trasparente per detective mode — bypassa Chessground che non emette
          click su pezzi non movibili. Calcola la casa direttamente dalla posizione. */}
      {onSquareClick && (
        <div
          onClick={handleOverlayClick}
          style={{
            position: 'absolute',
            inset: 0,
            cursor: 'crosshair',
            zIndex: 5,
          }}
        />
      )}
    </div>
  )
}
