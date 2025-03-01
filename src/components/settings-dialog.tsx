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
    // Save settings to localStorage
    localStorage.setItem("timebox-name", name);
    localStorage.setItem("timebox-northStar", northStar);
    localStorage.setItem("timebox-dayDuration", JSON.stringify(dayDuration));

    // Close the dialog
    onOpenChange(false);
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
              Set your active hours for scheduling
            </p>
            <div className="flex items-center gap-2">
              <Input
                id="dayStart"
                type="time"
                value={dayDuration.start}
                onChange={(e) =>
                  setDayDuration({ ...dayDuration, start: e.target.value })
                }
              />
              <span>to</span>
              <Input
                id="dayEnd"
                type="time"
                value={dayDuration.end}
                onChange={(e) =>
                  setDayDuration({ ...dayDuration, end: e.target.value })
                }
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
