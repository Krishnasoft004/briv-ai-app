import { writeLog } from "./logger"

// lib/ai-service.ts
const HF_API_TOKEN = process.env.HF_API_TOKEN;
const HF_API_URL = "https://api-inference.huggingface.co/models/google/gemma-2-2b"

async function callHuggingFaceAPI(prompt: string, maxLength = 500) {
  try {
    await writeLog("ai", "info", "Calling Hugging Face API", {
      model: "google/gemma-2-2b",
      prompt_length: prompt.length,
      max_length: maxLength,
    })

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: maxLength,
          temperature: 0.7,
          do_sample: true,
          top_p: 0.9,
        },
      }),
    })

    if (response.ok) {
      const result = await response.json()
      const generatedText = Array.isArray(result) ? result[0]?.generated_text : result?.generated_text

      await writeLog("ai", "info", "Hugging Face API call successful", {
        response_length: generatedText?.length || 0,
      })

      return generatedText || ""
    } else {
      const errorText = await response.text()
      await writeLog("ai", "error", "Hugging Face API call failed", {
        status: response.status,
        error: errorText,
      })
      return null
    }
  } catch (error) {
    await writeLog("ai", "error", "Hugging Face API exception", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
    return null
  }
}

export async function generateAIInsights(reflectionText: string, topic: string, summary: string) {
  const prompt = `
    Analyze this personal reflection and provide wellness insights:
    
    Topic: ${topic}
    Summary: ${summary}
    Reflection: ${reflectionText}
    
    Please provide:
    1. Emotional tone analysis (positive, neutral, negative)
    2. Key themes identified
    3. Wellness score (1-100)
    4. One constructive suggestion for growth
    
    Format as JSON with keys: tone, themes, wellness_score, suggestion
  `

  const aiResponse = await callHuggingFaceAPI(prompt, 300)

  if (aiResponse) {
    try {
      const jsonMatch = aiResponse.match(/\{.*\}/s)
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0])
        await writeLog("ai", "info", "AI insights generated successfully", { insights })
        return insights
      }
    } catch (error) {
      await writeLog("ai", "warn", "Failed to parse AI insights JSON", { error })
    }
  }

  // Fallback analysis
  const fallbackInsights = {
    tone:
      reflectionText.toLowerCase().includes("good") || reflectionText.toLowerCase().includes("great")
        ? "positive"
        : "neutral",
    themes: ["self-reflection", "personal growth"],
    wellness_score: 75,
    suggestion: "Continue your reflection practice to build self-awareness.",
  }

  await writeLog("ai", "info", "Using fallback AI insights", { fallbackInsights })
  return fallbackInsights
}

