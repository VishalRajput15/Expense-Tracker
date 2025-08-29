"use client"
import { useCallback, useEffect, useRef, useState } from "react"

type Result = {
  amount?: number
  category?: string
  description?: string
  raw: string
}

export function parseExpenseCommand(text: string): Result {
  const s = text.toLowerCase()
  const amountMatch = s.match(/(\d+(\.\d+)?)/)
  const afterFor = s.split(" for ").pop() || s
  const words = afterFor.replace(/[^\w\s]/g, "").trim()
  return {
    amount: amountMatch ? Number(amountMatch[1]) : undefined,
    category: words.split(" ")[0] || undefined,
    description: words || text,
    raw: text,
  }
}

export default function VoiceCapture({
  onResult,
}: {
  onResult: (r: Result) => void
}) {
  const [listening, setListening] = useState(false)
  const recRef = useRef<any>(null)

  useEffect(() => {
    const w = window as any
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition
    if (SpeechRecognition) {
      recRef.current = new SpeechRecognition()
      recRef.current.continuous = false
      recRef.current.lang = "en-US"
      recRef.current.interimResults = false
      recRef.current.maxAlternatives = 1
      recRef.current.onresult = (e: any) => {
        const text = e.results?.[0]?.[0]?.transcript || ""
        if (text) onResult(parseExpenseCommand(text))
      }
      recRef.current.onend = () => setListening(false)
    }
  }, [onResult])

  const toggle = useCallback(() => {
    if (!recRef.current) return
    if (!listening) {
      setListening(true)
      recRef.current.start()
    } else {
      recRef.current.stop()
    }
  }, [listening])

  return (
    <button
      type="button"
      onClick={toggle}
      className={`h-9 w-9 rounded-md border text-sm transition-transform hover:scale-105 ${listening ? "bg-blue-600 text-white" : "bg-transparent hover:bg-muted"}`}
      title={listening ? "Stop voice input" : "Start voice input"}
      aria-pressed={listening}
    >
      🎤
    </button>
  )
}
