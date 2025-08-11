"use client";

import React, { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { CalendarEvent } from "@/types/calendar.types";
import { useCalendarStore } from "@/stores/calendarStore";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Calendar, Clock, MapPin, Palette, Trash2, Save, Users, Video, Plus, X } from "lucide-react";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: CalendarEvent;
  selectedDate?: Date;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  event,
  selectedDate,
}) => {
  const { createEvent, updateEvent, deleteEvent } = useCalendarStore();
  const isEditing = !!event;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    type: "meeting",
    startTime: new Date(),
    endTime: new Date(),
    allDay: false,
    color: "#3b82f6",
    attendees: [] as string[],
  });

  useEffect(() => {
    setFormData({
      title: event?.title || "",
      description: event?.description || "",
      location: event?.location || "",
      type: event?.type || "meeting",
      startTime: event?.startTime || selectedDate || new Date(),
      endTime:
        event?.endTime ||
        new Date((selectedDate || new Date()).getTime() + 60 * 60 * 1000), // +1 hour
      allDay: event?.allDay || false,
      color: event?.color || "#3b82f6",
      attendees: event?.attendees?.map(a => a.id) || [],
    });
  }, [event, selectedDate, isOpen]);

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = useCallback(async () => {
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      if (isEditing && event) {
        await updateEvent(event.id, {
          ...formData,
          attendees: formData.attendees.map(id => {
            const member = teamMembers.find(m => m.id === id);
            return {
              id: member?.id || id,
              name: member?.name || "",
              email: member?.email || "",
              status: "pending" as const,
            };
          }),
        });
      } else {
        await createEvent({
          title: formData.title,
          type: formData.type,
          description: formData.description,
          location: formData.location,
          startTime: formData.startTime,
          endTime: formData.endTime,
          allDay: formData.allDay,
          color: formData.color,
          attendees: formData.attendees.map(id => {
            const member = teamMembers.find(m => m.id === id);
            return {
              id: member?.id || id,
              name: member?.name || "",
              email: member?.email || "",
              status: "pending" as const,
            };
          }),
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setIsLoading(false);
    }
  }, [formData, isEditing, event, createEvent, updateEvent, onClose]);

  const handleDelete = useCallback(async () => {
    if (!event) return;
    setIsLoading(true);
    try {
      await deleteEvent(event.id);
      onClose();
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setIsLoading(false);
    }
  }, [event, deleteEvent, onClose]);

  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

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

  const eventTypes = [
    { value: "meeting", label: "Meeting", icon: Users },
    { value: "video-call", label: "Video Call", icon: Video },
    { value: "interview", label: "Interview", icon: Users },
    { value: "training", label: "Training", icon: Calendar },
    { value: "personal", label: "Personal", icon: Calendar },
  ];

  const teamMembers = [
    { id: "1", name: "Sarah Chen", email: "sarah@company.com", avatar: "SC" },
    { id: "2", name: "Mike Johnson", email: "mike@company.com", avatar: "MJ" },
    { id: "3", name: "Emily Rodriguez", email: "emily@company.com", avatar: "ER" },
    { id: "4", name: "David Kim", email: "david@company.com", avatar: "DK" },
    { id: "5", name: "Lisa Park", email: "lisa@company.com", avatar: "LP" },
  ];

  const addAttendee = (memberId: string) => {
    if (!formData.attendees.includes(memberId)) {
      handleInputChange("attendees", [...formData.attendees, memberId]);
    }
  };

  const removeAttendee = (memberId: string) => {
    handleInputChange("attendees", formData.attendees.filter(id => id !== memberId));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: formData.color }}
            />
            {isEditing ? "Edit Event" : "Create New Event"}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? "Make changes to your event" : "Add a new event to your calendar"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Event Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Event Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter event title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              className="text-lg"
            />
          </div>

          {/* Event Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Add event description..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          {/* Event Type & Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Event Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Location
              </Label>
              <Input
                id="location"
                placeholder="Add location or meeting link"
                value={formData.location}
                onChange={(e) => handleInputChange("location", e.target.value)}
              />
            </div>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Date & Time</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm">Start</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={format(formData.startTime, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) =>
                    handleInputChange("startTime", new Date(e.target.value))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm">End</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={format(formData.endTime, "yyyy-MM-dd'T'HH:mm")}
                  onChange={(e) =>
                    handleInputChange("endTime", new Date(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="allDay"
                checked={formData.allDay}
                onCheckedChange={(checked) => handleInputChange("allDay", !!checked)}
              />
              <Label htmlFor="allDay" className="text-sm">All day event</Label>
            </div>
          </div>

          <Separator />

          {/* Color Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Event Color</Label>
            </div>
            <div className="flex gap-2 flex-wrap">
              {colorOptions.map((color) => (
                <Button
                  key={color.value}
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`w-8 h-8 p-0 rounded-full border-2 hover:scale-110 transition-transform ${color.class} ${
                    formData.color === color.value ? "ring-2 ring-primary ring-offset-2" : "border-border"
                  }`}
                  onClick={() => handleInputChange("color", color.value)}
                  title={color.label}
                />
              ))}
            </div>
            {formData.color && (
              <Badge variant="secondary" className="w-fit">
                {colorOptions.find(c => c.value === formData.color)?.label || "Custom"} selected
              </Badge>
            )}
          </div>

          <Separator />

          {/* Attendees */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm font-medium">Attendees</Label>
              </div>
              <Badge variant="secondary" className="text-xs">
                {formData.attendees.length} selected
              </Badge>
            </div>

            {/* Selected Attendees */}
            {formData.attendees.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.attendees.map((attendeeId) => {
                  const member = teamMembers.find(m => m.id === attendeeId);
                  if (!member) return null;
                  return (
                    <div 
                      key={attendeeId}
                      className="flex items-center gap-2 bg-muted px-2 py-1 rounded-md"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                        <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-destructive/20"
                        onClick={() => removeAttendee(attendeeId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Attendees */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Add team members:</Label>
              <div className="grid grid-cols-2 gap-2">
                {teamMembers
                  .filter(member => !formData.attendees.includes(member.id))
                  .map((member) => (
                    <Button
                      key={member.id}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 h-8"
                      onClick={() => addAttendee(member.id)}
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                        <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                      </Avatar>
                      <span className="text-xs truncate">{member.name}</span>
                    </Button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isEditing && (
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isLoading}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isLoading ? "Deleting..." : "Delete"}
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!formData.title.trim() || isLoading}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
