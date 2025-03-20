
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
import { 
  ClipboardList, 
  Hourglass, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  BarChart4,
  Search,
  Filter
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import GanttChart from '@/components/GanttChart';
import { TaskData } from '@/services/smartsheetApi';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { tasks, teamMembers, edcSystems, loading, error, refreshTasks } = useAppContext();
  
  // Filters
  const [edcFilter, setEdcFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [builderFilter, setBuilderFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Active card
  const [activeCard, setActiveCard] = useState<string | null>(null);
  
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
    completed: tasks.filter(task => task.status === 'Completed').length,
  };
  
  // Filtered tasks
  const filteredTasks = tasks.filter(task => {
    // EDC Filter
    if (edcFilter !== 'all' && task.edcSystem !== edcFilter) return false;
    
    // Status Filter
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    
    // Builder Filter
    if (builderFilter !== 'all') {
      const isLeadBuilder = task.allocated === builderFilter;
      const isTeamMember = task.team?.includes(builderFilter);
      if (!isLeadBuilder && !isTeamMember) return false;
    }
    
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
    if (activeCard === 'completed' && task.status !== 'Completed') return false;
    
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
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
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
        
        {/* Completed */}
        <Card className={`cursor-pointer hover:shadow-md transition-shadow ${activeCard === 'completed' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => handleCardClick('completed')}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.completed}</div>
            <p className="text-xs text-muted-foreground mt-1">Tasks that have been completed</p>
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
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
        <div className="flex gap-2 items-center">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Select value={edcFilter} onValueChange={setEdcFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by EDC System" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All EDC Systems</SelectItem>
            {edcSystems.map(system => (
              <SelectItem key={system} value={system}>{system}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Pending Allocation">Pending Allocation</SelectItem>
            <SelectItem value="Assigned">Assigned</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="In Validation">In Validation</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
            <SelectItem value="On Hold">On Hold</SelectItem>
            <SelectItem value="Cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={builderFilter} onValueChange={setBuilderFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by Builder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Builders</SelectItem>
            {teamMembers.map(member => (
              <SelectItem key={member.id} value={member.name}>{member.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <div className="grid gap-4 grid-cols-1">
            {filteredTasks.map(task => (
              <Card key={task.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">{task.projectName}</CardTitle>
                      <CardDescription>{task.sponsor} • {task.edcSystem}</CardDescription>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium
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
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm mb-2 line-clamp-2">{task.description}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Start Date</p>
                      <p>{task.startDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">End Date</p>
                      <p>{task.endDate}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Lead Builder</p>
                      <p>{task.allocated || 'Not assigned'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Scoped Hours</p>
                      <p>{task.scopedHours}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end pt-0">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/allocate-tasks?taskId=${task.id}`)}
                  >
                    {task.status === 'Pending Allocation' ? 'Allocate' : 'View Details'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
