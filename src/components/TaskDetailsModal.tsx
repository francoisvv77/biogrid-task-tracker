import React, { useState, useEffect } from 'react';
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
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'description' | 'team'>('details');
  const [isEditMode, setIsEditMode] = useState(false);

  // Initialize or update taskData when task changes
  useEffect(() => {
    if (task) {
      console.log("Task changed:", task);
      console.log("Original team data:", task.team, "is array:", Array.isArray(task.team));
      
      // Ensure team is always initialized as an array
      const initializedTask = {
        ...task,
        team: Array.isArray(task.team) ? [...task.team] : []
      };
      console.log("Initialized task team:", initializedTask.team);
      setTaskData(initializedTask);
    } else {
      setTaskData(null);
    }
    // Reset edit mode when task changes
    setIsEditMode(false);
  }, [task]);

  // Debug logging
  useEffect(() => {
    if (taskData) {
      console.log("Current state:", {
        taskId: taskData.id,
        activeTab,
        isEditMode,
        team: taskData.team
      });
    }
  }, [taskData, activeTab, isEditMode]);

  if (!taskData) return null;

  const handleInputChange = (field: string, value: string | number | string[]) => {
    console.log(`Updating ${field} with value:`, value);
    setTaskData(prev => {
      if (!prev) return null;
      return { ...prev, [field]: value };
    });
  };

  const handleSave = async () => {
    if (!taskData) return;

    // Ensure team is properly formatted before saving
    const dataToSave = {
      ...taskData,
      team: Array.isArray(taskData.team) ? taskData.team : []
    };

    setIsLoading(true);
    try {
      console.log("Saving task with data:", JSON.stringify(dataToSave, null, 2));
      const result = await updateTask(dataToSave);
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

  const handleToggleEditMode = () => {
    console.log("Toggling edit mode from", isEditMode, "to", !isEditMode, "on tab", activeTab);
    
    if (!isEditMode && taskData) {
      // Ensure team is properly initialized when entering edit mode
      setTaskData(prev => {
        if (!prev) return null;
        const team = Array.isArray(prev.team) ? [...prev.team] : [];
        console.log("Initializing team for edit mode:", team);
        return {
          ...prev,
          team
        };
      });
    }
    setIsEditMode(!isEditMode);
  };

  const updateTeamMember = (memberName: string, isSelected: boolean) => {
    if (!taskData) return;
    
    // Always start with a valid array
    const currentTeam = Array.isArray(taskData.team) ? [...taskData.team] : [];
    let newTeam;
    
    if (isSelected) {
      // Add member if not already in team
      newTeam = currentTeam.includes(memberName) 
        ? currentTeam 
        : [...currentTeam, memberName];
    } else {
      // Remove member
      newTeam = currentTeam.filter(name => name !== memberName);
    }
    
    console.log("Updating team from", currentTeam, "to", newTeam);
    handleInputChange('team', newTeam);
  };

  // Render the details tab content
  const renderDetailsTab = () => (
    <div className="space-y-4">
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
                <SelectItem value="New Build">New Build</SelectItem>
                <SelectItem value="Amendment">Amendment</SelectItem>
                <SelectItem value="Integration">Integration</SelectItem>
                <SelectItem value="RTSM Setup">RTSM Setup</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="p-2 border rounded-md bg-muted/20">{taskData.taskType}</div>
          )}
        </div>
        <div>
          <Label htmlFor="taskSubType">Task Sub-Type</Label>
          {isEditMode ? (
            <Select 
              value={taskData.taskSubType || ''} 
              onValueChange={(value) => handleInputChange('taskSubType', value)}
            >
              <SelectTrigger id="taskSubType">
                <SelectValue placeholder="Select task sub-type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="New Full Database Build">New Full Database Build</SelectItem>
                <SelectItem value="CRF/Form Updates">CRF/Form Updates</SelectItem>
                <SelectItem value="Edit Check Updates">Edit Check Updates</SelectItem>
                <SelectItem value="Custom Function Updates">Custom Function Updates</SelectItem>
                <SelectItem value="Visit Schedule Updates">Visit Schedule Updates</SelectItem>
                <SelectItem value="New External Data Integration">New External Data Integration</SelectItem>
                <SelectItem value="Migration of Existing Data">Migration of Existing Data</SelectItem>
                <SelectItem value="RTSM Setup">RTSM Setup</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="p-2 border rounded-md bg-muted/20">{taskData.taskSubType || 'Not specified'}</div>
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
        
        <div>
          <Label htmlFor="documentation">Documentation Links</Label>
          {isEditMode ? (
            <Textarea 
              id="documentation" 
              value={taskData.documentation || ''} 
              onChange={(e) => handleInputChange('documentation', e.target.value)}
              placeholder="Enter documentation links, one per line"
              className="min-h-[100px]"
            />
          ) : (
            <div className="p-2 border rounded-md bg-muted/20">
              {taskData.documentation ? (
                <div className="space-y-1">
                  {taskData.documentation.split('\n').map((link, index) => (
                    <div key={index} className="break-all">{link}</div>
                  ))}
                </div>
              ) : (
                'None'
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render the description tab content
  const renderDescriptionTab = () => (
    <div className="space-y-4 min-h-[300px]">
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
  );

  // Render the team tab content
  const renderTeamTab = () => (
    <div className="space-y-4 min-h-[300px]" key={`team-tab-content-${isEditMode ? 'edit' : 'view'}`}>
      <div>
        <Label htmlFor="leadBuilder">Lead Builder</Label>
        {isEditMode ? (
          <Select 
            value={taskData.allocated || '_none'} 
            onValueChange={(value) => handleInputChange('allocated', value === '_none' ? '' : value)}
          >
            <SelectTrigger id="leadBuilder">
              <SelectValue placeholder="Select lead builder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Not Assigned</SelectItem>
              {teamMembers.filter(member => member.role === 'BioGRID Designer').map(member => (
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

      <div>
        <Label htmlFor="leadCDS">Lead CDS</Label>
        {isEditMode ? (
          <Select 
            value={taskData.leadCDS || '_none'} 
            onValueChange={(value) => handleInputChange('leadCDS', value === '_none' ? '' : value)}
          >
            <SelectTrigger id="leadCDS">
              <SelectValue placeholder="Select lead CDS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Not Assigned</SelectItem>
              {teamMembers.filter(member => member.role === 'CDS').map(member => (
                <SelectItem key={member.id} value={member.name}>{member.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="p-2 border rounded-md bg-muted/20">
            {taskData.leadCDS || 'Not assigned'}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Team Members</Label>
        {isEditMode ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border rounded-md p-3 bg-background">
            {teamMembers
              .filter(member => 
                member.name !== taskData.allocated && 
                member.name !== taskData.leadCDS &&
                (member.role === 'BioGRID Designer' || member.role === 'CDS')
              )
              .map(member => {
              const teamArray = Array.isArray(taskData.team) ? taskData.team : [];
              const isChecked = teamArray.includes(member.name);
              
              return (
                <div key={member.id} className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id={`team-${member.id}`} 
                    checked={isChecked}
                    onChange={(e) => updateTeamMember(member.name, e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <label htmlFor={`team-${member.id}`} className="text-sm">
                    {member.name}
                  </label>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border rounded-md p-3 bg-muted/20 min-h-[200px]">
            {taskData.team && Array.isArray(taskData.team) && taskData.team.length > 0 ? (
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
    </div>
  );

  // Get current tab content based on activeTab
  const getTabContent = () => {
    console.log(`Rendering tab content for: ${activeTab}, isEditMode: ${isEditMode}, team: ${JSON.stringify(taskData.team)}`);
    
    switch(activeTab) {
      case 'details':
        return renderDetailsTab();
      case 'description':
        return renderDescriptionTab();
      case 'team':
        console.log('Rendering team tab content');
        const content = renderTeamTab();
        console.log('Team tab content rendered:', !!content);
        return content;
      default:
        return renderDetailsTab();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl">Task Details</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Edit task information' : 'View task information'}
            </DialogDescription>
          </div>
          <div className="flex gap-2">
            {isEditMode ? (
              <Button size="sm" variant="default" onClick={handleSave} disabled={isLoading}>
                <Save className="h-4 w-4 mr-1" /> {isLoading ? 'Saving...' : 'Save'}
              </Button>
            ) : (
              <Button size="sm" onClick={handleToggleEditMode}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Simple tab navigation buttons */}
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'details' ? 'border-b-2 border-primary' : ''}`}
            onClick={() => {
              console.log("Switching to details tab");
              setActiveTab('details');
            }}
          >
            Details
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'description' ? 'border-b-2 border-primary' : ''}`}
            onClick={() => {
              console.log("Switching to description tab");
              setActiveTab('description');
            }}
          >
            Description
          </button>
          <button
            className={`px-4 py-2 font-medium ${activeTab === 'team' ? 'border-b-2 border-primary' : ''}`}
            onClick={() => {
              console.log("Switching to team tab");
              // Force a small delay to ensure React has processed state changes
              setTimeout(() => {
                setActiveTab('team');
              }, 0);
            }}
          >
            Team
          </button>
        </div>

        {/* Tab content with key to force re-render */}
        <div className="py-2" key={`tab-content-${activeTab}-${isEditMode ? 'edit' : 'view'}`}>
          {getTabContent()}
        </div>

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