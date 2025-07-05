"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, FileText, Download, Share2, ChevronDown, ChevronUp } from "lucide-react"

interface Reflection {
  id: string
  topic: string
  summary: string
  reflection: string
  created_at: string
}

interface ReflectionHistoryProps {
  reflections: Reflection[]
}

export function ReflectionHistory({ reflections }: ReflectionHistoryProps) {
  const [expandedReflection, setExpandedReflection] = useState<string | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleExport = async (reflection: Reflection, format: "txt" | "pdf") => {
    try {
      const token = localStorage.getItem("auth_token")
      const response = await fetch(`/api/reflections/${reflection.id}/export?format=${format}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `reflection-${reflection.topic.replace(/\s+/g, "-")}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error("Export failed:", error)
    }
  }

  const handleShare = async (reflection: Reflection) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Reflection: ${reflection.topic}`,
          text: reflection.summary,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Share failed:", error)
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `${reflection.topic}\n\n${reflection.summary}\n\n${reflection.reflection}`
      navigator.clipboard.writeText(shareText)
      alert("Reflection copied to clipboard!")
    }
  }

  if (reflections.length === 0) {
    return (
      <Card className="border-teal-100">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <span>Reflection History</span>
          </CardTitle>
          <CardDescription>Your past reflections will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No reflections yet. Start by writing your first reflection above!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-teal-100">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-teal-600" />
          <span>Reflection History</span>
        </CardTitle>
        <CardDescription>Your journey of self-reflection and growth</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {reflections.map((reflection) => (
              <div
                key={reflection.id}
                className="border border-teal-100 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{reflection.topic}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(reflection.created_at)}</span>
                      <Badge variant="outline" className="text-xs">
                        {reflection.reflection.split(" ").length} words
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleExport(reflection, "txt")}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleShare(reflection)} className="h-8 w-8 p-0">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3">{reflection.summary}</p>

                {expandedReflection === reflection.id ? (
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{reflection.reflection}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedReflection(null)}
                      className="text-teal-600 hover:text-teal-700"
                    >
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Show Less
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedReflection(reflection.id)}
                    className="text-teal-600 hover:text-teal-700"
                  >
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Read Full Reflection
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
