import React, { useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "../ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { format } from "date-fns";
import { CalendarView as CalendarViewType } from "@/types/calendar.types";

interface CalendarHeaderProps {
  currentView: CalendarViewType;
  onViewChange: (view: CalendarViewType) => void;
  onNext: () => void;
  onPrev: () => void;
  onToday: () => void;
  viewDate: Date;
  onNewEvent?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentView,
  onViewChange,
  onNext,
  onPrev,
  onToday,
  viewDate,
  onNewEvent,
}) => {
  const formattedDate = format(viewDate, "MMMM yyyy");

  // macOS Calendar keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) { // Cmd on Mac, Ctrl on Windows
        switch (e.key) {
          case '1':
            e.preventDefault();
            onViewChange('day');
            break;
          case '2':
            e.preventDefault();
            onViewChange('week');
            break;
          case '3':
            e.preventDefault();
            onViewChange('month');
            break;
          case 't':
            if (!e.shiftKey) {
              e.preventDefault();
              onToday();
            }
            break;
          case 'n':
            e.preventDefault();
            if (onNewEvent) onNewEvent();
            break;
          case 'ArrowLeft':
            e.preventDefault();
            onPrev();
            break;
          case 'ArrowRight':
            e.preventDefault();
            onNext();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentView, onViewChange, onNext, onPrev, onToday, onNewEvent]);

  return (
    <TooltipProvider>
      <div className="border-b bg-background">
        <div className="flex h-16 items-center justify-between px-4">
          {/* Navigation Section */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onToday}>
              Today
            </Button>
            <div className="flex items-center border rounded-md">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onPrev}
                    className="border-0 rounded-r-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous {currentView}</TooltipContent>
              </Tooltip>
              <div className="h-8 px-4 flex items-center justify-center min-w-[140px] text-center border-x">
                <span className="text-sm font-medium">{formattedDate}</span>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNext}
                    className="border-0 rounded-l-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next {currentView}</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            <Select
              value={currentView}
              onValueChange={(value) => onViewChange(value as CalendarViewType)}
            >
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" className="gap-2" onClick={onNewEvent}>
              <Plus className="h-4 w-4" />
              New Event
            </Button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="border-t bg-muted/50 px-4 py-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing {currentView} view</span>
            <span>Last updated: {format(new Date(), "h:mm a")}</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
