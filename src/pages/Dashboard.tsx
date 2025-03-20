
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Filter, 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle,
  ListChecks,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TaskData } from '@/services/smartsheetApi';

// Dashboard stat card component
interface StatCardProps {
  title: string;
  value: number;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  active: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  onClick,
  active
}) => (
  <motion.div
    whileHover={{ y: -5, transition: { duration: 0.2 } }}
    whileTap={{ scale: 0.98 }}
  >
    <Card 
      className={`h-full cursor-pointer transition-all ${
        active ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2.5 rounded-full ${active ? 'bg-primary/10 text-primary' : 'bg-gray-100'}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        <CardDescription className="text-xs mt-1">{description}</CardDescription>
      </CardContent>
    </Card>
  </motion.div>
);

// Helper functions for task filtering
const isTaskDueThisWeek = (endDate: string) => {
  const today = new Date();
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay()));
  
  const taskEndDate = new Date(endDate);
  return taskEndDate >= today && taskEndDate <= endOfWeek;
};

const isTaskOverdue = (endDate: string, status: string) => {
  const today = new Date();
  const taskEndDate = new Date(endDate);
  
  return taskEndDate < today && !['Completed', 'Cancelled'].includes(status || '');
};

// Dashboard page component
const Dashboard: React.FC = () => {
  const { tasks, edcSystems, teamMembers, loading, error, refreshTasks } = useAppContext();
  const [filteredTasks, setFilteredTasks] = useState<TaskData[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  
  // Filter states
  const [systemFilter, setSystemFilter] = useState<string>('');
  const [builderFilter, setBuilderFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // Task counts
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.status === 'Pending Allocation').length;
  const tasksInProgress = tasks.filter(task => ['Assigned', 'In Progress', 'In Validation'].includes(task.status || '')).length;
  const overdueTasks = tasks.filter(task => isTaskOverdue(task.endDate, task.status || '')).length;
  const tasksDueThisWeek = tasks.filter(task => isTaskDueThisWeek(task.endDate)).length;
  
  // Filter tasks based on selected filters
  useEffect(() => {
    let filtered = [...tasks];
    
    // Apply system filter
    if (systemFilter) {
      filtered = filtered.filter(task => task.edcSystem === systemFilter);
    }
    
    // Apply builder filter
    if (builderFilter) {
      filtered = filtered.filter(task => 
        task.allocated === builderFilter || 
        (task.team && task.team.includes(builderFilter))
      );
    }
    
    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(task => task.status === statusFilter);
    }
    
    // Apply card filter
    if (activeFilter === 'pending') {
      filtered = filtered.filter(task => task.status === 'Pending Allocation');
    } else if (activeFilter === 'in-progress') {
      filtered = filtered.filter(task => 
        ['Assigned', 'In Progress', 'In Validation'].includes(task.status || '')
      );
    } else if (activeFilter === 'overdue') {
      filtered = filtered.filter(task => isTaskOverdue(task.endDate, task.status || ''));
    } else if (activeFilter === 'due-this-week') {
      filtered = filtered.filter(task => isTaskDueThisWeek(task.endDate));
    }
    
    setFilteredTasks(filtered);
  }, [tasks, systemFilter, builderFilter, statusFilter, activeFilter]);
  
  // Handle filter changes
  const handleCardFilter = (filter: string) => {
    setActiveFilter(filter === activeFilter ? 'all' : filter);
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSystemFilter('');
    setBuilderFilter('');
    setStatusFilter('');
    setActiveFilter('all');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Track and manage your build tasks
          </p>
        </div>
        <Button 
          className="flex items-center gap-2" 
          size="sm"
          onClick={() => refreshTasks()}
        >
          <Loader2 className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Tasks"
          value={totalTasks}
          description="All tasks"
          icon={<ListChecks className="h-4 w-4" />}
          onClick={() => handleCardFilter('all')}
          active={activeFilter === 'all'}
        />
        <StatCard
          title="Pending Allocation"
          value={pendingTasks}
          description="Tasks waiting for team allocation"
          icon={<Clock className="h-4 w-4" />}
          onClick={() => handleCardFilter('pending')}
          active={activeFilter === 'pending'}
        />
        <StatCard
          title="In Progress"
          value={tasksInProgress}
          description="Tasks currently being worked on"
          icon={<CheckCircle className="h-4 w-4" />}
          onClick={() => handleCardFilter('in-progress')}
          active={activeFilter === 'in-progress'}
        />
        <StatCard
          title="Overdue"
          value={overdueTasks}
          description="Tasks past their deadline"
          icon={<AlertCircle className="h-4 w-4" />}
          onClick={() => handleCardFilter('overdue')}
          active={activeFilter === 'overdue'}
        />
        <StatCard
          title="Due This Week"
          value={tasksDueThisWeek}
          description="Tasks due in the next 7 days"
          icon={<Calendar className="h-4 w-4" />}
          onClick={() => handleCardFilter('due-this-week')}
          active={activeFilter === 'due-this-week'}
        />
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
          <Select value={systemFilter} onValueChange={setSystemFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="EDC System" />
            </SelectTrigger>
            <SelectContent>
              {edcSystems.map(system => (
                <SelectItem key={system} value={system}>
                  {system}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={builderFilter} onValueChange={setBuilderFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Builder" />
            </SelectTrigger>
            <SelectContent>
              {teamMembers.map(member => (
                <SelectItem key={member.id} value={member.name}>
                  {member.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending Allocation">Pending Allocation</SelectItem>
              <SelectItem value="Assigned">Assigned</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="In Validation">In Validation</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button variant="outline" size="sm" onClick={resetFilters}>
          Reset
        </Button>
      </div>
      
      {/* Tasks table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-medium">Task List</h2>
          <p className="text-sm text-muted-foreground">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No tasks found matching the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Study</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">EDC</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Lead</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Start Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">End Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredTasks.map((task, index) => (
                  <motion.tr 
                    key={task.id}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="px-4 py-3 text-sm whitespace-nowrap">{task.id}</td>
                    <td className="px-4 py-3 text-sm">{task.projectName}</td>
                    <td className="px-4 py-3 text-sm">{task.edcSystem}</td>
                    <td className="px-4 py-3 text-sm">{task.allocated || '-'}</td>
                    <td className="px-4 py-3 text-sm">{new Date(task.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm">
                      <span 
                        className={
                          isTaskOverdue(task.endDate, task.status || '') 
                            ? 'text-destructive font-medium' 
                            : ''
                        }
                      >
                        {new Date(task.endDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${task.status === 'Pending Allocation' ? 'bg-yellow-100 text-yellow-800' :
                          task.status === 'Assigned' ? 'bg-blue-100 text-blue-800' :
                          task.status === 'In Progress' ? 'bg-indigo-100 text-indigo-800' :
                          task.status === 'In Validation' ? 'bg-purple-100 text-purple-800' :
                          task.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          task.status === 'On Hold' ? 'bg-gray-100 text-gray-800' :
                          task.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.status}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
