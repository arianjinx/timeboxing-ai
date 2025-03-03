"use client";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import type { Dispatch, SetStateAction } from "react";

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
}: SettingsDialogProps) {
  const saveSettings = () => {
    // Validate time range before saving
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

      alert(
        "End time must be at least 1 hour after start time. Adjusting automatically.",
      );
    }

    // Save settings to localStorage
    localStorage.setItem("timebox-name", name);
    localStorage.setItem("timebox-northStar", northStar);
    localStorage.setItem("timebox-dayDuration", JSON.stringify(dayDuration));

    // Close the dialog
    onOpenChange(false);
  };

  // Validate time inputs when they change
  const handleTimeChange = (field: "start" | "end", value: string) => {
    const updatedDuration = { ...dayDuration, [field]: value };

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

          setDayDuration({
            start: value,
            end: formattedEndTime,
          });
          return;
        }

        // field === 'end'
        // If changing end, adjust to ensure it's at least 1 hour after start
        // Only update if end time would be earlier than start + 1 hour
        if (startTotalMinutes >= endTotalMinutes - 60) {
          const newStartHours = Math.max(0, (endHours - 1 + 24) % 24);
          const formattedStartTime = `${newStartHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;

          setDayDuration({
            start: formattedStartTime,
            end: value,
          });
          return;
        }
      }
    }

    // If no special handling needed, just update normally
    setDayDuration(updatedDuration);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Customize your settings to personalize your experience.
        </DialogDescription>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="northStar">Your North Star</Label>
            <p className="text-muted-foreground text-xs">
              What are your core values and long-term goals? This helps AI
              prioritize your tasks.
            </p>
            <Textarea
              id="northStar"
              value={northStar}
              onChange={(e) => setNorthStar(e.target.value)}
              placeholder="e.g., Build a successful business while maintaining work-life balance and prioritizing health"
              className="min-h-[100px]"
            />{" "}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dayStart">Day Duration</Label>
            <p className="text-muted-foreground text-xs">
              Set your active hours for scheduling (minimum 1 hour range)
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
        </div>

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
