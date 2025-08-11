import React from 'react';
import { CalendarPage } from './components/Calendar/CalendarPage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <CalendarPage />
      </div>
    </QueryClientProvider>
  );
};