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

const AllocateTasks: React.FC = () => {
  const location = useLocation();
  const { tasks, teamMembers, loading, error, allocateTask } = useAppContext();
  const [pendingTasks, setPendingTasks] = useState<TaskData[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [leadBuilder, setLeadBuilder] = useState<string>('');
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
    if (!selectedTask || !leadBuilder) {
      toast.error('Please select a lead builder');
      return;
    }
    
    setIsAllocating(true);
    
    try {
      const success = await allocateTask(
        selectedTask.id!,
        leadBuilder,
        selectedTeam
      );
      
      if (success) {
        toast.success(`Task allocated to ${leadBuilder}`);
        setDialogOpen(false);
      }
    } catch (error) {
      console.error('Error allocating task:', error);
      toast.error('Failed to allocate task. Please try again.');
    } finally {
      setIsAllocating(false);
    }
  };
  
  // Get builders only (exclude director and build manager)
  const builders = teamMembers.filter(member => member.role === 'Builder');
  
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
                          <p className="text-sm font-medium">Hours</p>
                          <p className="text-sm text-muted-foreground">{task.scopedHours}</p>
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
      
      {/* Allocation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Allocate Task</DialogTitle>
            <DialogDescription>
              Assign a lead builder and team members to this task
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
                      {builders.map(builder => (
                        <SelectItem key={builder.id} value={builder.name}>
                          {builder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Team Members</Label>
                  <div className="bg-muted/20 p-4 rounded-md space-y-2 max-h-[200px] overflow-y-auto">
                    {builders
                      .filter(builder => builder.name !== leadBuilder)
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
              disabled={!leadBuilder || isAllocating}
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
