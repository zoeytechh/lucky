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
  nextRoundId: string
  nextRoundNumber: number
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
