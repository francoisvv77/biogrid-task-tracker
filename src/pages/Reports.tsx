
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useAppContext } from '@/context/AppContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  CalendarDays, 
  Activity,
  FileBarChart,
  Download 
} from 'lucide-react';

// Reports page component
const Reports: React.FC = () => {
  const { tasks, edcSystems, teamMembers, loading } = useAppContext();
  const [activeTab, setActiveTab] = useState('resource-allocation');
  
  // Calculate metrics
  const tasksBySystem = edcSystems.map(system => ({
    name: system,
    value: tasks.filter(task => task.edcSystem === system).length
  }));
  
  const tasksByStatus = [
    { name: 'Pending', value: tasks.filter(task => task.status === 'Pending Allocation').length },
    { name: 'Assigned', value: tasks.filter(task => task.status === 'Assigned').length },
    { name: 'In Progress', value: tasks.filter(task => task.status === 'In Progress').length },
    { name: 'In Validation', value: tasks.filter(task => task.status === 'In Validation').length },
    { name: 'Completed', value: tasks.filter(task => task.status === 'Completed').length },
    { name: 'On Hold', value: tasks.filter(task => task.status === 'On Hold').length },
    { name: 'Cancelled', value: tasks.filter(task => task.status === 'Cancelled').length }
  ];
  
  // Calculate resource allocation
  const builders = teamMembers.filter(member => member.role === 'Builder');
  const resourceAllocation = builders.map(builder => {
    const assignedTasks = tasks.filter(task => 
      task.allocated === builder.name || 
      (task.team && task.team.includes(builder.name))
    );
    
    return {
      name: builder.name,
      tasks: assignedTasks.length,
      hours: assignedTasks.reduce((sum, task) => sum + (task.scopedHours || 0), 0)
    };
  });
  
  // Task deliverables
  const currentDate = new Date();
  const overdueDeliverables = tasks.filter(task => 
    new Date(task.endDate) < currentDate && 
    !['Completed', 'Cancelled'].includes(task.status || '')
  );
  
  const upcomingDeliverables = tasks.filter(task => {
    const endDate = new Date(task.endDate);
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(currentDate.getDate() + 14);
    
    return endDate >= currentDate && 
           endDate <= twoWeeksFromNow && 
           !['Completed', 'Cancelled'].includes(task.status || '');
  });
  
  // Available resources (builders with no tasks)
  const availableResources = builders.filter(builder => {
    return !tasks.some(task => 
      task.allocated === builder.name || 
      (task.team && task.team.includes(builder.name))
    );
  });
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analyze task data and team performance
          </p>
        </div>
        <Button className="flex items-center gap-2" variant="outline">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>
      
      <Tabs defaultValue="resource-allocation" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="resource-allocation" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span>Resource Allocation</span>
          </TabsTrigger>
          <TabsTrigger value="task-distribution" className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span>Task Distribution</span>
          </TabsTrigger>
          <TabsTrigger value="deliverables" className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            <span>Deliverables</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="mt-6 space-y-6">
          {/* Resource Allocation Tab */}
          <TabsContent value="resource-allocation" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    <span>Team Workload</span>
                  </CardTitle>
                  <CardDescription>
                    Tasks allocated to each team member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={resourceAllocation}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="tasks" fill="#0088FE" name="Tasks" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileBarChart className="h-5 w-5" />
                    <span>Hours Allocated</span>
                  </CardTitle>
                  <CardDescription>
                    Total scoped hours per team member
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={resourceAllocation}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="hours" fill="#00C49F" name="Scoped Hours" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Available Resources</CardTitle>
                  <CardDescription>
                    Team members with no assigned tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableResources.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">
                      All team members currently have assigned tasks
                    </p>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {availableResources.map(resource => (
                            <TableRow key={resource.id}>
                              <TableCell>{resource.name}</TableCell>
                              <TableCell>{resource.email}</TableCell>
                              <TableCell>{resource.role}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Task Distribution Tab */}
          <TabsContent value="task-distribution" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    <span>Tasks by EDC System</span>
                  </CardTitle>
                  <CardDescription>
                    Distribution of tasks across different EDC systems
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tasksBySystem.filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {tasksBySystem.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    <span>Tasks by Status</span>
                  </CardTitle>
                  <CardDescription>
                    Current status distribution of all tasks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tasksByStatus.filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={true}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {tasksByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Deliverables Tab */}
          <TabsContent value="deliverables" className="mt-0">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-destructive flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    <span>Overdue Deliverables</span>
                  </CardTitle>
                  <CardDescription>
                    Tasks that have passed their deadline
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {overdueDeliverables.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">
                      No overdue tasks found
                    </p>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>EDC</TableHead>
                            <TableHead>Lead</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {overdueDeliverables.map(task => (
                            <TableRow key={task.id}>
                              <TableCell>{task.projectName}</TableCell>
                              <TableCell>{task.taskType}</TableCell>
                              <TableCell>{task.edcSystem}</TableCell>
                              <TableCell>{task.allocated || '-'}</TableCell>
                              <TableCell className="text-destructive font-medium">
                                {new Date(task.endDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>{task.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    <span>Upcoming Deliverables</span>
                  </CardTitle>
                  <CardDescription>
                    Tasks due in the next two weeks
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingDeliverables.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">
                      No upcoming deliverables in the next two weeks
                    </p>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Project</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>EDC</TableHead>
                            <TableHead>Lead</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {upcomingDeliverables.map(task => (
                            <TableRow key={task.id}>
                              <TableCell>{task.projectName}</TableCell>
                              <TableCell>{task.taskType}</TableCell>
                              <TableCell>{task.edcSystem}</TableCell>
                              <TableCell>{task.allocated || '-'}</TableCell>
                              <TableCell>{new Date(task.endDate).toLocaleDateString()}</TableCell>
                              <TableCell>{task.status}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default Reports;
