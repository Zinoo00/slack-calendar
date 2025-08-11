import React, { useState } from "react";
import { Button } from "../ui/Button";
import { useCalendarStore } from "@/stores/calendarStore";
import { CalendarEvent } from "@/types/calendar.types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Clock, MapPin, FileText, Palette } from "lucide-react";
import { format } from "date-fns";

interface EventPopoverProps {
  date: Date;
  position: { x: number; y: number };
  onClose: () => void;
  isOpen: boolean;
  event?: CalendarEvent;
}

export const EventPopover: React.FC<EventPopoverProps> = ({
  date,
  position,
  onClose,
  isOpen,
  event,
}) => {
  const { createEvent, updateEvent, filters } = useCalendarStore();

  const isEditing = !!event;

  const [title, setTitle] = useState(event?.title || "");
  const [location, setLocation] = useState(event?.location || "");
  const [allDay, setAllDay] = useState(event?.allDay || false);
  const [startTime, setStartTime] = useState(
    event ? format(event.startTime, "HH:mm") : "09:00"
  );
  const [endTime, setEndTime] = useState(
    event ? format(event.endTime, "HH:mm") : "10:00"
  );
  const [description, setDescription] = useState(event?.description || "");
  const [selectedColor, setSelectedColor] = useState(event?.color || "#3b82f6");

  const planColor = (plan: string) => {
    const map: Record<string, string> = {
      Benefits: "#ef4444",
      "Company Trainings": "#f97316",
      Meetings: "#3b82f6",
      "Off-boarding": "#14b8a6",
      Onboarding: "#ec4899",
      Preboarding: "#eab308",
      Recruitment: "#8b5cf6",
    };
    return map[plan] || "#3b82f6";
  };

  const colorOptions = [
    { value: "#3b82f6", label: "Blue", class: "bg-blue-500" },
    { value: "#10b981", label: "Green", class: "bg-green-500" },
    { value: "#f59e0b", label: "Yellow", class: "bg-yellow-500" },
    { value: "#ef4444", label: "Red", class: "bg-red-500" },
    { value: "#8b5cf6", label: "Purple", class: "bg-purple-500" },
    { value: "#f97316", label: "Orange", class: "bg-orange-500" },
    { value: "#ec4899", label: "Pink", class: "bg-pink-500" },
    { value: "#06b6d4", label: "Cyan", class: "bg-cyan-500" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const start = new Date(date);
      const end = new Date(date);
      if (!allDay) {
        const [sh, sm] = startTime.split(":").map(Number);
        const [eh, em] = endTime.split(":").map(Number);
        start.setHours(sh, sm, 0, 0);
        end.setHours(eh, em, 0, 0);
      }

      const common = {
        color: selectedColor,
        title,
        type: filters.eventTypes[0] || "default",
        location: location || undefined,
        description: description || undefined,
        startTime: start,
        endTime: end,
        allDay,
      };

      if (isEditing && event) {
        updateEvent(event.id, common);
      } else {
        createEvent(common);
      }
      onClose();
    }
  };

  if (!isOpen) return null;

  const POP_WIDTH = 320; // w-80 = 20rem
  const MARGIN = 12;
  const shouldShiftLeft = position.x + POP_WIDTH + MARGIN > window.innerWidth;
  const adjustedLeft = shouldShiftLeft
    ? position.x - POP_WIDTH - MARGIN
    : position.x + MARGIN;

  return (
    <div
      className="fixed z-50 animate-in fade-in-0 zoom-in-95"
      style={{
        top: position.y,
        left: adjustedLeft,
        transform: "translateY(-50%)",
      }}
    >
      <Card className="w-80 shadow-lg border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">New Event</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Event Title */}
            <div className="space-y-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New Event"
                className="font-medium border-0 px-0 focus:ring-0 text-base"
                autoFocus
              />
            </div>

            {/* Location */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Add location"
                  className="text-sm"
                />
              </div>
            </div>

            {/* All Day Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="allDay"
                checked={allDay}
                onCheckedChange={(checked) => setAllDay(!!checked)}
              />
              <Label htmlFor="allDay" className="text-sm font-normal">
                All day
              </Label>
            </div>

            {/* Time Selection */}
            {!allDay && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="text-sm"
                />
                <span className="text-muted-foreground text-sm">to</span>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="text-sm"
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-1">
              <div className="flex items-start gap-2">
                <FileText className="h-3 w-3 text-muted-foreground mt-0.5" />
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add notes"
                  className="text-sm resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Palette className="h-3 w-3 text-muted-foreground" />
                <Label className="text-sm font-normal">Color</Label>
              </div>
              <div className="flex gap-1">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`w-6 h-6 rounded-full border-2 transition-all ${
                      color.class
                    } ${
                      selectedColor === color.value
                        ? "ring-2 ring-primary ring-offset-1"
                        : "border-border"
                    }`}
                    onClick={() => setSelectedColor(color.value)}
                    title={color.label}
                  />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={!title.trim()}>
                Save Event
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
