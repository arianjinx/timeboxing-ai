"use client";

import { SettingsDialog } from "@/components/settings-dialog";
import { TimeboxSchedule } from "@/components/timebox-schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Settings } from "lucide-react";
import { useState } from "react";

export default function TimeboxApp() {
  const [date] = useState(new Date());
  const [brainDump, setBrainDump] = useState("");
  const [topGoals, setTopGoals] = useState<string[]>(["", "", ""]);
  const [schedule, setSchedule] = useState<
    { id: string; startTime: number; duration: number; activity: string }[]
  >([
    { id: "1", startTime: 6, duration: 1, activity: "Breakfast" },
    { id: "2", startTime: 7, duration: 2, activity: "Evaluate app feature" },
    { id: "3", startTime: 9, duration: 1, activity: "Call Tim" },
    { id: "4", startTime: 11, duration: 1, activity: "Lunch with Lisa" },
    { id: "5", startTime: 13, duration: 1, activity: "Meeting" },
    { id: "6", startTime: 14, duration: 1, activity: "Buy groceries" },
  ]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dayDuration, setDayDuration] = useState({
    start: "05:00",
    end: "21:00",
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      weekday: "long",
    }).format(date);
  };

  const updateTopGoal = (index: number, value: string) => {
    const newGoals = [...topGoals];
    newGoals[index] = value;
    setTopGoals(newGoals);
  };

  const generateSchedule = async () => {
    setIsGenerating(true);
    // In a real app, this would call an API to generate the schedule using AI
    setTimeout(() => {
      // Simulate AI generating a schedule
      const activities = [
        { activity: "Deep work on project", duration: 2 },
        { activity: "Exercise", duration: 1 },
        { activity: "Read book", duration: 1 },
        { activity: "Write article", duration: 2 },
        { activity: "Team meeting", duration: 1 },
        { activity: "Plan tomorrow", duration: 1 },
        { activity: "Review progress", duration: 1 },
      ];

      // Create a new schedule with some multi-hour blocks
      const newSchedule = [...schedule];

      // Add some new activities in empty slots
      const occupiedTimes = new Set(
        schedule.flatMap((event) =>
          Array.from({ length: event.duration }, (_, i) => event.startTime + i),
        ),
      );

      // Find available time slots
      const availableSlots = [];
      // Extract hours from dayDuration.start and dayDuration.end
      const startHour = Number.parseInt(dayDuration.start.split(":")[0]);
      const endHour = Number.parseInt(dayDuration.end.split(":")[0]);

      for (let i = startHour; i < endHour; i++) {
        if (!occupiedTimes.has(i)) {
          availableSlots.push(i);
        }
      }

      // Add 2-3 new activities
      for (let i = 0; i < Math.min(3, availableSlots.length); i++) {
        if (availableSlots.length === 0) break;

        const randomActivityIndex = Math.floor(
          Math.random() * activities.length,
        );
        const activity = activities[randomActivityIndex];
        const startTimeIndex = Math.floor(
          Math.random() * availableSlots.length,
        );
        const startTime = availableSlots[startTimeIndex];

        // Check if we have enough consecutive slots
        let hasEnoughSlots = true;
        for (let j = 0; j < activity.duration; j++) {
          if (!availableSlots.includes(startTime + j)) {
            hasEnoughSlots = false;
            break;
          }
          // Also check if it's within the day duration range
          if (startTime + j >= endHour) {
            hasEnoughSlots = false;
            break;
          }
        }

        if (hasEnoughSlots) {
          newSchedule.push({
            id: `generated-${Date.now()}-${i}`,
            startTime,
            duration: activity.duration,
            activity: activity.activity,
          });

          // Remove used slots
          for (let j = 0; j < activity.duration; j++) {
            const index = availableSlots.indexOf(startTime + j);
            if (index !== -1) {
              availableSlots.splice(index, 1);
            }
          }
        }
      }

      setSchedule(newSchedule);
      setIsGenerating(false);
    }, 1500);
  };

  const generateTopGoals = async () => {
    setIsGenerating(true);
    // In a real app, this would call an API to generate top goals using AI
    setTimeout(() => {
      // Simulate AI generating top goals
      const generatedGoals = [
        "Complete project proposal",
        "Exercise for 30 minutes",
        "Read 20 pages of current book",
      ];
      setTopGoals(generatedGoals);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b p-4 md:p-6">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <h1 className="font-semibold text-xl">Daily Schedule</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </div>

        <div className="grid h-full grid-cols-1 md:grid-cols-2">
          {/* Left Column - Goals and Brain Dump */}
          <div className="border-r p-4 md:p-6">
            <div className="mb-6">
              <p className="mb-1 text-gray-500 text-sm">Day</p>
              <p className="font-medium text-lg">{formatDate(date)}</p>
            </div>

            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-medium">Top Daily Goals</h2>
                <Button
                  onClick={generateTopGoals}
                  disabled={isGenerating}
                  size="sm"
                  className="bg-blue-600 text-white hover:bg-blue-700"
                >
                  Generate with AI
                </Button>
              </div>
              <div className="space-y-2">
                {topGoals.map((goal, index) => (
                  <Input
                    key={index}
                    value={goal}
                    onChange={(e) => updateTopGoal(index, e.target.value)}
                    placeholder={`Goal ${index + 1}`}
                    className="border-gray-300"
                  />
                ))}
              </div>
            </div>

            <div>
              <h2 className="mb-3 font-medium">Brain Dump (To-Do List)</h2>
              <Textarea
                value={brainDump}
                onChange={(e) => setBrainDump(e.target.value)}
                placeholder="Add all your tasks here..."
                className="min-h-[200px] border-gray-300"
              />
            </div>
          </div>

          {/* Right Column - Schedule */}
          <div className="relative p-4 md:p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-medium">Schedule</h2>
              <Button
                onClick={generateSchedule}
                disabled={isGenerating}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isGenerating ? "Generating..." : "Generate with AI"}
              </Button>
            </div>

            <TimeboxSchedule
              schedule={schedule}
              setSchedule={setSchedule}
              dayDuration={dayDuration}
            />
          </div>
        </div>
      </div>

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        dayDuration={dayDuration}
        setDayDuration={setDayDuration}
      />
    </div>
  );
}
