import React from 'react';
import { parse, format, differenceInDays, isWithinInterval, addDays } from 'date-fns';
import { TaskData } from '@/services/smartsheetApi';
import { stringToColor } from '@/lib/utils';

interface GanttChartProps {
  tasks: TaskData[];
}

const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
  // If no tasks, display a message
  if (tasks.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground">No tasks to display</div>;
  }

  // Find the min and max dates to establish time range
  const allDates: Date[] = [];
  
  tasks.forEach(task => {
    const startDate = parse(task.startDate, 'yyyy-MM-dd', new Date());
    const endDate = parse(task.endDate, 'yyyy-MM-dd', new Date());
    
    if (!isNaN(startDate.getTime())) allDates.push(startDate);
    if (!isNaN(endDate.getTime())) allDates.push(endDate);
  });
  
  // If no valid dates, return a message
  if (allDates.length === 0) {
    return <div className="flex items-center justify-center h-[300px] text-muted-foreground">No valid dates found in tasks</div>;
  }
  
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
  
  // Add padding to the date range
  const startDate = addDays(minDate, -2);
  const endDate = addDays(maxDate, 2);
  
  // Calculate the total number of days in the range
  const totalDays = differenceInDays(endDate, startDate) + 1;
  
  // Generate an array of dates for the header
  const dateHeaders = Array.from({ length: totalDays }, (_, i) => addDays(startDate, i));
  
  // Function to get task status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Allocation': return '#f97316'; // Orange
      case 'Assigned': return '#3b82f6'; // Blue
      case 'In Progress': return '#8b5cf6'; // Purple
      case 'In Validation': return '#06b6d4'; // Cyan
      case 'Completed': return '#10b981'; // Green
      case 'On Hold': return '#6b7280'; // Gray
      case 'Cancelled': return '#ef4444'; // Red
      default: return '#6b7280'; // Default gray
    }
  };
  
  // Today's date for highlighting
  const today = new Date();
  
  return (
    <div className="w-full mt-4">
      <h3 className="text-lg font-medium mb-2">Task Timeline</h3>
      <div className="border rounded-md overflow-auto" style={{ maxHeight: '500px' }}>
        <div className="min-w-max">
          {/* Date headers */}
          <div className="flex border-b sticky top-0 bg-white z-10">
            <div className="w-64 min-w-64 p-2 font-medium border-r bg-gray-50">Task</div>
            {dateHeaders.map((date, index) => {
              const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
              const isWeekend = date.getDay() === 0 || date.getDay() === 6;
              
              return (
                <div 
                  key={index} 
                  className={`w-12 min-w-12 p-1 text-center text-xs border-r ${isToday ? 'bg-red-50 font-bold' : isWeekend ? 'bg-gray-50' : ''}`}
                >
                  {index % 3 === 0 && format(date, 'MMM d')}
                  {isToday && <div className="w-full h-1 bg-red-500 mt-1"></div>}
                </div>
              );
            })}
          </div>
          
          {/* Task rows */}
          {tasks.map((task, taskIndex) => {
            const taskStartDate = parse(task.startDate, 'yyyy-MM-dd', new Date());
            const taskEndDate = parse(task.endDate, 'yyyy-MM-dd', new Date());
            
            // Skip tasks with invalid dates
            if (isNaN(taskStartDate.getTime()) || isNaN(taskEndDate.getTime())) {
              return null;
            }
            
            // Calculate task position and width
            const startOffset = Math.max(0, differenceInDays(taskStartDate, startDate));
            const duration = differenceInDays(taskEndDate, taskStartDate) + 1;
            const taskColor = getStatusColor(task.status || '');
            
            return (
              <div key={taskIndex} className="flex border-b hover:bg-gray-50">
                <div className="w-64 min-w-64 p-2 border-r truncate" title={task.projectName}>
                  {task.projectName}
                </div>
                <div className="relative h-10 flex-grow">
                  {/* Task bar */}
                  <div 
                    className="absolute h-6 rounded-md top-2 flex items-center justify-center text-xs text-white font-medium shadow-sm transition-all hover:h-7 hover:top-1.5 hover:z-10"
                    style={{ 
                      left: `${startOffset * 48}px`,
                      width: `${duration * 48}px`,
                      backgroundColor: taskColor,
                      minWidth: '24px'
                    }}
                    title={`${task.projectName} (${task.status})\nStart: ${task.startDate}\nEnd: ${task.endDate}`}
                  >
                    {duration > 1 ? task.projectName.substring(0, 10) + (task.projectName.length > 10 ? '...' : '') : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
