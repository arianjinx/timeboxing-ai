"use client";

import type { ScheduleItem } from "@/app/dto";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GripVertical, Minus, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface TimeboxScheduleProps {
  schedule: ScheduleItem[];
  setSchedule: (schedule: ScheduleItem[]) => void;
  dayDuration: { start: string; end: string };
  topGoals?: string[]; // Add topGoals prop to identify top goal activities
}

export function TimeboxSchedule({
  schedule,
  setSchedule,
  dayDuration,
}: TimeboxScheduleProps) {
  const [draggedEvent, setDraggedEvent] = useState<ScheduleItem | null>(null);
  const [newEventId, setNewEventId] = useState<string | null>(null);
  const [showDurationSelect, setShowDurationSelect] = useState<number | null>(
    null,
  );
  const inputRefs = useRef<Record<string, HTMLTextAreaElement>>({});
  const durationSelectRef = useRef<HTMLDivElement>(null);

  // Get color classes based on activity type
  const getColorClasses = (activityType: ScheduleItem["activityType"]) => {
    switch (activityType) {
      case "top-goal":
        return {
          container: "border-red-200 bg-red-50 text-red-800",
          header: "bg-red-100",
          button: "text-red-600",
          text: "text-red-600",
          resizeButton: "bg-red-100 text-red-700 hover:bg-red-200",
        };
      case "leisure":
        return {
          container: "border-purple-200 bg-purple-50 text-purple-800",
          header: "bg-purple-100",
          button: "text-purple-600",
          text: "text-purple-600",
          resizeButton: "bg-purple-100 text-purple-700 hover:bg-purple-200",
        };
      case "physical":
        return {
          container: "border-green-200 bg-green-50 text-green-800",
          header: "bg-green-100",
          button: "text-green-600",
          text: "text-green-600",
          resizeButton: "bg-green-100 text-green-700 hover:bg-green-200",
        };
      default:
        return {
          container: "border-blue-200 bg-blue-50 text-blue-800",
          header: "bg-blue-100",
          button: "text-blue-600",
          text: "text-blue-600",
          resizeButton: "bg-blue-100 text-blue-700 hover:bg-blue-200",
        };
    }
  };

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

  // Close duration select when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        durationSelectRef.current &&
        !durationSelectRef.current.contains(event.target as Node)
      ) {
        setShowDurationSelect(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const createEvent = (startTime: number, duration: number) => {
    // Check if the event is within bounds
    const adjustedDuration =
      startTime + duration > endHour
        ? Math.max(1, endHour - startTime)
        : duration;

    // Check if the new event would overlap with existing events
    const wouldOverlap = schedule.some((event) => {
      const eventEnd = event.startTime + event.duration - 1;
      const newEventEnd = startTime + adjustedDuration - 1;

      return (
        (startTime >= event.startTime && startTime <= eventEnd) ||
        (newEventEnd >= event.startTime && newEventEnd <= eventEnd) ||
        (startTime <= event.startTime && newEventEnd >= eventEnd)
      );
    });

    if (wouldOverlap) {
      // Don't create event if it would overlap
      return;
    }

    const id = `event-${Date.now()}`;
    const newEvent: ScheduleItem = {
      id,
      startTime,
      duration: adjustedDuration,
      activity: "",
      activityType: "default" as const,
    };
    setSchedule([...schedule, newEvent]);
    setNewEventId(id);
    setShowDurationSelect(null);
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

  const resizeEvent = useCallback(
    (id: string, newDuration: number) => {
      // Minimum duration is 1 hour
      if (newDuration < 1) return;

      const eventToResize = schedule.find((event) => event.id === id);
      if (!eventToResize) return;

      // Check if the resized event would extend beyond the day duration
      if (eventToResize.startTime + newDuration > endHour) {
        return; // Don't allow resizing if it would extend beyond end time
      }

      // Check for overlaps
      const wouldOverlap = schedule.some((event) => {
        if (event.id === id) return false;

        const eventEnd = event.startTime + event.duration - 1;
        const newEventEnd = eventToResize.startTime + newDuration - 1;

        return (
          (eventToResize.startTime >= event.startTime &&
            eventToResize.startTime <= eventEnd) ||
          (newEventEnd >= event.startTime && newEventEnd <= eventEnd) ||
          (eventToResize.startTime <= event.startTime &&
            newEventEnd >= eventEnd)
        );
      });

      if (!wouldOverlap) {
        const newSchedule = schedule.map((event) =>
          event.id === id ? { ...event, duration: newDuration } : event,
        );
        setSchedule(newSchedule);
      }
    },
    [schedule, setSchedule, endHour],
  );

  return (
    <div className="max-h-[calc(100vh-200px)] overflow-y-auto pr-2 print:max-h-none print:overflow-visible print:pr-0">
      {timeSlots.map((time) => {
        const event = getEventAtSlot(time);
        const partOfEvent = isPartOfEvent(time);

        if (partOfEvent) return null;

        if (event) {
          // Get color classes based on activity type
          const colorClasses = getColorClasses(event.activityType);

          // Remove fixed height calculation and allow for fluid height
          return (
            <div key={event.id} className="relative mb-2">
              <div className="absolute top-0 left-0 w-8 pt-2 text-right text-gray-500 text-sm">
                {time}
              </div>

              <div
                data-event-id={event.id}
                className={`group ml-11 flex flex-col overflow-visible rounded-md border text-red-800 print:rounded-sm ${colorClasses.container}`}
              >
                <div
                  className={`flex cursor-move items-center p-2 print:cursor-default ${colorClasses.header}`}
                  draggable="true"
                  onDragStart={(e) => {
                    setDraggedEvent(event);
                    // Add drag image to improve dragging experience
                    if (e.dataTransfer) {
                      e.dataTransfer.effectAllowed = "move";
                      // Create a more visible and descriptive drag ghost
                      try {
                        const dragGhost = document.createElement("div");
                        dragGhost.textContent = event.activity || "Event";
                        dragGhost.style.padding = "8px 12px";
                        dragGhost.style.background = "rgba(254, 226, 226, 0.9)";
                        dragGhost.style.border = "1px solid rgb(254, 202, 202)";
                        dragGhost.style.borderRadius = "4px";
                        dragGhost.style.position = "absolute";
                        dragGhost.style.top = "-1000px";
                        dragGhost.style.width = "200px";
                        dragGhost.style.overflow = "hidden";
                        dragGhost.style.whiteSpace = "nowrap";
                        dragGhost.style.textOverflow = "ellipsis";
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
                  <GripVertical
                    className={`mr-2 h-4 w-4 print:hidden ${colorClasses.button}`}
                  />
                  <div className="w-full flex-1">
                    <Textarea
                      ref={(el) => {
                        if (el) inputRefs.current[event.id] = el;
                      }}
                      value={event.activity}
                      onChange={(e) => updateActivity(event.id, e.target.value)}
                      placeholder="Add activity..."
                      className={`min-h-auto w-full resize-none rounded-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 print:static print:border-none print:placeholder-transparent print:outline-none ${colorClasses.container.split(" ")[2]}`}
                      readOnly={false}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = "auto";
                        target.style.height = `${target.scrollHeight}px`;
                      }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100 print:hidden ${colorClasses.button}`}
                    onClick={() => deleteEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Fill the remaining space */}
                <div className={`py-1 ${colorClasses.container.split(" ")[1]}`}>
                  {/* Duration indicator and resize buttons */}
                  <div className="flex items-center justify-between px-2">
                    <span className={`text-xs ${colorClasses.text}`}>
                      {event.duration > 1
                        ? `${event.duration} hours`
                        : "1 hour"}
                    </span>
                    <div className="flex items-center gap-1 print:hidden">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-5 w-5 rounded-full hover:bg-red-200 ${colorClasses.resizeButton}`}
                        onClick={() =>
                          resizeEvent(event.id, event.duration - 1)
                        }
                        disabled={event.duration <= 1}
                      >
                        <Minus className="h-3 w-3" />
                        <span className="sr-only">Decrease duration</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className={`h-5 w-5 rounded-full hover:bg-red-200 ${colorClasses.resizeButton}`}
                        onClick={() =>
                          resizeEvent(event.id, event.duration + 1)
                        }
                      >
                        <Plus className="h-3 w-3" />
                        <span className="sr-only">Increase duration</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div
            key={`empty-${time}`}
            className="relative mb-2"
            data-time-slot={time}
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
              onClick={() => setShowDurationSelect(time)}
              onKeyDown={(e) => {
                // Allow creating an event with Enter or Space key
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShowDurationSelect(time);
                }
              }}
              tabIndex={0}
              // biome-ignore lint/a11y/noRedundantRoles: Using div with role for semantic meaning
              // biome-ignore lint/a11y/useSemanticElements: <explanation>
              role="button"
              aria-label={`Add event at ${time}:00`}
            >
              <div className="flex h-full cursor-pointer items-center justify-center text-gray-400 text-sm print:hidden">
                {showDurationSelect === time ? (
                  <div
                    ref={durationSelectRef}
                    className="z-10 flex flex-col rounded-md border border-gray-200 bg-white p-2 shadow-lg"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <div className="mb-1 font-medium text-gray-700">
                      Duration (hours):
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[1, 2, 3, 4].map((hours) => {
                        // Disable options that would go beyond the end time
                        const isDisabled = time + hours > endHour;
                        // Also check for overlap with existing events
                        const wouldOverlap = schedule.some((event) => {
                          if (event.startTime === time) return false;
                          const eventEnd = event.startTime + event.duration - 1;
                          const newEventEnd = time + hours - 1;

                          return (
                            (time < event.startTime &&
                              newEventEnd >= event.startTime) ||
                            (time <= eventEnd && time >= event.startTime)
                          );
                        });

                        return (
                          <button
                            key={hours}
                            type="button"
                            className={`rounded px-2 py-1 text-sm ${
                              isDisabled || wouldOverlap
                                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            }`}
                            onClick={() =>
                              !isDisabled &&
                              !wouldOverlap &&
                              createEvent(time, hours)
                            }
                            disabled={isDisabled || wouldOverlap}
                          >
                            {hours}hr{hours > 1 ? "s" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <span className="flex min-h-[42px] items-center">
                    + Add event
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
