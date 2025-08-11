import React from "react";

const MainContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      {children}
    </div>
  );
};

export default MainContent;
