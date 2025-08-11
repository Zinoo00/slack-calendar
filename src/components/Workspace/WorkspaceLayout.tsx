import React from "react";
import Sidebar from "./Sidebar";
import MainContent from "./MainContent";

const WorkspaceLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <MainContent>{children}</MainContent>
    </div>
  );
};

export default WorkspaceLayout;