export async function generateAssessmentQuestions(reflectionText: string, topic: string) {
  const prompt = `
    Based on this reflection about "${topic}":
    "${reflectionText}"
    
    Generate 5 multiple-choice wellness assessment questions. Each question should have 5 options with scores 1-5.
    
    Format as JSON array with structure:
    [
        {
            "id": "question_1",
            "question": "How would you rate your mood today?",
            "options": [
                {"value": "excellent", "label": "Excellent", "score": 5},
                {"value": "good", "label": "Good", "score": 4},
                {"value": "neutral", "label": "Neutral", "score": 3},
                {"value": "low", "label": "Low", "score": 2},
                {"value": "poor", "label": "Poor", "score": 1}
            ]
        }
    ]
    
    Focus on: mood, energy, stress, focus, gratitude
  `

  const aiResponse = await callHuggingFaceAPI(prompt, 800)

  if (aiResponse) {
    try {
      const jsonMatch = aiResponse.match(/\[.*\]/s)
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0])
        if (Array.isArray(questions) && questions.length >= 3) {
          await writeLog("ai", "info", "AI assessment questions generated", {
            question_count: questions.length,
          })
          return questions.slice(0, 5)
        }
      }
    } catch (error) {
      await writeLog("ai", "warn", "Failed to parse AI questions JSON", { error })
    }
  }

  // Fallback questions
  const fallbackQuestions = [
    {
      id: "mood",
      question: "How would you describe your overall mood today?",
      options: [
        { value: "excellent", label: "Excellent - I feel fantastic!", score: 5 },
        { value: "good", label: "Good - Generally positive", score: 4 },
        { value: "neutral", label: "Neutral - Neither good nor bad", score: 3 },
        { value: "low", label: "Low - Feeling down", score: 2 },
        { value: "poor", label: "Poor - Very difficult day", score: 1 },
      ],
    },
    {
      id: "energy",
      question: "What was your energy level like today?",
      options: [
        { value: "high", label: "High - Full of energy", score: 5 },
        { value: "good", label: "Good - Steady energy", score: 4 },
        { value: "moderate", label: "Moderate - Some ups and downs", score: 3 },
        { value: "low", label: "Low - Felt tired", score: 2 },
        { value: "exhausted", label: "Exhausted - Completely drained", score: 1 },
      ],
    },
    {
      id: "stress",
      question: "How stressed did you feel today?",
      options: [
        { value: "none", label: "Not stressed at all", score: 5 },
        { value: "minimal", label: "Minimal stress", score: 4 },
        { value: "moderate", label: "Moderate stress", score: 3 },
        { value: "high", label: "High stress", score: 2 },
        { value: "extreme", label: "Extreme stress", score: 1 },
      ],
    },
    {
      id: "focus",
      question: "How was your ability to focus today?",
      options: [
        { value: "excellent", label: "Excellent - Sharp thinking", score: 5 },
        { value: "good", label: "Good - Mostly focused", score: 4 },
        { value: "average", label: "Average - Some distractions", score: 3 },
        { value: "poor", label: "Poor - Hard to concentrate", score: 2 },
        { value: "very-poor", label: "Very poor - Couldn't focus", score: 1 },
      ],
    },
    {
      id: "gratitude",
      question: "How grateful did you feel today?",
      options: [
        { value: "very-grateful", label: "Very grateful", score: 5 },
        { value: "grateful", label: "Grateful", score: 4 },
        { value: "somewhat", label: "Somewhat grateful", score: 3 },
        { value: "neutral", label: "Neutral", score: 2 },
        { value: "ungrateful", label: "Focused on negatives", score: 1 },
      ],
    },
  ]

  await writeLog("ai", "info", "Using fallback assessment questions")
  return fallbackQuestions
}

export async function generateAssessmentAnalysis(answers: any, score: number) {
  const prompt = `
    Analyze this wellness assessment with score ${score}/100:
    Answers: ${JSON.stringify(answers)}
    
    Provide:
    1. Overall wellness summary
    2. Areas of strength
    3. Areas for improvement
    4. Personalized recommendations
    
    Format as JSON with keys: summary, strengths, improvements, recommendations
  `

  const aiResponse = await callHuggingFaceAPI(prompt, 400)

  if (aiResponse) {
    try {
      const jsonMatch = aiResponse.match(/\{.*\}/s)
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0])
        await writeLog("ai", "info", "AI assessment analysis generated", { analysis })
        return analysis
      }
    } catch (error) {
      await writeLog("ai", "warn", "Failed to parse AI analysis JSON", { error })
    }
  }

  // Fallback analysis
  let fallbackAnalysis
  if (score >= 80) {
    fallbackAnalysis = {
      summary: "Excellent wellness indicators today!",
      strengths: ["Positive mood", "Good energy levels"],
      improvements: ["Continue current practices"],
      recommendations: ["Maintain your current wellness routine"],
    }
  } else if (score >= 60) {
    fallbackAnalysis = {
      summary: "Good overall wellness with room for growth",
      strengths: ["Self-awareness", "Reflection practice"],
      improvements: ["Stress management", "Energy optimization"],
      recommendations: ["Consider mindfulness practices", "Focus on sleep quality"],
    }
  } else {
    fallbackAnalysis = {
      summary: "Challenging day - be kind to yourself",
      strengths: ["Honesty in self-assessment", "Commitment to growth"],
      improvements: ["Emotional support", "Stress reduction"],
      recommendations: ["Reach out to support network", "Practice self-compassion"],
    }
  }

  await writeLog("ai", "info", "Using fallback assessment analysis", { fallbackAnalysis })
  return fallbackAnalysis
}

