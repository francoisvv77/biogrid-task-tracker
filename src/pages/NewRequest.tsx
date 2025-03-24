import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { TaskData, generateUniqueId } from '@/services/smartsheetApi';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Form schema for new request
const newRequestSchema = z.object({
  taskType: z.string().min(1, 'Task type is required'),
  taskSubType: z.string().min(1, 'Task sub-type is required'),
  sponsor: z.string().min(1, 'Sponsor is required'),
  projectName: z.string().min(1, 'Study name is required'),
  priority: z.string().min(1, 'Priority is required'),
  edcSystem: z.string().min(1, 'EDC system is required'),
  integrations: z.string().optional(),
  documentation: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  scopedHours: z.coerce.number().min(1, 'Scoped hours are required'),
  requestorId: z.string().min(1, 'Requestor is required'),
  requestorName: z.string().min(1, 'Requestor name is required'),
  requestorEmail: z.string().email('Please enter a valid email address'),
});

type NewRequestFormValues = z.infer<typeof newRequestSchema>;

const NewRequest: React.FC = () => {
  const { addTask, edcSystems, requestors, addRequestor } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewRequestor, setIsNewRequestor] = useState(false);
  const [documentationPaths, setDocumentationPaths] = useState<string[]>([]);
  const [newPath, setNewPath] = useState('');
  const navigate = useNavigate();
  
  // Default form values with current date for startDate and endDate
  const defaultValues: Partial<NewRequestFormValues> = {
    taskType: '',
    taskSubType: '',
    sponsor: '',
    projectName: '',
    priority: 'Medium',
    edcSystem: '',
    integrations: '',
    documentation: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(),
    scopedHours: 0,
    requestorId: '',
    requestorName: '',
    requestorEmail: '',
  };
  
  // Initialize form
  const form = useForm<NewRequestFormValues>({
    resolver: zodResolver(newRequestSchema),
    defaultValues,
    mode: 'onChange',
  });
  
  // Watch for task sub-type to conditionally show fields
  const taskSubType = form.watch('taskSubType');
  
  // Handle adding a new documentation path
  const handleAddDocumentationPath = () => {
    if (!newPath.trim()) return;
    
    setDocumentationPaths(prev => [...prev, newPath.trim()]);
    setNewPath('');
    
    // Update the form field with all paths joined
    const updatedPaths = [...documentationPaths, newPath.trim()].join('\n');
    form.setValue('documentation', updatedPaths);
  };
  
  // Handle removing a documentation path
  const handleRemoveDocumentationPath = (indexToRemove: number) => {
    setDocumentationPaths(prev => {
      const newPaths = prev.filter((_, index) => index !== indexToRemove);
      const updatedPathsString = newPaths.join('\n');
      form.setValue('documentation', updatedPathsString);
      return newPaths;
    });
  };
  
  // Handle select file for documentation
  const handleSelectFile = () => {
    // Create a file input element for selecting files
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    
    fileInput.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        const file = target.files[0];
        
        // Just use the file name without simulating a path
        setNewPath(file.name);
      }
      
      // Clear the file input to prevent uploads
      fileInput.value = '';
    };
    
    fileInput.click();
  };
  
  // Handle form submission
  const onSubmit = async (data: NewRequestFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Handle new requestor creation if needed
      if (isNewRequestor) {
        const newRequestorResult = await addRequestor({
          name: data.requestorName,
          email: data.requestorEmail
        });
        
        if (newRequestorResult) {
          toast.success(`Added new requestor: ${data.requestorName}`);
          // We don't need to update the requestorId as it will be properly set below
        } else {
          toast.error('Failed to add new requestor');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Generate unique IDs
      const taskId = generateUniqueId();
      
      // Format dates
      const startDateFormatted = format(data.startDate, 'yyyy-MM-dd');
      const endDateFormatted = format(data.endDate, 'yyyy-MM-dd');
      
      // Ensure documentation paths are joined
      const documentationString = documentationPaths.length > 0 
        ? documentationPaths.join('\n') 
        : data.documentation || '';
      
      // Create task object
      const taskData: TaskData = {
        id: taskId,
        taskType: data.taskType,
        taskSubType: data.taskSubType,
        sponsor: data.sponsor,
        projectName: data.projectName,
        priority: data.priority,
        edcSystem: data.edcSystem,
        integrations: data.integrations || '',
        documentation: documentationString,
        description: data.description,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        scopedHours: data.scopedHours,
        status: 'Pending Allocation',
        requestor: data.requestorName,
        requestorEmail: data.requestorEmail,
        requestorId: isNewRequestor ? generateUniqueId() : data.requestorId,
      };
      
      console.log("Submitting task:", taskData);
      
      // Submit the task
      const result = await addTask(taskData);
      
      if (result) {
        toast.success('Request submitted successfully!');
        navigate('/');
      } else {
        toast.error('Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Watch start date to ensure end date is after start date
  const startDate = form.watch('startDate');

  // Helper function for requestor selection
  const handleRequestorSelect = (requestorId: string) => {
    if (requestorId === 'new') {
      setIsNewRequestor(true);
      form.setValue('requestorId', 'new');
      form.setValue('requestorName', '');
      form.setValue('requestorEmail', '');
      
      // Make the fields editable
      setTimeout(() => {
        const nameInput = document.querySelector('[name="requestorName"]') as HTMLInputElement;
        const emailInput = document.querySelector('[name="requestorEmail"]') as HTMLInputElement;
        if (nameInput) nameInput.readOnly = false;
        if (emailInput) emailInput.readOnly = false;
      }, 0);
    } else {
      setIsNewRequestor(false);
      const selectedRequestor = requestors.find(r => r.id === requestorId);
      if (selectedRequestor) {
        form.setValue('requestorId', selectedRequestor.id);
        form.setValue('requestorName', selectedRequestor.name);
        form.setValue('requestorEmail', selectedRequestor.email);
      }
    }
  };
  
  // Effect to update requestor fields' readonly status when isNewRequestor changes
  useEffect(() => {
    const nameInput = document.querySelector('[name="requestorName"]') as HTMLInputElement;
    const emailInput = document.querySelector('[name="requestorEmail"]') as HTMLInputElement;
    
    if (nameInput) nameInput.readOnly = !isNewRequestor;
    if (emailInput) emailInput.readOnly = !isNewRequestor;
  }, [isNewRequestor]);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Request</h1>
        <p className="text-muted-foreground">
          Submit a new build or amendment request
        </p>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
            <CardDescription>
              Please provide all the necessary information about your request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Task Type */}
                  <FormField
                    control={form.control}
                    name="taskType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select task type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="New Build">New Build</SelectItem>
                            <SelectItem value="Amendment">Amendment</SelectItem>
                            <SelectItem value="Integration">Integration</SelectItem>
                            <SelectItem value="RTSM Setup">RTSM Setup</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Task Sub-Type */}
                  <FormField
                    control={form.control}
                    name="taskSubType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Sub-Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select task sub-type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="New Full Database Build">New Full Database Build</SelectItem>
                            <SelectItem value="CRF/Form Updates">CRF/Form Updates</SelectItem>
                            <SelectItem value="Edit Check Updates">Edit Check Updates</SelectItem>
                            <SelectItem value="Custom Function Updates">Custom Function Updates</SelectItem>
                            <SelectItem value="Visit Schedule Updates">Visit Schedule Updates</SelectItem>
                            <SelectItem value="New External Data Integration">New External Data Integration</SelectItem>
                            <SelectItem value="Migration of Existing Data">Migration of Existing Data</SelectItem>
                            <SelectItem value="RTSM Setup">RTSM Setup</SelectItem>
                            <SelectItem value="Integration">Integration</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        
                        {/* Integrations/Modules - only visible when Integration is selected */}
                        {taskSubType === 'Integration' && (
                          <div className="mt-2">
                            <FormField
                              control={form.control}
                              name="integrations"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Integrations/Modules</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter integrations or modules" {...field} />
                                  </FormControl>
                                  <FormDescription>
                                    List the integrations or modules required for this task
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                  
                  {/* Sponsor */}
                  <FormField
                    control={form.control}
                    name="sponsor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sponsor</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter sponsor name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Study Name */}
                  <FormField
                    control={form.control}
                    name="projectName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Study Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter study name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Priority */}
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* EDC System */}
                  <FormField
                    control={form.control}
                    name="edcSystem"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>EDC System</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select EDC system" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {edcSystems.map(system => (
                              <SelectItem key={system} value={system}>
                                {system}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Documentation Paths */}
                <div className="space-y-3">
                  <FormField
                    control={form.control}
                    name="documentation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Path(s) to Documentation</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input 
                              placeholder="Enter path to documentation" 
                              value={newPath}
                              onChange={(e) => setNewPath(e.target.value)}
                              className="flex-1"
                              id="documentationPaths"
                            />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={handleSelectFile}
                          >
                            Browse
                          </Button>
                          <Button 
                            type="button" 
                            onClick={handleAddDocumentationPath}
                            disabled={!newPath.trim()}
                          >
                            Add
                          </Button>
                        </div>
                        <FormDescription>
                          Add paths to relevant documentation for this request
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {documentationPaths.length > 0 && (
                    <div className="bg-muted/20 rounded-md p-3 space-y-2">
                      <p className="text-sm font-medium">Added Documentation:</p>
                      <ul className="space-y-2">
                        {documentationPaths.map((path, index) => (
                          <li key={index} className="flex justify-between items-center text-sm bg-background p-2 rounded">
                            <span className="truncate flex-1">{path}</span>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemoveDocumentationPath(index)}
                              className="h-7 w-7 p-0"
                            >
                              ✕
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Date and Hours */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Start Date */}
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Start Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                // Auto-focus on end date after selecting start date
                                setTimeout(() => {
                                  const endDateButton = document.querySelector('[name="endDate"]')?.closest('.flex.flex-col')?.querySelector('button');
                                  if (endDateButton) {
                                    (endDateButton as HTMLButtonElement).click();
                                  }
                                }, 100);
                              }}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* End Date */}
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>End Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < startDate}
                              initialFocus
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Scoped Hours */}
                  <FormField
                    control={form.control}
                    name="scopedHours"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-start">
                        <FormLabel>Scoped Hours</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="Enter estimated hours" 
                            {...field} 
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide a detailed description of your request" 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Requestor Information */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <h3 className="font-medium mb-4">Requestor Information</h3>
                  
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="requestorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Requestor</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              handleRequestorSelect(value);
                            }} 
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a requestor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem key="new" value="new">
                                + New Requestor
                              </SelectItem>
                              {requestors
                                .filter((requestor, index, self) => 
                                  self.findIndex(r => r.name === requestor.name) === index
                                )
                                .map(requestor => (
                                <SelectItem key={requestor.id} value={requestor.id}>
                                  {requestor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                          {requestors.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              No requestors available. Add requestors in Settings.
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="requestorName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requestor Name</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder={isNewRequestor ? "Enter requestor name" : "Name will appear here"} 
                                {...field} 
                                readOnly={!isNewRequestor}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="requestorEmail"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Requestor Email</FormLabel>
                            <FormControl>
                              <Input 
                                type="email"
                                placeholder={isNewRequestor ? "Enter requestor email" : "Email will appear here"}
                                {...field} 
                                readOnly={!isNewRequestor}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/')}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default NewRequest;
