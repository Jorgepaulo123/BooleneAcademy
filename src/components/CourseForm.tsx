import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createCourse } from "@/lib/api";
import { isAuthenticated } from "@/lib/api";

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.string().refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0;
    },
    { message: "Price must be greater than zero" }
  ),
  duration_minutes: z.string().refine(
    (val) => {
      const num = Number(val);
      return !isNaN(num) && num > 0 && Number.isInteger(num);
    },
    { message: "Duration must be a positive integer" }
  ),
});

type FormValues = z.infer<typeof formSchema>;

interface CourseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CourseForm = ({ onSuccess, onCancel }: CourseFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [courseFile, setCourseFile] = useState<File | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    // Reset state on mount
    setIsLoading(false);
    setSubmitted(false);
    setAuthError(false);
    setCoverImage(null);
    setCourseFile(null);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      duration_minutes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    // Avoid duplicate submissions
    if (isLoading || submitted) {
      return;
    }
    
    // Check authentication
    if (!isAuthenticated()) {
      toast({
        title: "Boolene Academy - Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      });
      setAuthError(true);
      return;
    }
    
    console.log("Starting form submission", { values, isAuthenticated: true });
    
    if (!coverImage) {
      toast({
        title: "Boolene Academy - Image Required",
        description: "You must upload a cover image",
        variant: "destructive",
      });
      return;
    }

    if (!courseFile) {
      toast({
        title: "Boolene Academy - File Required",
        description: "You must upload a course file (ZIP)",
        variant: "destructive",
      });
      return;
    }

    if (!courseFile.name.endsWith('.zip')) {
      toast({
        title: "Boolene Academy - Invalid File Format",
        description: "Course file must be a ZIP file",
        variant: "destructive",
      });
      return;
    }

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(coverImage.type)) {
      toast({
        title: "Boolene Academy - Invalid File Format",
        description: "Cover image must be PNG or JPEG",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Sending data to API");
      const result = await createCourse(
        values.title,
        values.description,
        Number(values.price),
        Number(values.duration_minutes),
        coverImage,
        courseFile
      );
      
      console.log("API result:", result);
      
      if (!result) {
        throw new Error("Failed to create the course. Please try again later.");
      }

      setSubmitted(true);
      setIsLoading(false);
      console.log("Course created successfully");

      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 100);
    } catch (error: any) {
      console.error("Failed to create course:", error);
      
      const errorMessage = error.message || "Failed to create the course. Please check the fields and try again.";
      
      if (errorMessage.includes("Session Expired") || errorMessage.includes("log in again")) {
        setAuthError(true);
      }
      
      toast({
        title: "Boolene Academy - Error Creating Course",
        description: errorMessage,
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast({
          title: "Boolene Academy - Invalid File Format",
          description: "Cover image must be PNG or JPEG",
          variant: "destructive",
        });
        return;
      }
      setCoverImage(file);
    }
  };

  const handleCourseFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        toast({
          title: "Boolene Academy - Invalid File Format",
          description: "Course file must be a ZIP file",
          variant: "destructive",
        });
        return;
      }
      setCourseFile(file);
    }
  };

  if (authError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800">
        <h3 className="font-medium text-lg">Boolene Academy - Session Expired</h3>
        <p>Your session has expired. Please log in again to continue.</p>
        <Button 
          className="mt-4" 
          variant="outline" 
          onClick={() => window.location.href = "/login"}
        >
          Go to Login Page
        </Button>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-md text-green-800">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h3 className="font-medium text-lg">Boolene Academy - Course Created Successfully!</h3>
        </div>
        <p>The course has been submitted and is being processed.</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter the course title"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the course description"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price (in cents)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter price in cents"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duration_minutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (in minutes)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Enter duration in minutes"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Cover Image</FormLabel>
          <FormControl>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleCoverImageChange}
                disabled={isLoading}
              />
              {coverImage && (
                <span className="text-sm text-muted-foreground">
                  {coverImage.name}
                </span>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>

        <FormItem>
          <FormLabel>Course File (ZIP)</FormLabel>
          <FormControl>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".zip"
                onChange={handleCourseFileChange}
                disabled={isLoading}
              />
              {courseFile && (
                <span className="text-sm text-muted-foreground">
                  {courseFile.name}
                </span>
              )}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>

        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating course...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Create course
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};
