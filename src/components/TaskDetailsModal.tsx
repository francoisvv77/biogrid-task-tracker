import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { TaskData } from '@/services/smartsheetApi';
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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Edit, Save, X } from 'lucide-react';

interface TaskDetailsModalProps {
  task: TaskData | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated: () => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  task,
  isOpen,
  onClose,
  onTaskUpdated
}) => {
  const { teamMembers, taskStatuses, updateTask } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [taskData, setTaskData] = useState<TaskData | null>(task);
  const [activeTab, setActiveTab] = useState('details');
  const [isEditMode, setIsEditMode] = useState(false);

  // If task changes, update the state
  React.useEffect(() => {
    setTaskData(task);
    setIsEditMode(false); // Reset edit mode when task changes
  }, [task]);

  if (!taskData) return null;

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setTaskData(prev => {
      if (!prev) return prev;
      return { ...prev, [field]: value };
    });
  };

  const handleSave = async () => {
    if (!taskData) return;

    setIsLoading(true);
    try {
      const result = await updateTask(taskData);
      if (result) {
        toast.success('Task updated successfully');
        onTaskUpdated();
        setIsEditMode(false);
      } else {
        toast.error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl">Task Details</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Edit task information' : 'View task information'}
            </DialogDescription>
          </div>
          <div className="flex gap-2">
            {isEditMode ? null : (
              <Button size="sm" onClick={toggleEditMode}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="projectName">Project Name</Label>
                {isEditMode ? (
                  <Input 
                    id="projectName" 
                    value={taskData.projectName} 
                    onChange={(e) => handleInputChange('projectName', e.target.value)}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{taskData.projectName}</div>
                )}
              </div>
              <div>
                <Label htmlFor="sponsor">Sponsor</Label>
                {isEditMode ? (
                  <Input 
                    id="sponsor" 
                    value={taskData.sponsor} 
                    onChange={(e) => handleInputChange('sponsor', e.target.value)}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{taskData.sponsor}</div>
                )}
              </div>
              <div>
                <Label htmlFor="taskType">Task Type</Label>
                {isEditMode ? (
                  <Select 
                    value={taskData.taskType} 
                    onValueChange={(value) => handleInputChange('taskType', value)}
                  >
                    <SelectTrigger id="taskType">
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Build">Build</SelectItem>
                      <SelectItem value="Amendment">Amendment</SelectItem>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{taskData.taskType}</div>
                )}
              </div>
              <div>
                <Label htmlFor="edcSystem">EDC System</Label>
                {isEditMode ? (
                  <Input 
                    id="edcSystem" 
                    value={taskData.edcSystem} 
                    onChange={(e) => handleInputChange('edcSystem', e.target.value)}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{taskData.edcSystem}</div>
                )}
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                {isEditMode ? (
                  <Select 
                    value={taskData.priority || 'Medium'} 
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{taskData.priority || 'Medium'}</div>
                )}
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                {isEditMode ? (
                  <Select 
                    value={taskData.status || 'Pending Allocation'} 
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskStatuses.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{taskData.status || 'Pending Allocation'}</div>
                )}
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                {isEditMode ? (
                  <Input 
                    id="startDate" 
                    type="date" 
                    value={taskData.startDate} 
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{taskData.startDate}</div>
                )}
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                {isEditMode ? (
                  <Input 
                    id="endDate" 
                    type="date" 
                    value={taskData.endDate} 
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{taskData.endDate}</div>
                )}
              </div>
              <div>
                <Label htmlFor="scopedHours">Scoped Hours</Label>
                {isEditMode ? (
                  <Input 
                    id="scopedHours" 
                    type="number" 
                    min="0"
                    value={taskData.scopedHours} 
                    onChange={(e) => handleInputChange('scopedHours', parseInt(e.target.value) || 0)}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{taskData.scopedHours}</div>
                )}
              </div>
              <div>
                <Label htmlFor="integrations">Integrations</Label>
                {isEditMode ? (
                  <Input 
                    id="integrations" 
                    value={taskData.integrations} 
                    onChange={(e) => handleInputChange('integrations', e.target.value)}
                  />
                ) : (
                  <div className="p-2 border rounded-md bg-muted/20">{taskData.integrations || 'None'}</div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Description Tab */}
          <TabsContent value="description">
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Description</Label>
                {isEditMode ? (
                  <Textarea 
                    id="description" 
                    rows={10}
                    value={taskData.description} 
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="h-64"
                  />
                ) : (
                  <div className="p-4 border rounded-md bg-muted/20 h-64 overflow-y-auto whitespace-pre-wrap">
                    {taskData.description || 'No description provided.'}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-4">
            <div>
              <Label htmlFor="leadBuilder">Lead Builder</Label>
              {isEditMode ? (
                <Select 
                  value={taskData.allocated || ''} 
                  onValueChange={(value) => handleInputChange('allocated', value)}
                >
                  <SelectTrigger id="leadBuilder">
                    <SelectValue placeholder="Select lead builder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Not Assigned</SelectItem>
                    {teamMembers.map(member => (
                      <SelectItem key={member.id} value={member.name}>{member.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="p-2 border rounded-md bg-muted/20">
                  {taskData.allocated || 'Not assigned'}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Team Members</Label>
              {isEditMode ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-md p-3 bg-background">
                  {teamMembers.map(member => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id={`team-${member.id}`} 
                        checked={(taskData.team || []).includes(member.name)}
                        onChange={(e) => {
                          const newTeam = e.target.checked 
                            ? [...(taskData.team || []), member.name]
                            : (taskData.team || []).filter(name => name !== member.name);
                          handleInputChange('team', newTeam);
                        }}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <label htmlFor={`team-${member.id}`} className="text-sm">
                        {member.name}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded-md p-3 bg-muted/20">
                  {taskData.team && taskData.team.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-1">
                      {taskData.team.map((member, index) => (
                        <li key={index}>{member}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">No team members assigned</p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6">
          {isEditMode ? (
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditMode(false)} className="mr-2">
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-1" /> {isLoading ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          ) : (
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Close</Button>
            </DialogFooter>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailsModal; 