export async function generateComprehensiveInsights(reflections: any[], userId: string) {
  const reflectionTexts = reflections
    .map((r) => `Topic: ${r.topic}\nSummary: ${r.summary}\nReflection: ${r.reflection}`)
    .join("\n\n---\n\n")

  const prompt = `
    Analyze these personal reflections for wellness insights:
    
    ${reflectionTexts}
    
    Provide 4 insights in JSON format:
    [
        {
            "type": "mood|pattern|suggestion|growth",
            "title": "Brief insight title",
            "description": "Detailed insight description",
            "confidence": 70-95,
            "trend": "up|down|stable"
        }
    ]
    
    Focus on emotional patterns, growth areas, and constructive suggestions.
  `

  const aiResponse = await callHuggingFaceAPI(prompt, 600)

  if (aiResponse) {
    try {
      const jsonMatch = aiResponse.match(/\[.*\]/s)
      if (jsonMatch) {
        const insights = JSON.parse(jsonMatch[0])
        if (Array.isArray(insights) && insights.length >= 2) {
          await writeLog("ai", "info", "AI comprehensive insights generated", {
            insight_count: insights.length,
            user_id: userId,
          })
          return insights.slice(0, 4)
        }
      }
    } catch (error) {
      await writeLog("ai", "warn", "Failed to parse AI insights JSON", { error })
    }
  }

  // Fallback insights based on text analysis
  const allText = reflectionTexts.toLowerCase()
  const insights = []

  const positiveWords = ["happy", "good", "great", "grateful", "joy", "love", "peaceful"]
  const negativeWords = ["sad", "stressed", "worried", "anxious", "frustrated", "tired"]

  const posCount = positiveWords.filter((word) => allText.includes(word)).length
  const negCount = negativeWords.filter((word) => allText.includes(word)).length

  if (posCount > negCount) {
    insights.push({
      type: "mood",
      title: "Positive Emotional Trend",
      description: "Your reflections show increasing positivity and gratitude.",
      confidence: Math.min(90, 70 + posCount * 5),
      trend: "up",
    })
  }

  if (reflections.length >= 3) {
    insights.push({
      type: "growth",
      title: "Consistent Self-Reflection",
      description: "Your regular reflection practice demonstrates commitment to personal growth.",
      confidence: 85,
      trend: "up",
    })
  }

  if (allText.includes("work") || allText.includes("job")) {
    insights.push({
      type: "pattern",
      title: "Work-Life Balance Focus",
      description: "Consider setting clearer boundaries between work and personal time.",
      confidence: 75,
      trend: "stable",
    })
  }

  if (allText.includes("stress") || allText.includes("busy")) {
    insights.push({
      type: "suggestion",
      title: "Mindfulness Opportunity",
      description: "Incorporating mindfulness practices could help manage stress levels.",
      confidence: 80,
      trend: "up",
    })
  }

  await writeLog("ai", "info", "Using fallback comprehensive insights", {
    insight_count: insights.length,
    user_id: userId,
  })
  return insights.slice(0, 4)
}

export function calculateWellnessScores(reflections: any[]) {
  if (!reflections || reflections.length === 0) {
    return { mood: 50, focus: 50, wellness: 50 }
  }

  const allText = reflections
    .map((r) => `${r.topic} ${r.summary} ${r.reflection}`)
    .join(" ")
    .toLowerCase()

  const positiveWords = [
    "happy",
    "good",
    "great",
    "excellent",
    "wonderful",
    "grateful",
    "joy",
    "love",
    "peaceful",
    "calm",
  ]
  const negativeWords = [
    "sad",
    "bad",
    "terrible",
    "stressed",
    "worried",
    "anxious",
    "frustrated",
    "angry",
    "tired",
    "overwhelmed",
  ]
  const focusWords = ["focused", "clear", "productive", "accomplished", "completed", "achieved", "goal", "success"]

  const posCount = positiveWords.filter((word) => allText.includes(word)).length
  const negCount = negativeWords.filter((word) => allText.includes(word)).length
  const focusCount = focusWords.filter((word) => allText.includes(word)).length

  const moodScore = Math.max(30, Math.min(95, 60 + (posCount - negCount) * 8))
  const focusScore = Math.max(30, Math.min(95, 50 + focusCount * 10))
  const wellnessScore = Math.round((moodScore + focusScore) / 2)

  return {
    mood: moodScore,
    focus: focusScore,
    wellness: wellnessScore,
  }
}
