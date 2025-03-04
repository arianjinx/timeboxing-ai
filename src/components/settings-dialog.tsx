"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dayDuration: { start: string; end: string };
  setDayDuration: React.Dispatch<
    React.SetStateAction<{ start: string; end: string }>
  >;
  name: string;
  setName: Dispatch<SetStateAction<string>>;
  northStar: string;
  setNorthStar: Dispatch<SetStateAction<string>>;
  coreTime: { start: string; end: string };
  setCoreTime: React.Dispatch<
    React.SetStateAction<{ start: string; end: string }>
  >;
  profile: string;
  setProfile: Dispatch<SetStateAction<string>>;
  hobbies: string;
  setHobbies: Dispatch<SetStateAction<string>>;
  intermittentFasting: boolean;
  setIntermittentFasting: Dispatch<SetStateAction<boolean>>;
}

export function SettingsDialog({
  open,
  onOpenChange,
  dayDuration,
  setDayDuration,
  name,
  setName,
  northStar,
  setNorthStar,
  coreTime,
  setCoreTime,
  profile,
  setProfile,
  hobbies,
  setHobbies,
  intermittentFasting,
  setIntermittentFasting,
}: SettingsDialogProps) {
  // Debounce timers
  const dayDurationDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const coreTimeDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Track pending values for debouncing
  const pendingDayDuration = useRef<{ start: string; end: string }>(
    dayDuration,
  );
  const pendingCoreTime = useRef<{ start: string; end: string }>(coreTime);

  // Update refs when props change
  useEffect(() => {
    pendingDayDuration.current = dayDuration;
  }, [dayDuration]);

  useEffect(() => {
    pendingCoreTime.current = coreTime;
  }, [coreTime]);

  const saveSettings = () => {
    // Final validation before saving
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
      // Adjust end time to be start time + 1 hour
      const newEndHours = startHours + 1;
      const newEndMinutes = startMinutes;

      // Format the time properly with leading zeros
      const formattedEndTime = `${newEndHours.toString().padStart(2, "0")}:${newEndMinutes.toString().padStart(2, "0")}`;

      // Update the end time
      setDayDuration((prev) => ({
        ...prev,
        end: formattedEndTime,
      }));

      toast.error(
        "End time must be at least 1 hour after start time. Adjusting automatically.",
      );
    }

    // Also validate core time is within day duration
    const validatedCoreTime = validateCoreTimeWithinDayDuration();

    // Save settings to localStorage
    localStorage.setItem("timebox-name", name);
    localStorage.setItem("timebox-northStar", northStar);
    localStorage.setItem("timebox-dayDuration", JSON.stringify(dayDuration));
    localStorage.setItem("timebox-coreTime", JSON.stringify(validatedCoreTime));
    localStorage.setItem("timebox-profile", profile);
    localStorage.setItem("timebox-hobbies", hobbies);
    localStorage.setItem(
      "timebox-intermittentFasting",
      intermittentFasting.toString(),
    );

    // Close the dialog
    onOpenChange(false);
  };

  // Handles time input changes with debouncing
  const handleTimeChange = (field: "start" | "end", value: string) => {
    // Update the pending value immediately (for UI responsiveness)
    pendingDayDuration.current = {
      ...pendingDayDuration.current,
      [field]: value,
    };

    // Update the displayed value immediately for better UX
    setDayDuration({
      ...pendingDayDuration.current,
    });

    // Clear any existing timer
    if (dayDurationDebounceTimer.current) {
      clearTimeout(dayDurationDebounceTimer.current);
    }

    // Set a new timer to validate after user stops typing
    dayDurationDebounceTimer.current = setTimeout(() => {
      validateDayDuration(field);
    }, 800); // 800ms debounce delay
  };

  // Validate day duration with proper constraints
  const validateDayDuration = (field: "start" | "end") => {
    const updatedDuration = { ...pendingDayDuration.current };

    // Only do validation if both values are set
    if (updatedDuration.start && updatedDuration.end) {
      const [startHours, startMinutes] = updatedDuration.start
        .split(":")
        .map(Number);
      const [endHours, endMinutes] = updatedDuration.end.split(":").map(Number);

      // Convert to minutes for easier comparison
      const startTotalMinutes = startHours * 60 + startMinutes;
      let endTotalMinutes = endHours * 60 + endMinutes;

      // If end is 00:00, treat it as 24:00
      if (endHours === 0 && endMinutes === 0) {
        endTotalMinutes = 24 * 60;
      }

      // If the start is after the end or they're less than 1 hour apart, update the other field
      if (startTotalMinutes >= endTotalMinutes - 60) {
        if (field === "start") {
          // If changing start, adjust end to be start + 1 hour
          const newEndHours = (startHours + 1) % 24;
          const formattedEndTime = `${newEndHours.toString().padStart(2, "0")}:${startMinutes.toString().padStart(2, "0")}`;

          updatedDuration.end = formattedEndTime;
        } else if (field === "end") {
          // If changing end, adjust to ensure it's at least 1 hour after start
          // Only update if end time would be earlier than start + 1 hour
          if (startTotalMinutes >= endTotalMinutes - 60) {
            const newStartHours = Math.max(0, (endHours - 1 + 24) % 24);
            const formattedStartTime = `${newStartHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

            updatedDuration.start = formattedStartTime;
          }
        }
      }
    }

    // Update state with validated values
    setDayDuration(updatedDuration);

    // Instead of using setTimeout which can cause an infinite loop,
    // return the validated duration for further processing
    return updatedDuration;
  };

  // Handle core time changes with debouncing
  const handleCoreTimeChange = (field: "start" | "end", value: string) => {
    // Update the pending value immediately (for UI responsiveness)
    pendingCoreTime.current = {
      ...pendingCoreTime.current,
      [field]: value,
    };

    // Update the displayed value immediately for better UX
    setCoreTime({
      ...pendingCoreTime.current,
    });

    // Clear any existing timer
    if (coreTimeDebounceTimer.current) {
      clearTimeout(coreTimeDebounceTimer.current);
    }

    // Set a new timer to validate after user stops typing
    coreTimeDebounceTimer.current = setTimeout(() => {
      validateCoreTimeWithinDayDuration(pendingCoreTime.current);
    }, 800); // 800ms debounce delay
  };

  // Validate that core time is within day duration
  const validateCoreTimeWithinDayDuration = (newCoreTime = coreTime) => {
    // Convert all times to minutes for easier comparison
    const dayStartParts = dayDuration.start.split(":").map(Number);
    const dayEndParts = dayDuration.end.split(":").map(Number);
    const coreStartParts = newCoreTime.start.split(":").map(Number);
    const coreEndParts = newCoreTime.end.split(":").map(Number);

    const dayStartMinutes = dayStartParts[0] * 60 + dayStartParts[1];
    let dayEndMinutes = dayEndParts[0] * 60 + dayEndParts[1];
    const coreStartMinutes = coreStartParts[0] * 60 + coreStartParts[1];
    let coreEndMinutes = coreEndParts[0] * 60 + coreEndParts[1];

    // If end is 00:00, treat it as 24:00
    if (dayEndParts[0] === 0 && dayEndParts[1] === 0) {
      dayEndMinutes = 24 * 60;
    }
    if (coreEndParts[0] === 0 && coreEndParts[1] === 0) {
      coreEndMinutes = 24 * 60;
    }

    const updatedCoreTime = { ...newCoreTime };
    let needsUpdate = false;

    // Check if core start is before day start
    if (coreStartMinutes < dayStartMinutes) {
      updatedCoreTime.start = dayDuration.start;
      needsUpdate = true;
    }

    // Check if core end is after day end
    if (coreEndMinutes > dayEndMinutes) {
      updatedCoreTime.end = dayDuration.end;
      needsUpdate = true;
    }

    // Check if core duration is at least 1 hour
    if (coreEndMinutes - coreStartMinutes < 60) {
      const newCoreEndHours = (coreStartParts[0] + 1) % 24;
      const formattedEndTime = `${newCoreEndHours.toString().padStart(2, "0")}:${coreStartParts[1].toString().padStart(2, "0")}`;

      updatedCoreTime.end = formattedEndTime;
      needsUpdate = true;
    }

    // Update core time if needed and if it's different from current value
    // Adding the equality check prevents unnecessary state updates
    if (
      needsUpdate &&
      (updatedCoreTime.start !== coreTime.start ||
        updatedCoreTime.end !== coreTime.end)
    ) {
      setCoreTime(updatedCoreTime);
      pendingCoreTime.current = updatedCoreTime;
      toast.error(
        "Core Time must be within Day Duration and at least 1 hour long. Adjusting automatically.",
      );
    }

    return updatedCoreTime;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="py-4">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <DialogDescription className="mt-2">
          Personalize your experience to get the most out of the AI-powered
          scheduling.
        </DialogDescription>

        <Tabs defaultValue="personal" className="py-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal" className="cursor-pointer">
              Personal Info
            </TabsTrigger>
            <TabsTrigger value="scheduling" className="cursor-pointer">
              Scheduling
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className={!name ? "border-amber-300" : ""}
              />
              {!name && (
                <p className="text-amber-600 text-xs">
                  Adding your name helps the AI personalize communications
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile">About You</Label>
              <p className="text-muted-foreground text-xs">
                Tell us about yourself (professional background, key skills,
                etc.) -
                <span className="font-medium text-blue-600">
                  {" "}
                  this helps the AI understand your work context
                </span>
              </p>
              <Textarea
                id="profile"
                value={profile}
                onChange={(e) => setProfile(e.target.value)}
                placeholder="e.g., Software engineer with 5 years experience in web development, interested in AI and machine learning"
                className={`min-h-[80px] ${!profile ? "border-amber-300" : ""}`}
              />
              {!profile && (
                <p className="text-amber-600 text-xs">
                  Your professional background helps the AI suggest relevant
                  work tasks
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="hobbies">Hobbies & Interests</Label>
              <p className="text-muted-foreground text-xs">
                What activities do you enjoy outside of work? -
                <span className="font-medium text-blue-600">
                  {" "}
                  this helps the AI balance your schedule
                </span>
              </p>
              <Textarea
                id="hobbies"
                value={hobbies}
                onChange={(e) => setHobbies(e.target.value)}
                placeholder="e.g., Photography, hiking, cooking, reading sci-fi novels"
                className={`min-h-[80px] ${!hobbies ? "border-amber-300" : ""}`}
              />
              {!hobbies && (
                <p className="text-amber-600 text-xs">
                  Sharing your interests helps the AI include personal time in
                  your schedule
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="northStar">Your North Star</Label>
              <p className="text-muted-foreground text-xs">
                What are your core values and long-term goals? -
                <span className="font-medium text-blue-600">
                  {" "}
                  this is crucial for AI prioritization
                </span>
              </p>
              <Textarea
                id="northStar"
                value={northStar}
                onChange={(e) => setNorthStar(e.target.value)}
                placeholder="e.g., Build a successful business while maintaining work-life balance and prioritizing health"
                className={`min-h-[80px] ${!northStar ? "border-amber-300" : ""}`}
              />
              {!northStar && (
                <p className="text-amber-600 text-xs">
                  Your north star guides the AI in aligning daily tasks with
                  your long-term vision
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="scheduling" className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="dayStart">Day Duration</Label>
              <p className="text-muted-foreground text-xs">
                Set your active hours for scheduling (minimum 1 hour range) -
                <span className="font-medium text-blue-600">
                  {" "}
                  helps the AI know when you&apos;re available
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="dayStart"
                  type="time"
                  value={dayDuration.start}
                  onChange={(e) => handleTimeChange("start", e.target.value)}
                />
                <span>to</span>
                <Input
                  id="dayEnd"
                  type="time"
                  value={dayDuration.end}
                  onChange={(e) => handleTimeChange("end", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coreTimeStart">Core Time</Label>
              <p className="text-muted-foreground text-xs">
                When are you most active and productive? -
                <span className="font-medium text-blue-600">
                  {" "}
                  the AI will schedule important tasks during this time
                </span>
              </p>
              <div className="flex items-center gap-2">
                <Input
                  id="coreTimeStart"
                  type="time"
                  value={coreTime.start}
                  onChange={(e) =>
                    handleCoreTimeChange("start", e.target.value)
                  }
                />
                <span>to</span>
                <Input
                  id="coreTimeEnd"
                  type="time"
                  value={coreTime.end}
                  onChange={(e) => handleCoreTimeChange("end", e.target.value)}
                />
              </div>
            </div>

            <div className="mb-2 flex items-center space-x-2 pt-2">
              <Checkbox
                id="intermittentFasting"
                checked={intermittentFasting}
                onCheckedChange={(checked: boolean | "indeterminate") =>
                  setIntermittentFasting(checked === true)
                }
              />
              <Label
                htmlFor="intermittentFasting"
                className="cursor-pointer font-medium text-sm leading-none"
              >
                I practice intermittent fasting
              </Label>
            </div>
            <p className="pl-6 text-muted-foreground text-xs">
              This helps the AI schedule meal breaks appropriately
            </p>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button
            onClick={saveSettings}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
