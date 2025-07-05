"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mic, Square } from "lucide-react"

interface VoiceRecorderProps {
  onTranscription: (text: string) => void
  isRecording: boolean
  setIsRecording: (recording: boolean) => void
}

declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

export function VoiceRecorder({ onTranscription, isRecording, setIsRecording }: VoiceRecorderProps) {
  const [recordingTime, setRecordingTime] = useState(0)
  const [isSupported, setIsSupported] = useState(true)
  const [error, setError] = useState("")
  const recognitionRef = useRef<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setIsSupported(false)
      setError("Speech recognition not supported in this browser")
    }
  }, [])

  useEffect(() => {
    if (isRecording) {
      intervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      setRecordingTime(0)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      setError("")
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) {
        setError("Speech recognition not supported")
        return
      }

      const recognition = new SpeechRecognition()
      recognitionRef.current = recognition

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = "en-US"

      recognition.onstart = () => {
        setIsRecording(true)
        setError("")
      }

      recognition.onresult = (event: any) => {
        let finalTranscript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " "
          }
        }
        if (finalTranscript.trim()) {
          onTranscription(finalTranscript.trim())
        }
      }

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setError(`Recognition error: ${event.error}`)
        setIsRecording(false)
      }

      recognition.onend = () => {
        setIsRecording(false)
      }

      recognition.start()
    } catch (error) {
      console.error("Error starting recording:", error)
      setError("Unable to start voice recording")
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsRecording(false)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500">
        Voice recording not supported in this browser. Please use Chrome, Edge, or Safari.
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      {error && (
        <div className="text-xs text-red-500 max-w-48 truncate" title={error}>
          {error}
        </div>
      )}

      {isRecording ? (
        <>
          <Button type="button" variant="destructive" size="sm" onClick={stopRecording} className="animate-pulse">
            <Square className="w-4 h-4 mr-2" />
            Stop Recording
          </Button>
          <Badge variant="destructive" className="animate-pulse">
            {formatTime(recordingTime)}
          </Badge>
        </>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startRecording}
          className="border-teal-200 hover:bg-teal-50 bg-transparent"
          disabled={!isSupported}
        >
          <Mic className="w-4 h-4 mr-2" />
          Voice Input
        </Button>
      )}
    </div>
  )
}
