import React, { useState } from "react";
import {
  FiSettings,
  FiSearch,
  FiPlus,
  FiArchive,
  FiChevronDown,
  FiUsers,
} from "react-icons/fi";
import { Button } from "../ui/Button";
import { useCalendarStore } from "@/stores/calendarStore";
import clsx from "clsx";

const Sidebar: React.FC = () => {
  const { setFilters, filters } = useCalendarStore();
  const [activePlan, setActivePlan] = useState<string | null>(null);

  const plans = [
    { name: "Benefits", color: "bg-red-500" },
    { name: "Company Trainings", color: "bg-orange-500" },
    { name: "Meetings", color: "bg-blue-500" },
    { name: "Off-boarding", color: "bg-teal-500" },
    { name: "Onboarding", color: "bg-pink-500" },
    { name: "Preboarding", color: "bg-yellow-500" },
    { name: "Recruitment", color: "bg-purple-500" },
  ];

  const handlePlanClick = (planName: string) => {
    const newActivePlan = activePlan === planName ? null : planName;
    setActivePlan(newActivePlan);
    setFilters({ eventTypes: newActivePlan ? [newActivePlan] : [] });
  };

  return (
    <div className="flex flex-col h-screen bg-[#1A0A2B] text-gray-300 w-64 p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-white">Company Workspace</h1>
        <FiChevronDown className="text-gray-400" />
      </div>

      <nav className="space-y-2">
        <a
          href="#"
          className="flex items-center space-x-3 p-2 rounded-md hover:bg-white/10"
          onClick={() => console.log("Settings & Team clicked")}
        >
          <FiSettings />
          <span>Settings & Team</span>
        </a>
        <a
          href="#"
          className="flex items-center space-x-3 p-2 rounded-md hover:bg-white/10"
          onClick={() => console.log("Quick Search clicked")}
        >
          <FiSearch />
          <span>Quick Search</span>
        </a>
      </nav>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400">TEAMS</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => console.log("New Team clicked")}
          >
            <FiPlus />
          </Button>
        </div>
        <a
          href="#"
          className="flex items-center space-x-3 p-2 rounded-md bg-purple-600 text-white"
        >
          <FiUsers />
          <span>HR Team</span>
        </a>
      </div>

      <div className="space-y-2 flex-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400">PLANS</h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white"
            onClick={() => handlePlanClick(null)}
          >
            Clear
          </Button>
        </div>
        <div className="space-y-1">
          {plans.map((plan) => (
            <a
              href="#"
              key={plan.name}
              className={clsx(
                "flex items-center space-x-3 p-2 rounded-md hover:bg-white/10",
                { "bg-white/20": activePlan === plan.name }
              )}
              onClick={() => handlePlanClick(plan.name)}
            >
              <span className={`w-3 h-3 rounded-full ${plan.color}`}></span>
              <span>{plan.name}</span>
            </a>
          ))}
        </div>
      </div>

      <div>
        <a
          href="#"
          className="flex items-center space-x-3 p-2 rounded-md hover:bg-white/10 text-sm"
          onClick={() => console.log("Archived Plans clicked")}
        >
          <FiArchive />
          <span>Archived Plans (0)</span>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;
