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
  amendmentNr: z.string().optional(),
  taskSubType: z.string().min(1, 'Task sub-type is required'),
  projectId: z.string().optional(),
  sponsor: z.string().min(1, 'Sponsor is required'),
  projectName: z.string().min(1, 'Study name is required'),
  priority: z.string().min(1, 'Priority is required'),
  edcSystem: z.string().min(1, 'EDC system is required'),
  externalData: z.string().optional(),
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required',
  }),
  programmingScopedHours: z.coerce.number().min(1, 'Programming scoped hours are required'),
  cdsScopedHours: z.coerce.number().min(0, 'CDS scoped hours cannot be negative').optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  requestorId: z.string().min(1, 'Requestor is required'),
  requestorName: z.string().min(1, 'Requestor name is required'),
  requestorEmail: z.string().email('Please enter a valid email address'),
});

type NewRequestFormValues = z.infer<typeof newRequestSchema>;

interface DocumentEntry {
  documentType: string;
  documentPath: string;
}

const NewRequest: React.FC = () => {
  const { addTask, edcSystems, requestors, addRequestor } = useAppContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewRequestor, setIsNewRequestor] = useState(false);
  const [documentEntries, setDocumentEntries] = useState<DocumentEntry[]>([
    { documentType: '', documentPath: '' }
  ]);
  const navigate = useNavigate();
  
  // Default form values with current date for startDate and endDate
  const defaultValues: Partial<NewRequestFormValues> = {
    taskType: '',
    amendmentNr: '',
    taskSubType: '',
    projectId: '',
    sponsor: '',
    projectName: '',
    priority: 'Medium',
    edcSystem: '',
    externalData: '',
    startDate: new Date(),
    endDate: new Date(),
    programmingScopedHours: 0,
    cdsScopedHours: 0,
    description: '',
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
  
  // Handle adding a new document entry
  const handleAddDocumentEntry = () => {
    setDocumentEntries([...documentEntries, { documentType: '', documentPath: '' }]);
  };

  // Handle removing a document entry
  const handleRemoveDocumentEntry = (index: number) => {
    if (documentEntries.length > 1) {
      setDocumentEntries(documentEntries.filter((_, i) => i !== index));
    }
  };

  // Handle updating a document entry
  const handleUpdateDocumentEntry = (index: number, field: keyof DocumentEntry, value: string) => {
    const updatedEntries = [...documentEntries];
    updatedEntries[index][field] = value;
    setDocumentEntries(updatedEntries);
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
      
      // Create concatenated documentation string from all document entries
      const documentation = documentEntries
        .filter(entry => entry.documentType && entry.documentPath)
        .map(entry => `${entry.documentType}:${entry.documentPath}`)
        .join('; ');
      
      // Create task object
      const taskData: TaskData = {
        id: taskId,
        taskType: data.taskType,
        amendmentNr: data.amendmentNr,
        taskSubType: data.taskSubType,
        projectId: data.projectId,
        sponsor: data.sponsor,
        projectName: data.projectName,
        priority: data.priority,
        edcSystem: data.edcSystem,
        externalData: data.externalData,
        documentation: documentation,
        startDate: startDateFormatted,
        endDate: endDateFormatted,
        scopedHours: data.programmingScopedHours,
        cdsHours: data.cdsScopedHours || 0,
        description: data.description,
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
          Submit a new request
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
                            <SelectItem value="BioGRID Initial Build">BioGRID Initial Build</SelectItem>
                            <SelectItem value="BioGRID Amendment">BioGRID Amendment</SelectItem>
                            <SelectItem value="BioGRID DM Build">BioGRID DM Build</SelectItem>
                            <SelectItem value="BioGRID DM Amendment">BioGRID DM Amendment</SelectItem>
                            <SelectItem value="BioGRID ATR Build">BioGRID ATR Build</SelectItem>
                            <SelectItem value="BioGRID ATR Amendment">BioGRID ATR Amendment</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Amendment Nr */}
                  <FormField
                    control={form.control}
                    name="amendmentNr"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amendment Nr</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter amendment number" {...field} />
                        </FormControl>
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
                            <SelectItem value="Status Dashboards">Status Dashboards</SelectItem>
                            <SelectItem value="Customized Dashboards ( incl. STD)">Customized Dashboards ( incl. STD)</SelectItem>
                            <SelectItem value="Patient Profiles">Patient Profiles</SelectItem>
                            <SelectItem value="ATR Dashboards">ATR Dashboards</SelectItem>
                            <SelectItem value="Recon Dashboards">Recon Dashboards</SelectItem>
                            <SelectItem value="Amend dashboards">Amend dashboards</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Project ID */}
                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter project ID" {...field} />
                        </FormControl>
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
                  
                  {/* External Data */}
                  <FormField
                    control={form.control}
                    name="externalData"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>External Data</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter external data information" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Documentation Section */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Documentation</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddDocumentEntry}
                      size="sm"
                    >
                      Add Document
                    </Button>
                  </div>
                  
                  {documentEntries.map((entry, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Document Type
                        </label>
                        <Select 
                          value={entry.documentType} 
                          onValueChange={(value) => handleUpdateDocumentEntry(index, 'documentType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Specs">Specs</SelectItem>
                            <SelectItem value="Protocol">Protocol</SelectItem>
                            <SelectItem value="Annotation">Annotation</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium">
                            Path to Documentation
                          </label>
                          {documentEntries.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleRemoveDocumentEntry(index)}
                              className="h-6 w-6 p-0"
                            >
                              ✕
                            </Button>
                          )}
                        </div>
                        <Input
                          placeholder="Enter path to documentation"
                          value={entry.documentPath}
                          onChange={(e) => handleUpdateDocumentEntry(index, 'documentPath', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                  
                  <p className="text-sm text-muted-foreground">
                    Add document types and their corresponding paths. All entries will be saved together.
                  </p>
                </div>
                
                {/* Date and Hours */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                  
                  {/* Programming Scoped Hours */}
                  <FormField
                    control={form.control}
                    name="programmingScopedHours"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-start">
                        <FormLabel>Programming Scoped Hours</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="1"
                            placeholder="Enter hours" 
                            {...field} 
                            className="h-10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* CDS Scoped Hours */}
                  <FormField
                    control={form.control}
                    name="cdsScopedHours"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-start">
                        <FormLabel>CDS Scoped Hours</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="Enter hours" 
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
