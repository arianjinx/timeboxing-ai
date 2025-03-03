"use client";

import type { ScheduleItem } from "@/app/dto";
import { addHours, format, startOfDay } from "date-fns";
import moment from "moment";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  type EventPropGetter,
  type View,
  momentLocalizer,
} from "react-big-calendar";
import type { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";

import { Button } from "@/components/ui/button";
// Import ShadCN UI components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const localizer = momentLocalizer(moment); // or globalizeLocalizer

// Create the DnD Calendar
const DnDCalendar = withDragAndDrop(Calendar);

// Define our own types that won't conflict with any existing declarations
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  activityType: ScheduleItem["activityType"];
  resource?: ScheduleItem;
}

interface BigCalendarScheduleProps {
  schedule: ScheduleItem[];
  setSchedule: (schedule: ScheduleItem[]) => void;
  dayDuration: { start: string; end: string };
  date?: Date;
  setDate?: (date: Date) => void;
}

// Define toolbar props type
interface ToolbarProps {
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  label: string;
  onView?: (view: View) => void;
  view?: View;
}

// Create custom formatter for the agenda view header to show the date in the desired format
const agendaHeaderFormat = ({ start }: { start: Date; end: Date }) => {
  return format(start, "EEEE, MMMM d, yyyy");
};

// Custom navigation components
const CustomToolbar = (toolbar: ToolbarProps) => {
  const switchToDay = () => {
    if (toolbar.onView) {
      toolbar.onView("day");
    }
  };

  const switchToAgenda = () => {
    if (toolbar.onView) {
      toolbar.onView("agenda");
    }
  };

  return (
    <div className="mb-4 flex items-center justify-between px-2">
      <span className="font-medium">&nbsp;</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={switchToDay}
          className={`rounded-md px-3 py-1 text-sm ${
            toolbar.view === "day"
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-gray-100"
          }`}
        >
          Day
        </button>
        <button
          type="button"
          onClick={switchToAgenda}
          className={`rounded-md px-3 py-1 text-sm ${
            toolbar.view === "agenda"
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-gray-100"
          }`}
        >
          Agenda
        </button>
      </div>
    </div>
  );
};

