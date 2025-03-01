"use client";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date: Date;
  onSelect: (date: Date | undefined) => void;
  triggerClassName?: string;
  calendarClassName?: string;
  showDateDisplay?: boolean;
}

export function DatePicker({
  date,
  onSelect,
  triggerClassName,
  calendarClassName,
  showDateDisplay = true,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (selectedDate: Date | undefined) => {
    onSelect(selectedDate);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "flex h-9 w-fit gap-2 print:border-none print:bg-transparent print:p-0",
            triggerClassName,
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {showDateDisplay && date ? (
            format(date, "PPP")
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("w-auto p-0", calendarClassName)}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
