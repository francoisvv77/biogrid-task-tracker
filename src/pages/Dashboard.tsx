import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ClipboardList, 
  Hourglass, 
  Clock, 
  AlertCircle, 
  BarChart4,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import GanttChart from '@/components/GanttChart';
import TaskDetailsModal from '@/components/TaskDetailsModal';
import { TaskData } from '@/services/smartsheetApi';
import { MultiSelect } from "@/components/ui/multi-select";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, teamMembers, edcSystems, loading, error, refreshTasks } = useAppContext();
  
  // Filters
  const [edcFilter, setEdcFilter] = useState<string>('all');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [builderFilter, setBuilderFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  
  // Active card
  const [activeCard, setActiveCard] = useState<string | null>(null);
  
  // Modal state
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  // Calculate metrics
  const metrics = {
    total: tasks.length,
    pending: tasks.filter(task => task.status === 'Pending Allocation').length,
    inProgress: tasks.filter(task => task.status === 'In Progress').length,
    dueThisWeek: tasks.filter(task => {
      const endDate = new Date(task.endDate);
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      return endDate >= today && endDate <= nextWeek;
    }).length,
  };
  
  // Filtered tasks
  const filteredTasks = tasks.filter(task => {
    // Hide completed tasks by default unless toggle is enabled
    if (!showCompleted && task.status === 'Completed') return false;
    
    // EDC Filter
    if (edcFilter !== 'all' && task.edcSystem !== edcFilter) return false;
    
    // Status Filter
    if (statusFilters.length > 0 && !statusFilters.includes(task.status)) return false;
    
    // Builder Filter
    if (builderFilter !== 'all') {
      const isLeadBuilder = task.allocated === builderFilter;
      const isTeamMember = task.team?.includes(builderFilter);
      if (!isLeadBuilder && !isTeamMember) return false;
    }
    
    // Priority Filter
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    
    // Card Filter
    if (activeCard === 'pending' && task.status !== 'Pending Allocation') return false;
    if (activeCard === 'inProgress' && task.status !== 'In Progress') return false;
    if (activeCard === 'dueThisWeek') {
      const endDate = new Date(task.endDate);
      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      if (!(endDate >= today && endDate <= nextWeek)) return false;
    }
    
    // Search Term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        task.projectName.toLowerCase().includes(term) ||
        task.sponsor.toLowerCase().includes(term) ||
        task.description.toLowerCase().includes(term)
      );
    }
    
    return true;
  });
  
  // Refresh tasks on mount
  useEffect(() => {
    refreshTasks();
  }, []);
  
  // Handle card click
  const handleCardClick = (cardType: string) => {
    setActiveCard(activeCard === cardType ? null : cardType);
  };
  
  // Handle task card click for showing details modal
  const handleTaskClick = (task: TaskData) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };
  
  // Close modal and refresh tasks
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };
  
  // After task update, refresh the task list
  const handleTaskUpdated = () => {
    refreshTasks();
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of all tasks and their status
          </p>
        </div>
        <Button onClick={() => navigate('/new-request')}>New Request</Button>
      </div>
      
      {/* Metric Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Total Tasks */}
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${activeCard === 'total' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleCardClick('total')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart4 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground mt-1">All tasks</p>
          </CardContent>
        </Card>
        
        {/* Pending Allocation */}
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${activeCard === 'pending' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleCardClick('pending')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Allocation</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks awaiting allocation</p>
          </CardContent>
        </Card>
        
        {/* In Progress */}
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${activeCard === 'inProgress' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleCardClick('inProgress')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.inProgress}</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks currently being worked on</p>
          </CardContent>
        </Card>
        
        {/* Due This Week */}
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${activeCard === 'dueThisWeek' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleCardClick('dueThisWeek')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.dueThisWeek}</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks due in the next 7 days</p>
          </CardContent>
        </Card>
      </motion.div>
      
      {/* Gantt Chart */}
      <Card>
        <CardContent className="pt-6">
          <GanttChart tasks={filteredTasks} />
        </CardContent>
      </Card>
      
      {/* Filters */}
      <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <div className="flex gap-2 items-center">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 text-sm"
          />
        </div>
        
        <Select value={edcFilter} onValueChange={setEdcFilter}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="EDC System" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All EDC Systems</SelectItem>
            {edcSystems.map(system => (
              <SelectItem key={system} value={system}>{system}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <MultiSelect
          options={[
            { value: "Pending Allocation", label: "Pending Allocation" },
            { value: "Assigned", label: "Assigned" },
            { value: "In Progress", label: "In Progress" },
            { value: "In Validation", label: "In Validation" },
            { value: "Completed", label: "Completed" },
            { value: "On Hold", label: "On Hold" },
            { value: "Cancelled", label: "Cancelled" }
          ]}
          selected={statusFilters}
          onChange={setStatusFilters}
          placeholder="Status"
          className="h-9 text-sm"
        />
        
        <Select value={builderFilter} onValueChange={setBuilderFilter}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Builder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Builders</SelectItem>
            {teamMembers.map(member => (
              <SelectItem key={member.id} value={member.name}>{member.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Additional Filters */}
      <div className="flex items-center gap-2">
        <Checkbox 
          id="show-completed"
          checked={showCompleted}
          onCheckedChange={(checked) => setShowCompleted(checked === true)}
        />
        <label 
          htmlFor="show-completed" 
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Show completed tasks
        </label>
      </div>
      
      {/* Task List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Tasks</h2>
        
        {loading ? (
          <div className="text-center py-8">Loading tasks...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-500">{error}</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No tasks found matching the current filters</div>
        ) : (
          <div className="grid gap-3 grid-cols-1">
            {filteredTasks.map(task => (
              <Card key={task.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleTaskClick(task)}>
                <div className="p-4">
                  <div className="flex flex-wrap justify-between items-center mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                      <h3 className="text-sm font-medium truncate">{task.projectName}</h3>
                      <p className="text-xs text-muted-foreground truncate">{task.sponsor} • {task.edcSystem}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium
                        ${task.priority === 'Low' ? 'bg-blue-100 text-blue-700' : ''}
                        ${task.priority === 'Medium' ? 'bg-green-100 text-green-700' : ''}
                        ${task.priority === 'High' ? 'bg-orange-100 text-orange-700' : ''}
                        ${task.priority === 'Critical' ? 'bg-red-100 text-red-700' : ''}
                      `}>
                        {task.priority || 'Medium'}
                      </div>
                      <div className={`px-1.5 py-0.5 rounded-full text-xs font-medium
                        ${task.status === 'Pending Allocation' ? 'bg-orange-100 text-orange-700' : ''}
                        ${task.status === 'Assigned' ? 'bg-blue-100 text-blue-700' : ''}
                        ${task.status === 'In Progress' ? 'bg-purple-100 text-purple-700' : ''}
                        ${task.status === 'In Validation' ? 'bg-cyan-100 text-cyan-700' : ''}
                        ${task.status === 'Completed' ? 'bg-green-100 text-green-700' : ''}
                        ${task.status === 'On Hold' ? 'bg-gray-100 text-gray-700' : ''}
                        ${task.status === 'Cancelled' ? 'bg-red-100 text-red-700' : ''}
                      `}>
                        {task.status}
                      </div>
                      {task.status === 'Pending Allocation' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-6 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/allocate?taskId=${task.id}`);
                          }}
                        >
                          Allocate
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Start</p>
                      <p>{task.startDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End</p>
                      <p>{task.endDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lead</p>
                      <p className="truncate">{task.allocated || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Hours</p>
                      <p>{task.scopedHours}</p>
                    </div>
                  </div>
                  
                  {task.taskSubType && (
                    <div className="mt-1.5">
                      <p className="text-xs text-muted-foreground inline-block mr-1">Sub-Type:</p>
                      <p className="text-xs inline-block">{task.taskSubType}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Task Details Modal */}
      <TaskDetailsModal 
        task={selectedTask}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
};

export default Dashboard;
