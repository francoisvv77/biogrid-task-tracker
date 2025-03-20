
import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';
import { parse, differenceInDays, format, addDays } from 'date-fns';
import { TaskData } from '@/services/smartsheetApi';

interface GanttChartProps {
  tasks: TaskData[];
}

const GanttChart: React.FC<GanttChartProps> = ({ tasks }) => {
  // Parse tasks and prepare them for Gantt chart display
  const ganttData = tasks.map(task => {
    const startDate = parse(task.startDate, 'yyyy-MM-dd', new Date());
    const endDate = parse(task.endDate, 'yyyy-MM-dd', new Date());
    const duration = differenceInDays(endDate, startDate) + 1; // +1 to include the end date
    
    return {
      name: task.projectName,
      id: task.id,
      sponsor: task.sponsor,
      taskType: task.taskType,
      status: task.status,
      startDate: task.startDate,
      endDate: task.endDate,
      duration: duration,
      team: task.team || [],
      leadBuilder: task.allocated || 'Unassigned',
    };
  });
  
  // Sort tasks by start date
  ganttData.sort((a, b) => {
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
  });
  
  // Find min and max dates to establish the chart range
  let minDate = new Date();
  let maxDate = new Date();
  
  if (ganttData.length > 0) {
    minDate = parse(ganttData[0].startDate, 'yyyy-MM-dd', new Date());
    maxDate = parse(ganttData[0].endDate, 'yyyy-MM-dd', new Date());
    
    ganttData.forEach(task => {
      const taskStart = parse(task.startDate, 'yyyy-MM-dd', new Date());
      const taskEnd = parse(task.endDate, 'yyyy-MM-dd', new Date());
      
      if (taskStart < minDate) minDate = taskStart;
      if (taskEnd > maxDate) maxDate = taskEnd;
    });
  }
  
  // Add some padding to the date range
  minDate = addDays(minDate, -2);
  maxDate = addDays(maxDate, 2);
  
  // Create date tick array for the x-axis
  const ticks = [];
  let currentDate = minDate;
  while (currentDate <= maxDate) {
    ticks.push(format(currentDate, 'yyyy-MM-dd'));
    currentDate = addDays(currentDate, 7); // Weekly ticks
  }
  
  // Status colors
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
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-md shadow-md text-sm">
          <p className="font-semibold">{data.name}</p>
          <p>Sponsor: {data.sponsor}</p>
          <p>Type: {data.taskType}</p>
          <p>Status: {data.status}</p>
          <p>Duration: {data.duration} days</p>
          <p>Lead: {data.leadBuilder}</p>
          <p>Timeline: {data.startDate} to {data.endDate}</p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="w-full h-[400px] mt-4">
      <h3 className="text-lg font-medium mb-2">Task Timeline</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={ganttData}
          margin={{ top: 20, right: 30, left: 150, bottom: 20 }}
          barSize={20}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="startDate" 
            type="category" 
            ticks={ticks}
            tickFormatter={(tickItem) => format(parse(tickItem, 'yyyy-MM-dd', new Date()), 'MMM d')}
            allowDataOverflow={true}
          />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={120}
            tickFormatter={(value) => value.length > 15 ? `${value.substr(0, 15)}...` : value}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="duration" name="Duration">
            {ganttData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getStatusColor(entry.status || '')} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GanttChart;