export function BigCalendarSchedule({
  schedule,
  setSchedule,
  dayDuration,
  date,
  setDate,
}: BigCalendarScheduleProps) {
  // State to track currently selected event for deletion
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  // Add state for dialog visibility and input value
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activityInput, setActivityInput] = useState("");

  // Convert the startTime and duration to Date objects for React Big Calendar
  const calendarEvents = useMemo(() => {
    if (!schedule || schedule.length === 0) {
      return []; // Return empty array if schedule is empty
    }

    const baseDate = startOfDay(new Date());

    // Get time boundaries for filtering
    const [startHours] = dayDuration.start.split(":").map(Number);
    let [endHours] = dayDuration.end.split(":").map(Number);
    if (endHours === 0) endHours = 24; // Handle midnight as 24:00

    // Instead of filtering events completely, adjust them to fit within the day boundaries
    return schedule.map((item) => {
      // Ensure startTime is within valid bounds after dayDuration changes
      const adjustedStartTime = Math.max(
        startHours,
        Math.min(endHours - 0.5, item.startTime),
      );

      // Ensure duration is valid (min 0.5, max to fit within bounds)
      const maxPossibleDuration = endHours - adjustedStartTime;
      const adjustedDuration = Math.min(
        maxPossibleDuration,
        Math.max(0.5, item.duration),
      );

      // Create start date by adding hours to base date
      const start = addHours(baseDate, adjustedStartTime);
      // Create end date by adding duration to start date
      const end = addHours(start, adjustedDuration);

      return {
        id: item.id,
        title: item.activity || "Untitled Event",
        start,
        end,
        activityType: item.activityType,
        resource: item, // Store the original item as a resource
      };
    });
  }, [schedule, dayDuration]);

  // Get color classes based on activity type
  const getEventStyles: EventPropGetter<object> = useCallback((event) => {
    // We need to safely access properties from the raw event object
    const calEvent = event as unknown as CalendarEvent;
    const activityType = calEvent?.activityType;

    // Use stronger, more visible colors
    switch (activityType) {
      case "top-goal":
        return {
          style: {
            backgroundColor: "#fecaca", // red-200
            borderLeft: "4px solid #ef4444", // red-500
            color: "#991b1b", // red-800
          },
        };
      case "leisure":
        return {
          style: {
            backgroundColor: "#e9d5ff", // purple-200
            borderLeft: "4px solid #a855f7", // purple-500
            color: "#6b21a8", // purple-800
          },
        };
      case "physical":
        return {
          style: {
            backgroundColor: "#bbf7d0", // green-200
            borderLeft: "4px solid #22c55e", // green-500
            color: "#166534", // green-800
          },
        };
      default:
        return {
          style: {
            backgroundColor: "#bfdbfe", // blue-200
            borderLeft: "4px solid #3b82f6", // blue-500
            color: "#1e40af", // blue-800
          },
        };
    }
  }, []);

  // Handle event drag & drop
  const onEventDrop = useCallback(
    (args: EventInteractionArgs<object>) => {
      // Cast the args properly
      const start = args.start as Date;
      const end = args.end as Date;
      const eventObj = args.event as unknown as CalendarEvent;

      // Calculate hours and duration with support for half hours
      const startHour = start.getHours() + (start.getMinutes() >= 30 ? 0.5 : 0);
      const endHour = end.getHours() + (end.getMinutes() >= 30 ? 0.5 : 0);

      // Prevent events with the same start and end time
      if (startHour === endHour) {
        return; // Don't allow events with zero duration
      }

      const duration = Math.max(0.5, endHour - startHour); // Minimum duration of 30 minutes

      // Get time boundaries
      const [dayStartHour] = dayDuration.start.split(":").map(Number);
      let [dayEndHour] = dayDuration.end.split(":").map(Number);
      if (dayEndHour === 0) dayEndHour = 24; // Handle midnight as 24:00

      // Check if the event would be outside day boundaries
      if (startHour < dayStartHour || endHour > dayEndHour) {
        return; // Don't allow the move if it would go outside the day
      }

      // Find the original event
      const originalEvent = schedule.find((item) => item.id === eventObj.id);
      if (!originalEvent) return;

      // Check if the event would conflict with other events
      const wouldOverlap = schedule.some((item) => {
        if (item.id === eventObj.id) return false;

        const itemEnd = item.startTime + item.duration;
        return (
          (startHour >= item.startTime && startHour < itemEnd) ||
          (endHour > item.startTime && endHour <= itemEnd) ||
          (startHour <= item.startTime && endHour >= itemEnd)
        );
      });

      if (wouldOverlap) {
        return; // Don't allow the move if it would overlap
      }

      // Update the schedule
      const updatedSchedule = schedule.map((item) => {
        if (item.id === eventObj.id) {
          return {
            ...item,
            startTime: startHour,
            duration,
          };
        }
        return item;
      });

      setSchedule(updatedSchedule);
    },
    [schedule, setSchedule, dayDuration],
  );

  // Handle event resize
  const onEventResize = useCallback(
    (args: EventInteractionArgs<object>) => {
      // Cast the args properly
      const start = args.start as Date;
      const end = args.end as Date;
      const eventObj = args.event as unknown as CalendarEvent;

      // Calculate hours and duration with support for half hours
      const startHour = start.getHours() + (start.getMinutes() >= 30 ? 0.5 : 0);
      const endHour = end.getHours() + (end.getMinutes() >= 30 ? 0.5 : 0);

      // Prevent events with the same start and end time
      if (startHour === endHour) {
        return; // Don't allow events with zero duration
      }

      // Get time boundaries
      const [dayStartHour] = dayDuration.start.split(":").map(Number);
      let [dayEndHour] = dayDuration.end.split(":").map(Number);
      if (dayEndHour === 0) dayEndHour = 24; // Handle midnight as 24:00

      // Check if the event would be outside day boundaries
      if (startHour < dayStartHour || endHour > dayEndHour) {
        return; // Don't allow the resize if it would go outside the day
      }

      // Enforce minimum duration of 30 minutes (0.5 hours)
      const duration = Math.max(0.5, endHour - startHour);

      // Find the original event
      const originalEvent = schedule.find((item) => item.id === eventObj.id);
      if (!originalEvent) return;

      // Check if the resize would conflict with other events
      const wouldOverlap = schedule.some((item) => {
        if (item.id === eventObj.id) return false;

        const itemEnd = item.startTime + item.duration;
        return (
          (startHour >= item.startTime && startHour < itemEnd) ||
          (endHour > item.startTime && endHour <= itemEnd) ||
          (startHour <= item.startTime && endHour >= itemEnd)
        );
      });

      if (wouldOverlap) {
        return; // Don't allow the resize if it would overlap
      }

      // Update the schedule
      const updatedSchedule = schedule.map((item) => {
        if (item.id === eventObj.id) {
          return {
            ...item,
            startTime: startHour,
            duration,
          };
        }
        return item;
      });

      setSchedule(updatedSchedule);
    },
    [schedule, setSchedule, dayDuration],
  );

  // Handle creating a new event
  const onSelectSlot = useCallback(
    (slotInfo: { start: Date; end: Date; slots: Date[] }) => {
      const start = slotInfo.start;
      const end = slotInfo.end;

      // Support half-hour precision
      const startHour = start.getHours() + (start.getMinutes() >= 30 ? 0.5 : 0);
      const endHour = end.getHours() + (end.getMinutes() >= 30 ? 0.5 : 0);

      // Prevent events with the same start and end time
      if (startHour === endHour) {
        return; // Don't allow events with zero duration
      }

      // Enforce minimum duration
      const duration = Math.max(0.5, endHour - startHour);

      // Get time boundaries
      const [dayStartHour] = dayDuration.start.split(":").map(Number);
      let [dayEndHour] = dayDuration.end.split(":").map(Number);
      if (dayEndHour === 0) dayEndHour = 24; // Handle midnight as 24:00

      // Check if the new event would be outside the day boundaries
      if (startHour < dayStartHour || endHour > dayEndHour) {
        return; // Don't allow creating if outside boundaries
      }

      // Check if the new event would overlap with existing events
      const wouldOverlap = schedule.some((item) => {
        const itemEnd = item.startTime + item.duration;
        return (
          (startHour >= item.startTime && startHour < itemEnd) ||
          (endHour > item.startTime && endHour <= itemEnd) ||
          (startHour <= item.startTime && endHour >= itemEnd)
        );
      });

      if (wouldOverlap) {
        return; // Don't allow creating if it would overlap
      }

      // Create a new event
      const newEvent: ScheduleItem = {
        id: `event-${Date.now()}`,
        startTime: startHour,
        duration,
        activity: "",
        activityType: "default",
      };

      setSchedule([...schedule, newEvent]);
    },
    [schedule, setSchedule, dayDuration],
  );

  // Handle double clicking on an event
  const onDoubleClickEvent = useCallback((eventObj: object) => {
    const event = eventObj as unknown as CalendarEvent;
    setSelectedEvent(event);
    setActivityInput(event.title); // Set the initial input value
    setDialogOpen(true); // Open the dialog
  }, []);

  // Add back single-click event selection (for deletion)
  const onSelectEvent = useCallback((eventObj: object) => {
    const event = eventObj as unknown as CalendarEvent;
    setSelectedEvent(event);
  }, []);

  // Handle save button click in dialog
  const handleSaveActivity = useCallback(() => {
    if (!selectedEvent) return;

    // Update the schedule
    const updatedSchedule = schedule.map((item) => {
      if (item.id === selectedEvent.id) {
        return {
          ...item,
          activity: activityInput,
        };
      }
      return item;
    });

    setSchedule(updatedSchedule);
    setDialogOpen(false); // Close the dialog
  }, [selectedEvent, activityInput, schedule, setSchedule]);

  // Add keyboard listener for delete key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedEvent && (e.key === "Delete" || e.key === "Backspace")) {
        const updatedSchedule = schedule.filter(
          (item) => item.id !== selectedEvent.id,
        );
        setSchedule(updatedSchedule);
        setSelectedEvent(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedEvent, schedule, setSchedule]);

  // Set up min and max times for the calendar
  const minTime = useMemo(() => {
    const [hours, minutes] = dayDuration.start.split(":").map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    return date;
  }, [dayDuration.start]);

  const maxTime = useMemo(() => {
    const [hours, minutes] = dayDuration.end.split(":").map(Number);
    // Create a new date object for the max time
    const date = new Date();

    // Handle midnight (00:00) properly
    if (hours === 0 && minutes === 0) {
      // Set to 23:59 instead of trying to represent 24:00
      date.setHours(23);
      date.setMinutes(59);
    } else {
      date.setHours(hours);
      date.setMinutes(minutes);
    }

    // Ensure maxTime is at least 1 hour after minTime to avoid invalid array length error
    const minHours = Number.parseInt(dayDuration.start.split(":")[0], 10);
    const minMinutes = Number.parseInt(dayDuration.start.split(":")[1], 10);

    if (
      date.getHours() < minHours ||
      (date.getHours() === minHours && date.getMinutes() <= minMinutes)
    ) {
      // If max time is before or equal to min time, set it to min time + 1 hour
      date.setHours(minHours + 1);
      date.setMinutes(minMinutes);
    }

    return date;
  }, [dayDuration.start, dayDuration.end]);

  // Create a working time range that's valid for the calendar
  const ensureValidTimeRange = useCallback(() => {
    const [startHours, startMinutes] = dayDuration.start.split(":").map(Number);
    const [endHours, endMinutes] = dayDuration.end.split(":").map(Number);

    // Convert to minutes for easier comparison
    const startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;

    // If end is 00:00, treat it as 24:00
    if (endHours === 0 && endMinutes === 0) {
      endTotalMinutes = 24 * 60;
    }

    // If the difference is less than 60 minutes (1 hour)
    if (endTotalMinutes - startTotalMinutes < 60) {
      console.warn("Day duration too short, adjusting to minimum 1 hour");

      // Create a valid 1-hour range
      const newEndHours = startHours + 1;

      return {
        validMin: minTime,
        validMax: (() => {
          const date = new Date();
          date.setHours(newEndHours);
          date.setMinutes(startMinutes);
          return date;
        })(),
      };
    }

    return { validMin: minTime, validMax: maxTime };
  }, [dayDuration, minTime, maxTime]);

  // Get validated time range
  const { validMin, validMax } = ensureValidTimeRange();

  // Validate the schedule to ensure all events fit within the day duration
  useEffect(() => {
    const startTimeHours = Number.parseInt(dayDuration.start.split(":")[0], 10);
    // For end time, handle midnight (00:00) as 24:00 for comparison
    let endTimeHours = Number.parseInt(dayDuration.end.split(":")[0], 10);
    if (endTimeHours === 0) endTimeHours = 24;

    const hasInvalidEvents = schedule.some((item) => {
      const eventEnd = item.startTime + item.duration;
      return item.startTime < startTimeHours || eventEnd > endTimeHours;
    });

    if (hasInvalidEvents) {
      console.warn(
        "Some events fall outside the day duration and may not display correctly",
      );

      // Automatically adjust events to fit within new boundaries
      const adjustedSchedule = schedule.map((item) => {
        let startTime = item.startTime;
        let duration = item.duration;

        // Adjust start time if it's before the day start
        if (startTime < startTimeHours) {
          startTime = startTimeHours;
        }

        // Adjust duration if it extends past the day end
        const eventEnd = startTime + duration;
        if (eventEnd > endTimeHours) {
          duration = Math.max(0.5, endTimeHours - startTime);
        }

        return {
          ...item,
          startTime,
          duration,
        };
      });

      // Only update if there are actual changes
      if (JSON.stringify(adjustedSchedule) !== JSON.stringify(schedule)) {
        setSchedule(adjustedSchedule);
      }
    }
  }, [schedule, dayDuration, setSchedule]);

  return (
    <div className="h-[calc(100vh-200px)] overflow-hidden print:h-full">
      <DnDCalendar
        localizer={localizer}
        events={calendarEvents}
        defaultView="day"
        views={{ day: true, agenda: true }}
        date={date || new Date()}
        onNavigate={(newDate) => setDate?.(newDate)}
        step={30} // Keep 30-minute steps for events
        timeslots={2} // Use 2 slots per "step" (which gives us 30 mins per slot)
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
        resizable
        selectable
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        onDoubleClickEvent={onDoubleClickEvent}
        min={validMin}
        max={validMax}
        eventPropGetter={getEventStyles}
        components={{
          toolbar: CustomToolbar,
        }}
        formats={{
          timeGutterFormat: (date: Date) => format(date, "HH:mm"),
          eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
          dayHeaderFormat: (date: Date) => format(date, "EEEE, MMMM d, yyyy"),
          dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, "EEEE, MMMM d, yyyy")} - ${format(end, "EEEE, MMMM d, yyyy")}`,
          agendaHeaderFormat,
          agendaDateFormat: (date: Date) => format(date, "EEEE, MMMM d, yyyy"),
          agendaTimeFormat: (date: Date) => format(date, "HH:mm"),
          agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`,
        }}
        // Add custom CSS to style the time slots for hourly visual guidelines
        className="rbc-custom-calendar"
        dayLayoutAlgorithm="no-overlap" // Add this to prevent events from stretching
      />

      {/* Edit Activity Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Activity</DialogTitle>
            <DialogDescription>
              Update the name of your scheduled activity.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="activity" className="text-right">
                Activity
              </Label>
              <Input
                id="activity"
                value={activityInput}
                onChange={(e) => setActivityInput(e.target.value)}
                className="col-span-3"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveActivity}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom styles for calendar time slots */}
      <style jsx global>{`
        /* Highlight full hour slots with darker lines */
        .rbc-custom-calendar .rbc-time-header-content {
          border-left: 1px solid #ddd;
        }
        
        .rbc-custom-calendar .rbc-event-content {
          font-weight: 500;
          font-size: 0.7rem;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          word-break: break-word;
        }
        
        /* Adjust selection styling - make border more neutral */
        .rbc-custom-calendar .rbc-event.rbc-selected {
          box-shadow: 0 0 0 2px #cbd5e1 !important; /* Changed to a lighter, more neutral gray color */
          outline: none !important; /* Remove any default outline */
          border-color: #cbd5e1 !important; /* Ensure border is also neutral */
        }
        
        /* Remove any blue focus outlines on selected events */
        .rbc-custom-calendar .rbc-event:focus {
          outline: none !important;
        }
        
        /* Hide the current time indicator */
        .rbc-custom-calendar .rbc-current-time-indicator {
          display: none !important;
        }
        
        // /* Increase the size of 30-minute blocks */
        .rbc-custom-calendar .rbc-timeslot-group {
          min-height: 85px;
        }
        
        // /* Ensure time label in gutter is smaller too */
        .rbc-custom-calendar .rbc-time-gutter .rbc-timeslot-group .rbc-label {
          font-size: 0.75rem;
        }
        
        // /* Make agenda view text smaller too */
        .rbc-custom-calendar .rbc-agenda-view table.rbc-agenda-table tbody > tr > td {
          font-size: 0.8rem;
          padding: 4px 6px;
        }
        
        /* Hide date column in agenda view */
        .rbc-agenda-view table.rbc-agenda-table th:first-child,
        .rbc-agenda-view table.rbc-agenda-table .rbc-agenda-date-cell {
          display: none;
        }
      `}</style>
    </div>
  );
}
