import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useChildPages } from "./useChildPages";
import { filterPages } from "./filterUtils";
import type { Page } from "../../types";
import { ARIA_LABELS } from "../../constants/aria-labels";

interface CalendarViewProps {
  dateField: string;
  filter?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  parentPath?: string;
}

export function CalendarView({ dateField, filter, parentPath }: CalendarViewProps) {
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { childPages, isLoading } = useChildPages(parentPath, refreshTrigger);
  
  const filtered = filterPages(childPages, filter);
  
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  const pagesByDate = filtered.reduce((acc, page) => {
    const dateStr = String(page.frontMatter[dateField] ?? "");
    if (!dateStr) return acc;
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return acc;
    
    const day = date.getDate();
    const monthKey = `${year}-${month}`;
    if (date.getFullYear() === year && date.getMonth() === month) {
      if (!acc[day]) acc[day] = [];
      acc[day].push(page);
    }
    
    return acc;
  }, {} as Record<number, Page[]>);
  
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };
  
  if (isLoading) {
    return <div className="text-slate-600 p-4">Loading...</div>;
  }
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={prevMonth}
            className="text-slate-600 hover:text-slate-900 transition-colors"
            aria-label={ARIA_LABELS.previousMonth}
          >
            ←
          </button>
          <h3 className="text-lg font-semibold text-slate-800">
            {monthNames[month]} {year}
          </h3>
          <button
            type="button"
            onClick={nextMonth}
            className="text-slate-600 hover:text-slate-900 transition-colors"
            aria-label={ARIA_LABELS.nextMonth}
          >
            →
          </button>
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          className="text-slate-600 hover:text-slate-900 transition-colors"
          aria-label={ARIA_LABELS.refresh}
          title="Refresh"
        >
          ↻
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-xs font-medium text-slate-600 p-2">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="aspect-square" />
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const pages = pagesByDate[day] || [];
          
          return (
            <div
              key={day}
              className="aspect-square border border-slate-300 rounded p-1 bg-slate-50 min-h-[60px]"
            >
              <div className="text-xs text-slate-600 mb-1">{day}</div>
              <div className="space-y-1">
                {pages.slice(0, 2).map((page) => (
                  <div
                    key={page.path}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/${page.path}`);
                    }}
                    className="text-xs bg-sky-600 text-white px-1 py-0.5 rounded truncate cursor-pointer hover:bg-sky-500"
                    title={page.title}
                  >
                    {page.title}
                  </div>
                ))}
                {pages.length > 2 && (
                  <div className="text-xs text-slate-600">+{pages.length - 2}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

