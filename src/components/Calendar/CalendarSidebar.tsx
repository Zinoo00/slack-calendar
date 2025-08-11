import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Checkbox } from "../ui/checkbox";
import { 
  Calendar, 
  Users, 
  Filter, 
  Plus, 
  Search, 
  Clock, 
  MapPin, 
  Video, 
  Coffee,
  Briefcase,
  Home,
  Plane
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarSidebarProps {
  isVisible: boolean;
  onToggle: () => void;
}

const CalendarSidebar: React.FC<CalendarSidebarProps> = ({
  isVisible,
  onToggle
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [eventFilters, setEventFilters] = useState({
    meetings: true,
    personal: true,
    holidays: false,
    deadlines: true,
  });

  // Sample data - in a real app this would come from props or context
  const teamMembers = [
    { id: "1", name: "Sarah Chen", avatar: "SC", status: "available", role: "HR Manager", events: 5 },
    { id: "2", name: "Mike Johnson", avatar: "MJ", status: "busy", role: "Recruiter", events: 8 },
    { id: "3", name: "Emily Rodriguez", avatar: "ER", status: "available", role: "HR Specialist", events: 3 },
    { id: "4", name: "David Kim", avatar: "DK", status: "away", role: "HR Coordinator", events: 2 },
    { id: "5", name: "Lisa Park", avatar: "LP", status: "available", role: "HR Assistant", events: 4 },
  ];

  const eventTypes = [
    { id: "meeting", label: "Meetings", icon: Users, color: "bg-blue-500", count: 12 },
    { id: "interview", label: "Interviews", icon: Briefcase, color: "bg-purple-500", count: 8 },
    { id: "training", label: "Training", icon: Coffee, color: "bg-green-500", count: 3 },
    { id: "personal", label: "Personal", icon: Home, color: "bg-yellow-500", count: 6 },
    { id: "travel", label: "Travel", icon: Plane, color: "bg-red-500", count: 2 },
    { id: "video-call", label: "Video Calls", icon: Video, color: "bg-indigo-500", count: 15 },
  ];

  const upcomingEvents = [
    { id: "1", title: "Team Standup", time: "9:00 AM", type: "meeting" },
    { id: "2", title: "Interview: John Doe", time: "10:30 AM", type: "interview" },
    { id: "3", title: "HR Policy Review", time: "2:00 PM", type: "meeting" },
    { id: "4", title: "Training Session", time: "4:00 PM", type: "training" },
  ];

  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleMemberSelection = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-80 bg-background border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar Tools
          </h2>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            ←
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search team, events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="team" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-2">
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="filters">Filters</TabsTrigger>
            <TabsTrigger value="upcoming">Today</TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>Team Members</span>
                  <Badge variant="secondary">{teamMembers.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                      selectedMembers.includes(member.id) 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => toggleMemberSelection(member.id)}
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                        <AvatarFallback className="text-xs">{member.avatar}</AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                        getStatusColor(member.status)
                      )} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{member.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{member.role}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {member.events} events
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Member
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Users className="h-3 w-3 mr-1" />
                    Teams
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="filters" className="p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Event Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {eventTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded", type.color)} />
                      <type.icon className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">{type.label}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {type.count}
                      </Badge>
                      <Switch
                        checked={eventFilters[type.id as keyof typeof eventFilters] ?? true}
                        onCheckedChange={(checked) => 
                          setEventFilters(prev => ({ ...prev, [type.id]: checked }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">My Events</Button>
                  <Button variant="outline" size="sm">This Week</Button>
                  <Button variant="outline" size="sm">Recurring</Button>
                  <Button variant="outline" size="sm">Important</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming" className="p-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Today's Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      eventTypes.find(t => t.id === event.type)?.color || "bg-gray-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{event.title}</div>
                      <div className="text-xs text-muted-foreground">{event.time}</div>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <Button variant="outline" size="sm" className="w-full">
                  View All Today's Events
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Plus className="h-3 w-3 mr-2" />
                  New Meeting
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Video className="h-3 w-3 mr-2" />
                  Start Video Call
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <MapPin className="h-3 w-3 mr-2" />
                  Book Room
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CalendarSidebar;