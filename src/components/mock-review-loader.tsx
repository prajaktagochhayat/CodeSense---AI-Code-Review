"use client"

import { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import { ReviewDetail, ReviewDetailData } from "@/components/review-detail"
import { Loader2 } from "lucide-react"

interface MockReviewLoaderProps {
  id: string
}

export function MockReviewLoader({ id }: MockReviewLoaderProps) {
  const [data, setData] = useState<ReviewDetailData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const mockCache = JSON.parse(localStorage.getItem("mockReviews") || "{}")
      const mockData = mockCache[id]
      if (mockData) {
        setData(mockData)
      }
    } catch (err) {
      console.error("Failed to parse local mock review from store:", err)
    } finally {
      setLoading(false)
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  if (!data) {
    notFound()
  }

  return <ReviewDetail data={data} />
}
