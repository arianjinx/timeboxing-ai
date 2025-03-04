"use client";
import { generateSchedule, generateTopDailyGoals } from "@/app/actions";
import type { ScheduleItem } from "@/app/dto";
import {
  BigCalendarSchedule,
  type BigCalendarScheduleRef,
} from "@/components/big-calendar-schedule";
import { SettingsDialog } from "@/components/settings-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { useIsMounted } from "@/hooks/use-is-mounted";
import {
  AlertCircle,
  Calendar,
  Printer,
  Settings,
  WandSparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function TimeboxingApp() {
  const isMounted = useIsMounted();
  const [date, setDate] = useState(new Date());
  const [brainDump, setBrainDump] = useState("");
  const [topGoals, setTopGoals] = useState<string[]>(["", "", ""]);
  const [name, setName] = useState("");
  const [northStar, setNorthStar] = useState("");
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [coreTime, setCoreTime] = useState({ start: "09:00", end: "17:00" }); // Default core time 9am-5pm
  const [profile, setProfile] = useState("");
  const [hobbies, setHobbies] = useState("");
  const [intermittentFasting, setIntermittentFasting] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dayDuration, setDayDuration] = useState({
    start: "05:00",
    end: "21:00",
  });

  // Track if settings have been loaded
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Add ref for calendar
  const calendarRef = useRef<BigCalendarScheduleRef>(null);

  // Load settings from localStorage on component mount
  useEffect(() => {
    // Load user settings
    const storedName = localStorage.getItem("timebox-name");
    if (storedName) setName(storedName);

    const storedNorthStar = localStorage.getItem("timebox-northStar");
    if (storedNorthStar) setNorthStar(storedNorthStar);

    // Load day duration
    const storedDayDuration = localStorage.getItem("timebox-dayDuration");
    if (storedDayDuration) {
      try {
        const parsedDayDuration = JSON.parse(storedDayDuration);
        setDayDuration(parsedDayDuration);
      } catch (error) {
        console.error("Failed to parse day duration from localStorage", error);
        toast.error("Failed to load saved time settings");
      }
    }

    // Load core time
    const storedCoreTime = localStorage.getItem("timebox-coreTime");
    if (storedCoreTime) {
      try {
        const parsedCoreTime = JSON.parse(storedCoreTime);
        setCoreTime(parsedCoreTime);
      } catch (error) {
        console.error("Failed to parse core time from localStorage", error);
        toast.error("Failed to load saved core time settings");
      }
    }

    const storedProfile = localStorage.getItem("timebox-profile");
    if (storedProfile) setProfile(storedProfile);

    const storedHobbies = localStorage.getItem("timebox-hobbies");
    if (storedHobbies) setHobbies(storedHobbies);

    const storedIntermittentFasting = localStorage.getItem(
      "timebox-intermittentFasting",
    );
    if (storedIntermittentFasting)
      setIntermittentFasting(storedIntermittentFasting === "true");

    // Mark settings as loaded
    setSettingsLoaded(true);

    // Check if essential personalization settings are empty and open settings dialog
    const hasBasicSettings =
      storedName && storedProfile && storedNorthStar && storedHobbies;
    if (!hasBasicSettings) {
      // Delay opening the dialog slightly to ensure the app has fully loaded
      setTimeout(() => {
        setIsSettingsOpen(true);
        toast.info(
          "Please complete your profile for better AI-generated schedules",
          {
            duration: 5000,
          },
        );
      }, 500);
    }
  }, []);

  // Separate useEffect to handle default core time when day duration changes
  useEffect(() => {
    // Only run this effect if there's no stored core time
    if (!localStorage.getItem("timebox-coreTime")) {
      const dayStartHours = Number.parseInt(dayDuration.start.split(":")[0]);
      const dayEndHours = Number.parseInt(dayDuration.end.split(":")[0]);

      // Default core time to start 4 hours after day start and end 4 hours before day end
      // or 9am-5pm if that would be outside the day duration
      const defaultCoreStart = Math.max(9, dayStartHours + 4);
      const defaultCoreEnd = Math.min(
        17,
        dayEndHours - 4 > 0 ? dayEndHours - 4 : dayEndHours - 1,
      );

      setCoreTime({
        start: `${defaultCoreStart.toString().padStart(2, "0")}:00`,
        end: `${defaultCoreEnd.toString().padStart(2, "0")}:00`,
      });
    }
  }, [dayDuration]);

  // Add print-specific styles when component mounts
  useEffect(() => {
    // Add print styles to document head
    const style = document.createElement("style");
    style.innerHTML = `
      @media print {
        @page {
          size: portrait;
          margin: 0.5cm;
        }
        body {
          print-color-adjust: exact;
          -webkit-print-color-adjust: exact;
        }
        .print-show-only-events .print:hidden {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Setup print event listeners for better print experience
    const beforePrint = () => {
      document.body.classList.add("print-show-only-events");
      // We no longer need to switch views here since we do it in our custom print button
    };

    const afterPrint = () => {
      document.body.classList.remove("print-show-only-events");
    };

    window.addEventListener("beforeprint", beforePrint);
    window.addEventListener("afterprint", afterPrint);

    return () => {
      document.head.removeChild(style);
      window.removeEventListener("beforeprint", beforePrint);
      window.removeEventListener("afterprint", afterPrint);
    };
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      weekday: "long",
    }).format(date);
  };

  const generateTopGoalsHandler = async () => {
    setIsGenerating(true);

    try {
      const result = await generateTopDailyGoals({
        northStar,
        brainDump,
        profile,
        hobbies,
      });

      if (result.topGoals && result.topGoals.length > 0) {
        setTopGoals(result.topGoals);
        toast.success("Top goals generated successfully");
        setIsGenerating(false);
        return;
      }
    } catch (error) {
      console.error("Failed to generate top goals from server:", error);
      if (error instanceof Error) {
        toast.error(`Failed to generate top goals. Reason: ${error.message}`);
      } else {
        toast.error("Failed to generate top goals. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const updateTopGoal = (index: number, value: string) => {
    const newGoals = [...topGoals];
    newGoals[index] = value;
    setTopGoals(newGoals);
  };

  const generateScheduleHandler = async () => {
    setIsGenerating(true);

    try {
      const result = await generateSchedule({
        northStar,
        brainDump,
        topGoals,
        dayDuration,
        coreTime,
        profile,
        hobbies,
        intermittentFasting,
        date: date.toISOString(),
      });

      if (result.schedule && result.schedule.length > 0) {
        setSchedule(result.schedule);

        if (calendarRef.current) {
          calendarRef.current.switchToAgendaView();
        }

        toast.success("Schedule generated successfully");
        return;
      }
    } catch (error) {
      console.error("Failed to generate schedule from server:", error);
      if (error instanceof Error) {
        toast.error(`Failed to generate schedule. Reason: ${error.message}`);
      } else {
        toast.error("Failed to generate schedule. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if essential personalization settings are empty
  const isPersonalizationEmpty = !name || !profile || !northStar || !hobbies;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-xl bg-white shadow-sm print:rounded-none print:shadow-none">
        <div className="flex items-center justify-between border-b p-4 md:p-6 print:hidden">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500 print:text-black" />
            <h1 className="font-semibold text-xl">Timeboxing AI</h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSettingsOpen(true)}
            className={`print:hidden ${isMounted() && isPersonalizationEmpty ? "relative" : ""}`}
          >
            <Settings className="h-5 w-5" />
            {isMounted() && isPersonalizationEmpty && settingsLoaded && (
              <span className="-top-1 -right-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                !
              </span>
            )}
            <span className="sr-only">Settings</span>
          </Button>
        </div>

        {isMounted() && isPersonalizationEmpty && settingsLoaded && (
          <div className="container mx-auto px-4">
            <Alert
              variant="default"
              className="my-3 border-amber-200 bg-amber-50 text-amber-800 print:hidden"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Complete your profile for better results</AlertTitle>
              <AlertDescription className="text-xs">
                The AI needs to know about you to create a personalized
                schedule.{" "}
                <Button
                  onClick={() => setIsSettingsOpen(true)}
                  className="h-auto p-0 font-medium"
                  variant="link"
                  size="sm"
                >
                  Open Settings
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="grid h-full grid-cols-1 md:grid-cols-2 md:divide-x print:grid-cols-2">
          {/* Left Column - Goals and Brain Dump */}
          <div className="p-4 md:p-6 print:p-4">
            <div className="mb-6">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-gray-500 text-sm">Day</p>
                <DatePicker
                  date={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  triggerClassName="h-7 text-xs print:hidden"
                  showDateDisplay={false}
                />
              </div>
              <p className="font-medium text-lg">{formatDate(date)}</p>
            </div>

            <div className="mb-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-medium">Top Daily Goals</h2>
                <Button
                  onClick={generateTopGoalsHandler}
                  disabled={isGenerating}
                  size="sm"
                  variant="secondary"
                  className="print:hidden"
                >
                  <WandSparkles className="mr-2 h-4 w-4" />
                  {isGenerating ? "Generating..." : "Generate with AI"}
                </Button>
              </div>
              <div className="space-y-2">
                {topGoals.map((goal, index) => (
                  <Textarea
                    key={index}
                    value={goal}
                    onChange={(e) => updateTopGoal(index, e.target.value)}
                    placeholder={`Goal ${index + 1}`}
                    className="min-h-auto resize-none border-gray-300 print:static print:border-none print:bg-transparent print:p-0 print:placeholder-transparent print:shadow-none print:outline-none"
                    readOnly={false}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                    }}
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
                className="min-h-[200px] border-gray-300 print:h-auto print:min-h-fit print:resize-none print:border-none print:bg-transparent print:p-0 print:placeholder-transparent print:shadow-none print:outline-none"
              />
            </div>
          </div>

          {/* Right Column - Schedule */}
          <div className="relative p-4 md:p-6 print:p-4">
            <div className="mb-6 flex items-center justify-between print:hidden">
              <div className="flex items-center">
                <h2 className="font-medium">Schedule</h2>
              </div>
              <Button
                onClick={generateScheduleHandler}
                disabled={isGenerating}
                size="sm"
                variant="secondary"
                className="print:hidden"
              >
                <WandSparkles className="mr-2 h-4 w-4" />
                {isGenerating ? "Generating..." : "Generate with AI"}
              </Button>
            </div>

            {/* Only render the calendar when the component is mounted to prevent layout shifts */}
            {isMounted() ? (
              <BigCalendarSchedule
                schedule={schedule}
                setSchedule={setSchedule}
                dayDuration={dayDuration}
                date={date}
                setDate={setDate}
                ref={calendarRef}
              />
            ) : (
              <div className="flex h-[500px] items-center justify-center rounded-lg border border-dashed">
                <div className="text-center text-gray-500">
                  <Calendar className="mx-auto h-10 w-10 opacity-20" />
                  <p className="mt-2">Loading calendar...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Button */}
      <div className="mx-auto mt-4 flex max-w-7xl justify-end print:hidden">
        <Button
          onClick={() => {
            // First switch to agenda view
            calendarRef.current?.switchToAgendaView();

            // Wait a moment for the view to update before showing print dialog
            setTimeout(() => {
              window.print();
            }, 500);
          }}
          variant="default"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Schedule
        </Button>
      </div>

      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        dayDuration={dayDuration}
        setDayDuration={setDayDuration}
        name={name}
        setName={setName}
        northStar={northStar}
        setNorthStar={setNorthStar}
        coreTime={coreTime}
        setCoreTime={setCoreTime}
        profile={profile}
        setProfile={setProfile}
        hobbies={hobbies}
        setHobbies={setHobbies}
        intermittentFasting={intermittentFasting}
        setIntermittentFasting={setIntermittentFasting}
      />
    </div>
  );
}
