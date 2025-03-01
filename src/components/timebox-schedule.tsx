"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GripVertical, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface ScheduleEvent {
  id: string;
  startTime: number;
  duration: number;
  activity: string;
}

interface TimeboxScheduleProps {
  schedule: ScheduleEvent[];
  setSchedule: (schedule: ScheduleEvent[]) => void;
  dayDuration: { start: string; end: string };
}

export function TimeboxSchedule({
  schedule,
  setSchedule,
  dayDuration,
}: TimeboxScheduleProps) {
  const [draggedEvent, setDraggedEvent] = useState<ScheduleEvent | null>(null);
  const [newEventId, setNewEventId] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement>>({});

  // Generate time slots based on day duration settings
  const startHour = Number.parseInt(dayDuration.start.split(":")[0]);
  let endHour = Number.parseInt(dayDuration.end.split(":")[0]);

  // Handle midnight (00:00) as 24:00 for proper time slot calculation
  if (endHour === 0) {
    endHour = 24;
  }

  const timeSlots = Array.from(
    { length: endHour - startHour },
    (_, i) => i + startHour,
  );

  const updateActivity = (id: string, activity: string) => {
    const newSchedule = schedule.map((event) =>
      event.id === id ? { ...event, activity } : event,
    );
    setSchedule(newSchedule);
  };

  const deleteEvent = (id: string) => {
    setSchedule(schedule.filter((event) => event.id !== id));
  };

  useEffect(() => {
    // Focus the input of the newly created event
    if (newEventId && inputRefs.current[newEventId]) {
      inputRefs.current[newEventId].focus();
      // Reset newEventId after focusing
      setNewEventId(null);
    }
  }, [newEventId]);

  const createEvent = (startTime: number, duration: number) => {
    // Check if the event is within bounds
    const adjustedDuration =
      startTime + duration > endHour
        ? Math.max(1, endHour - startTime)
        : duration;

    const id = `event-${Date.now()}`;
    const newEvent = {
      id,
      startTime,
      duration: adjustedDuration,
      activity: "",
    };
    setSchedule([...schedule, newEvent]);
    setNewEventId(id);
  };

  const moveEvent = (id: string, newStartTime: number) => {
    const eventToMove = schedule.find((event) => event.id === id);
    if (!eventToMove) return;

    // Check if the event would extend beyond the day duration
    let checkEndHour = endHour;
    if (checkEndHour === 0) {
      checkEndHour = 24; // Handle midnight for boundary checks
    }

    if (newStartTime + eventToMove.duration > checkEndHour) {
      return; // Don't allow moving if it would extend beyond end time
    }

    const wouldOverlap = schedule.some((event) => {
      if (event.id === id) return false;

      const eventEnd = event.startTime + event.duration - 1;
      const newEventEnd = newStartTime + eventToMove.duration - 1;

      return (
        (newStartTime >= event.startTime && newStartTime <= eventEnd) ||
        (newEventEnd >= event.startTime && newEventEnd <= eventEnd) ||
        (newStartTime <= event.startTime && newEventEnd >= eventEnd)
      );
    });

    if (!wouldOverlap) {
      const newSchedule = schedule.map((event) =>
        event.id === id ? { ...event, startTime: newStartTime } : event,
      );
      setSchedule(newSchedule);
    }
  };

  const getEventAtSlot = (time: number) => {
    return schedule.find((event) => event.startTime === time);
  };

  const isPartOfEvent = (time: number) => {
    return schedule.find((event) => {
      const eventEnd = event.startTime + event.duration - 1;
      return time > event.startTime && time <= eventEnd;
    });
  };

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
      {timeSlots.map((time) => {
        const event = getEventAtSlot(time);
        const partOfEvent = isPartOfEvent(time);

        if (partOfEvent) return null;

        if (event) {
          // Calculate height including margins for multi-hour events
          // Each hour slot is 42px tall with 8px margin (mb-2)
          // For multi-hour events, we need to include the accumulated margins
          const hourHeight = 42;
          const marginHeight = 8; // equivalent to mb-2
          const totalHeight =
            hourHeight * event.duration + marginHeight * (event.duration - 1); // Include cumulative internal margins

          return (
            <div
              key={event.id}
              className="relative mb-2"
              style={{
                height: `${totalHeight}px`,
              }}
            >
              <div className="absolute top-0 left-0 w-8 pt-2 text-right text-gray-500 text-sm">
                {time}
              </div>

              <div
                data-event-id={event.id}
                className="group ml-11 flex h-full flex-col overflow-hidden rounded-md border border-red-200 bg-red-50 text-red-800"
              >
                <div
                  className="flex cursor-move items-center bg-red-100 p-2"
                  draggable="true"
                  onDragStart={(e) => {
                    setDraggedEvent(event);
                    // Add drag image to improve dragging experience
                    if (e.dataTransfer) {
                      e.dataTransfer.effectAllowed = "move";
                      // Set the drag ghost image (optional)
                      try {
                        const dragGhost = document.createElement("div");
                        dragGhost.textContent = event.activity || "Event";
                        dragGhost.style.padding = "4px 8px";
                        dragGhost.style.background = "rgba(254, 226, 226, 0.9)";
                        dragGhost.style.border = "1px solid rgb(254, 202, 202)";
                        dragGhost.style.borderRadius = "4px";
                        dragGhost.style.position = "absolute";
                        dragGhost.style.top = "-1000px";
                        document.body.appendChild(dragGhost);
                        e.dataTransfer.setDragImage(dragGhost, 0, 0);
                        // Clean up after dragging
                        setTimeout(
                          () => document.body.removeChild(dragGhost),
                          0,
                        );
                      } catch {
                        // Fallback if custom drag image fails
                      }
                    }
                  }}
                  onDragEnd={() => setDraggedEvent(null)}
                >
                  <GripVertical className="mr-2 h-4 w-4 text-red-600" />
                  <Input
                    ref={(el) => {
                      if (el) inputRefs.current[event.id] = el;
                    }}
                    value={event.activity}
                    onChange={(e) => updateActivity(event.id, e.target.value)}
                    placeholder="Add activity..."
                    className="h-auto flex-1 rounded-none border-0 bg-transparent p-0 text-red-800 shadow-none focus-visible:ring-0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-600 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => deleteEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Fill the remaining space */}
                <div className="flex-1 bg-red-100" />
              </div>
            </div>
          );
        }
        return (
          <div
            key={`empty-${time}`}
            className="relative mb-2"
            style={{
              height: "42px", // Match the one-hour event height
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (draggedEvent) {
                e.currentTarget.classList.add("bg-gray-100");
                // Show a visual indicator that the item can be dropped here
                e.currentTarget.style.boxShadow =
                  "0 0 0 2px rgba(59, 130, 246, 0.5)";
              }
            }}
            onDragLeave={(e) => {
              if (draggedEvent) {
                e.currentTarget.classList.remove("bg-gray-100");
                e.currentTarget.style.boxShadow = "";
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              if (draggedEvent) {
                e.currentTarget.classList.add("bg-gray-100");
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("bg-gray-100");
              e.currentTarget.style.boxShadow = "";
              if (draggedEvent) {
                moveEvent(draggedEvent.id, time);
              }
            }}
          >
            <div className="absolute top-0 left-0 w-8 pt-2 text-right text-gray-500 text-sm">
              {time}
            </div>

            <div
              className="ml-11 flex h-full flex-col rounded-md border border-gray-200 border-dashed bg-transparent hover:border-gray-400 hover:bg-gray-50"
              onClick={() => createEvent(time, 1)}
              onKeyDown={(e) => {
                // Allow creating an event with Enter or Space key
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  createEvent(time, 1);
                }
              }}
              tabIndex={0}
              // biome-ignore lint/a11y/noRedundantRoles: Using div with role for semantic meaning
              // biome-ignore lint/a11y/useSemanticElements: <explanation>
              role="button"
              aria-label={`Add event at ${time}:00`}
            >
              <div className="flex h-full cursor-pointer items-center justify-center text-gray-400 text-sm">
                + Add event
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
