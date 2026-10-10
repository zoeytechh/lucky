import { useEffect, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import { API_URL } from './api'

export type RoundProgress = {
  roundId: string
  roundNumber: number
  entryCount: number
  capacity: number
}

export type RoundSettled = {
  roundId: string
  roundNumber: number
  winnerSlotNumber: number
  winnerDisplayName: string
  winnerAvatarUrl: string | null
  winnerPayoutMinor: string
  // When the winner number actually appears — decided once server-side
  // (see REVEAL_MIN_MS/REVEAL_MAX_MS in lucky-api), so every viewer
  // counts down to the same instant instead of each client randomizing
  // its own.
  revealAt: string
  nextRoundId: string
  nextRoundNumber: number
  // When the next round starts accepting entries — revealAt +
  // REVEAL_HOLD_MS, and the actual backend-enforced gate (a POST to
  // /api/draw/entries before this is refused), not just a UI convention.
  nextEntriesOpenAt: string
}

/**
 * One shared connection per mounted consumer — round progress/settlement
 * is public broadcast info (see lucky-api's realtime/socket.ts), so this
 * carries no auth. Each event is exposed as the latest-received value;
 * the caller is responsible for matching `roundId` against whatever
 * round it currently cares about (a `round:settled` for a round the
 * caller already moved past should be ignored by the caller, not here).
 */
export function useDrawSocket() {
  const [progress, setProgress] = useState<RoundProgress | null>(null)
  const [settled, setSettled] = useState<RoundSettled | null>(null)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    const socket = io(API_URL, { withCredentials: true })
    socketRef.current = socket
    socket.on('round:progress', (payload: RoundProgress) => setProgress(payload))
    socket.on('round:settled', (payload: RoundSettled) => setSettled(payload))
    return () => {
      socket.disconnect()
    }
  }, [])

  return { progress, settled }
}
