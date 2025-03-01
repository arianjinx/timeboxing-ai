"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ScheduleEvent {
  id: string
  startTime: number
  duration: number
  activity: string
}

interface TimeboxScheduleProps {
  schedule: ScheduleEvent[]
  setSchedule: (schedule: ScheduleEvent[]) => void
}

export function TimeboxSchedule({ schedule, setSchedule }: TimeboxScheduleProps) {
  const [draggedEvent, setDraggedEvent] = useState<ScheduleEvent | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [editingEvent, setEditingEvent] = useState<string | null>(null)
  const [newEventStart, setNewEventStart] = useState<number | null>(null)
  const [newEventDuration, setNewEventDuration] = useState(1)

  // Generate time slots from 5am to 9pm
  const timeSlots = Array.from({ length: 17 }, (_, i) => i + 5)

  const updateActivity = (id: string, activity: string) => {
    const newSchedule = schedule.map((event) => (event.id === id ? { ...event, activity } : event))
    setSchedule(newSchedule)
  }

  const deleteEvent = (id: string) => {
    setSchedule(schedule.filter((event) => event.id !== id))
  }

  const extendEvent = (id: string, newDuration: number) => {
    if (newDuration < 1) return

    const newSchedule = schedule.map((event) => (event.id === id ? { ...event, duration: newDuration } : event))
    setSchedule(newSchedule)
  }

  const createEvent = (startTime: number, duration: number) => {
    const newEvent = {
      id: `event-${Date.now()}`,
      startTime,
      duration,
      activity: "",
    }
    setSchedule([...schedule, newEvent])
    setEditingEvent(newEvent.id)
    setNewEventStart(null)
  }

  const moveEvent = (id: string, newStartTime: number) => {
    const eventToMove = schedule.find((event) => event.id === id)
    if (!eventToMove) return

    const wouldOverlap = schedule.some((event) => {
      if (event.id === id) return false

      const eventEnd = event.startTime + event.duration - 1
      const newEventEnd = newStartTime + eventToMove.duration - 1

      return (
        (newStartTime >= event.startTime && newStartTime <= eventEnd) ||
        (newEventEnd >= event.startTime && newEventEnd <= eventEnd) ||
        (newStartTime <= event.startTime && newEventEnd >= eventEnd)
      )
    })

    if (!wouldOverlap) {
      const newSchedule = schedule.map((event) => (event.id === id ? { ...event, startTime: newStartTime } : event))
      setSchedule(newSchedule)
    }
  }

  const getEventAtSlot = (time: number) => {
    return schedule.find((event) => event.startTime === time)
  }

  const isPartOfEvent = (time: number) => {
    return schedule.find((event) => {
      const eventEnd = event.startTime + event.duration - 1
      return time > event.startTime && time <= eventEnd
    })
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)] pr-2">
      {timeSlots.map((time) => {
        const event = getEventAtSlot(time)
        const partOfEvent = isPartOfEvent(time)

        if (partOfEvent) return null

        if (event) {
          return (
            <div
              key={event.id}
              className="relative"
              style={{
                height: `${event.duration * 42}px`,
                marginBottom: "8px",
              }}
            >
              <div className="absolute left-0 top-0 w-8 text-right text-sm text-gray-500 pt-2">{time}</div>

              <div
                className={`ml-11 flex flex-col bg-red-50 text-red-800 border border-red-200 rounded-md overflow-hidden h-full group`}
              >
                <div
                  className="flex items-center p-2 bg-red-100 cursor-move"
                  draggable
                  onDragStart={() => setDraggedEvent(event)}
                  onDragEnd={() => setDraggedEvent(null)}
                >
                  <GripVertical className="w-4 h-4 mr-2 text-red-600" />
                  <Input
                    value={event.activity}
                    onChange={(e) => updateActivity(event.id, e.target.value)}
                    placeholder="Add activity..."
                    className="flex-1 border-0 bg-transparent p-0 h-auto focus-visible:ring-0 text-red-800"
                    onFocus={() => setEditingEvent(event.id)}
                    onBlur={() => setEditingEvent(null)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex-1"></div>

                <div
                  className="h-2 bg-red-200 cursor-ns-resize hover:bg-red-300 transition-colors"
                  onMouseDown={() => setIsResizing(true)}
                  onMouseUp={() => setIsResizing(false)}
                  onMouseLeave={() => isResizing && setIsResizing(false)}
                  onMouseMove={(e) => {
                    if (isResizing) {
                      const rect = e.currentTarget.parentElement?.getBoundingClientRect()
                      if (rect) {
                        const additionalHeight = Math.round((e.clientY - rect.bottom + 10) / 42)
                        if (additionalHeight !== 0) {
                          extendEvent(event.id, event.duration + additionalHeight)
                          setIsResizing(false)
                        }
                      }
                    }
                  }}
                ></div>
              </div>
            </div>
          )
        } else {
          return (
            <div
              key={`empty-${time}`}
              className="flex items-center gap-3 h-10 mb-2"
              onDragOver={(e) => {
                e.preventDefault()
                if (draggedEvent) {
                  e.currentTarget.classList.add("bg-gray-100")
                }
              }}
              onDragLeave={(e) => {
                if (draggedEvent) {
                  e.currentTarget.classList.remove("bg-gray-100")
                }
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.currentTarget.classList.remove("bg-gray-100")
                if (draggedEvent) {
                  moveEvent(draggedEvent.id, time)
                }
              }}
              onClick={() => setNewEventStart(time)}
            >
              <div className="w-8 text-right text-sm text-gray-500">{time}</div>
              {newEventStart === time ? (
                <div className="flex-1 flex items-center gap-2">
                  <Select
                    value={newEventDuration.toString()}
                    onValueChange={(value) => setNewEventDuration(Number.parseInt(value))}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => createEvent(time, newEventDuration)}>Add</Button>
                  <Button variant="outline" onClick={() => setNewEventStart(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex-1 h-full border border-gray-200 border-dashed rounded-md hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center text-sm text-gray-400">
                  + Add event
                </div>
              )}
            </div>
          )
        }
      })}
    </div>
  )
}

