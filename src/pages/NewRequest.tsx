
import React, { useState } from 'react';
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
  sponsor: z.string().min(1, 'Sponsor is required'),
  projectName: z.string().min(1, 'Study name is required'),
  priority: z.string().min(1, 'Priority is required'),
  edcSystem: z.string().min(1, 'EDC system is required'),
  integrations: z.string().optional(),
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
  const { addTask, edcSystems, requestors } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  // Default form values with current date for startDate and endDate
  const defaultValues: Partial<NewRequestFormValues> = {
    taskType: '',
    sponsor: '',
    projectName: '',
    priority: 'Medium',
    edcSystem: '',
    integrations: '',
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
  });
  
  // Handle form submission
  const onSubmit = async (data: NewRequestFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Generate unique IDs
      const taskId = generateUniqueId();
      
      // Format dates
      const startDateFormatted = format(data.startDate, 'yyyy-MM-dd');
      const endDateFormatted = format(data.endDate, 'yyyy-MM-dd');
      
      // Create task object
      const taskData: TaskData = {
        id: taskId,
        taskType: data.taskType,
        sponsor: data.sponsor,
        projectName: data.projectName,
        priority: data.priority,
        edcSystem: data.edcSystem,
        integrations: data.integrations || '',
        description: data.description,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        scopedHours: data.scopedHours,
        status: 'Pending Allocation',
        requestor: data.requestorName,
        requestorEmail: data.requestorEmail,
        requestorId: data.requestorId,
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
    const selectedRequestor = requestors.find(r => r.id === requestorId);
    if (selectedRequestor) {
      form.setValue('requestorId', selectedRequestor.id);
      form.setValue('requestorName', selectedRequestor.name);
      form.setValue('requestorEmail', selectedRequestor.email);
    }
  };
  
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
                            <SelectItem value="Build">Build</SelectItem>
                            <SelectItem value="Amendment">Amendment</SelectItem>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
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
                  
                  {/* Integrations */}
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
                          Optional - list any integrations or additional modules
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
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
                                  "pl-3 text-left font-normal",
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
                                  "pl-3 text-left font-normal",
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
                      <FormItem>
                        <FormLabel>Scoped Hours</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="Enter estimated hours" 
                            {...field} 
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
                              {requestors.map(requestor => (
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
                              <Input placeholder="Name will appear here" {...field} readOnly />
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
                                placeholder="Email will appear here" 
                                {...field} 
                                readOnly
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
