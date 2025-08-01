import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '@/context/AppContext';
import { TaskData } from '@/services/smartsheetApi';
import { useLocation } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const AllocateTasks: React.FC = () => {
  const location = useLocation();
  const { tasks, teamMembers, loading, error, allocateTask } = useAppContext();
  const [pendingTasks, setPendingTasks] = useState<TaskData[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leadBuilder, setLeadBuilder] = useState<string>('');
  const [leadCDS, setLeadCDS] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);
  const [isAllocating, setIsAllocating] = useState(false);
  
  // Get taskId from URL if present
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const taskId = queryParams.get('taskId');
    
    if (taskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskId);
      if (task) {
        setSelectedTask(task);
        setDialogOpen(true);
      }
    }
  }, [location.search, tasks]);
  
  // Filter pending tasks when tasks change
  useEffect(() => {
    if (tasks) {
      setPendingTasks(tasks.filter(task => task.status === 'Pending Allocation'));
    }
  }, [tasks]);
  
  // Reset form when dialog opens/closes or selected task changes
  useEffect(() => {
    if (dialogOpen && selectedTask) {
      setLeadBuilder('');
      setLeadCDS('');
      setSelectedTeam([]);
    }
  }, [dialogOpen, selectedTask]);
  
  // Handle task selection
  const handleTaskSelect = (task: TaskData) => {
    setSelectedTask(task);
    setDialogOpen(true);
  };
  
  // Handle team member selection
  const handleTeamMemberToggle = (memberName: string) => {
    setSelectedTeam(prev =>
      prev.includes(memberName)
        ? prev.filter(name => name !== memberName)
        : [...prev, memberName]
    );
  };
  
  // Handle allocation submission
  const handleAllocateSubmit = async () => {
    if (!selectedTask || (!leadBuilder && !leadCDS)) {
      toast.error('Please select at least one lead (Builder or CDS)');
      return;
    }
    
    setIsAllocating(true);
    
    try {
      const success = await allocateTask(
        selectedTask.id!,
        leadBuilder,
        leadCDS,
        selectedTeam
      );
      
      if (success) {
        const leads = [];
        if (leadBuilder) leads.push(`Lead Builder: ${leadBuilder}`);
        if (leadCDS) leads.push(`Lead CDS: ${leadCDS}`);
        const leadMessage = leads.length > 0 ? leads.join(', ') : 'team';
        toast.success(`Task allocated to ${leadMessage}`);
        setDialogOpen(false);
      }
    } catch (error) {
      console.error('Error allocating task:', error);
      toast.error('Failed to allocate task. Please try again.');
    } finally {
      setIsAllocating(false);
    }
  };
  
  // Get team members by role
  const biogridDesigners = teamMembers.filter(member => member.role === 'BioGRID Designer');
  const cdsMembers = teamMembers.filter(member => member.role === 'CDS');
  const allAssignableMembers = [...biogridDesigners, ...cdsMembers];

  // Function to check if date ranges overlap
  const dateRangesOverlap = (start1: string, end1: string, start2: string, end2: string) => {
    const s1 = new Date(start1);
    const e1 = new Date(end1);
    const s2 = new Date(start2);
    const e2 = new Date(end2);
    return s1 <= e2 && s2 <= e1;
  };

  // Get available resources based on task dates
  const getAvailableResources = (taskStartDate?: string, taskEndDate?: string) => {
    if (!taskStartDate || !taskEndDate) return allAssignableMembers;

    return allAssignableMembers.filter(builder => {
      // Get all active tasks (not completed or cancelled) assigned to this builder
      const builderTasks = tasks.filter(task => 
        (task.allocated === builder.name || (task.team && task.team.includes(builder.name))) &&
        !['Completed', 'Cancelled'].includes(task.status || '')
      );

      // If builder has no tasks, they are available
      if (builderTasks.length === 0) {
        return true;
      }

      // Check if any of the builder's tasks overlap with the new task's date range
      const hasOverlap = builderTasks.some(task => 
        dateRangesOverlap(
          taskStartDate,
          taskEndDate,
          task.startDate || '',
          task.endDate || ''
        )
      );

      // Builder is available if there are no overlapping tasks
      return !hasOverlap;
    });
  };

  // Get available resources for the selected task
  const availableResources = selectedTask 
    ? getAvailableResources(selectedTask.startDate, selectedTask.endDate)
    : allAssignableMembers;

  // Get all active tasks for a resource (for display purposes)
  const getActiveTasksForResource = (resourceName: string) => {
    return tasks.filter(task => 
      (task.allocated === resourceName || (task.team && task.team.includes(resourceName))) &&
      !['Completed', 'Cancelled'].includes(task.status || '')
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Allocate Tasks</h1>
        <p className="text-muted-foreground">
          Assign team members to pending tasks
        </p>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="p-12 text-center text-destructive">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      ) : pendingTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-muted/30 rounded-lg p-12 text-center"
        >
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <h2 className="text-xl font-medium mb-2">All Caught Up!</h2>
          <p className="text-muted-foreground">
            There are no pending tasks that need allocation at this time.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {pendingTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Card 
                  className="h-full cursor-pointer hover:shadow-md transition-all"
                  onClick={() => handleTaskSelect(task)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-yellow-400" />
                      {task.projectName}
                    </CardTitle>
                    <CardDescription>
                      {task.edcSystem} • {task.taskType}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Description</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Sponsor</p>
                          <p className="text-sm text-muted-foreground">{task.sponsor}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Programming Hours</p>
                          <p className="text-sm text-muted-foreground">{task.scopedHours}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">CDS Hours</p>
                          <p className="text-sm text-muted-foreground">{task.cdsHours || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Total Hours</p>
                          <p className="text-sm text-muted-foreground">{task.scopedHours + (task.cdsHours || 0)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Start</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(task.startDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">End</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(task.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="flex items-center justify-between w-full">
                      <p className="text-xs text-muted-foreground">
                        Requested by: {task.requestor}
                      </p>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskSelect(task);
                        }}
                      >
                        Allocate
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Available Resources Card */}
      <Card>
        <CardHeader>
          <CardTitle>Available Resources</CardTitle>
          <CardDescription>
            {selectedTask 
              ? `Team members available between ${new Date(selectedTask.startDate).toLocaleDateString()} and ${new Date(selectedTask.endDate).toLocaleDateString()}`
              : 'All team members and their current allocations'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Current Active Tasks</TableHead>
                  <TableHead>Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allAssignableMembers.map(resource => {
                  const activeTasks = getActiveTasksForResource(resource.name);
                  const isAvailable = availableResources.some(r => r.id === resource.id);

                  return (
                    <TableRow key={resource.id}>
                      <TableCell>{resource.name}</TableCell>
                      <TableCell>{resource.email}</TableCell>
                      <TableCell>{resource.role}</TableCell>
                      <TableCell>
                        {activeTasks.length === 0 ? (
                          <span className="text-green-600">No active tasks</span>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {activeTasks.map(task => (
                              <div key={task.id} className="mb-1">
                                {task.projectName} ({task.status})
                                <br />
                                <span className="text-xs">
                                  {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {selectedTask ? (
                          <span className={isAvailable ? "text-green-600" : "text-red-600"}>
                            {isAvailable ? "Available" : "Not Available"}
                          </span>
                        ) : (
                          <span className={activeTasks.length === 0 ? "text-green-600" : "text-yellow-600"}>
                            {activeTasks.length === 0 ? "Fully Available" : "Partially Available"}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Allocation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Allocate Task</DialogTitle>
            <DialogDescription>
                              Assign lead roles (Builder/CDS) and team members to this task
            </DialogDescription>
          </DialogHeader>
          
          {selectedTask && (
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <h3 className="font-medium">{selectedTask.projectName}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedTask.edcSystem} • {selectedTask.taskType}
                </p>
                <p className="text-sm">{selectedTask.description}</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lead-builder">Lead Builder</Label>
                  <Select value={leadBuilder} onValueChange={setLeadBuilder}>
                    <SelectTrigger id="lead-builder">
                      <SelectValue placeholder="Select lead builder" />
                    </SelectTrigger>
                    <SelectContent>
                      {biogridDesigners.map(builder => (
                        <SelectItem key={builder.id} value={builder.name}>
                          {builder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lead-cds">Lead CDS</Label>
                  <Select value={leadCDS} onValueChange={setLeadCDS}>
                    <SelectTrigger id="lead-cds">
                      <SelectValue placeholder="Select lead CDS" />
                    </SelectTrigger>
                    <SelectContent>
                      {cdsMembers.map(cds => (
                        <SelectItem key={cds.id} value={cds.name}>
                          {cds.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Team Members</Label>
                  <div className="bg-muted/20 p-4 rounded-md space-y-2 max-h-[200px] overflow-y-auto">
                    {allAssignableMembers
                      .filter(builder => builder.name !== leadBuilder && builder.name !== leadCDS)
                      .map(builder => (
                        <div key={builder.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`team-${builder.id}`}
                            checked={selectedTeam.includes(builder.name)}
                            onCheckedChange={() => handleTeamMemberToggle(builder.name)}
                          />
                          <Label
                            htmlFor={`team-${builder.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {builder.name}
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAllocateSubmit}
              disabled={(!leadBuilder && !leadCDS) || isAllocating}
            >
              {isAllocating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Allocating...
                </>
              ) : (
                'Allocate Task'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllocateTasks;
