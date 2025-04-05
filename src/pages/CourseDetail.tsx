
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCourses, toggleCourseLike, purchaseCourse, downloadCourse } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Course } from "@/lib/types";
import { Heart, Download, Clock, Wallet, Loader2, ArrowLeft, User } from "lucide-react";

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const courseId = Number(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const loadCourse = async () => {
    setIsLoading(true);
    try {
      const data = await getCourses();
      const foundCourse = data?.find((c: Course) => c.id === courseId);
      
      if (foundCourse) {
        setCourse(foundCourse);
      } else {
        toast({
          title: "Course not found",
          description: "The requested course does not exist or has been removed",
          variant: "destructive",
        });
        navigate("/");
      }
    } catch (error) {
      console.error("Failed to load course:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourse();
  }, [courseId, isAuthenticated]);

  const formatDuration = (minutes?: number) => {
    if (!minutes) return "Duration not available";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatPrice = (price?: number) => {
    if (price === undefined) return "";
    return price.toLocaleString("en-US", {
      style: "currency",
      currency: "MWK",
    });
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Restricted Action",
        description: "Please login to like courses",
        variant: "destructive",
      });
      return;
    }

    if (!course) return;

    setIsLiking(true);
    try {
      const result = await toggleCourseLike(course.id);
      setCourse({
        ...course,
        liked: result.liked,
        likes_count: result.likes_count,
      });
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Restricted Action",
        description: "Please login to purchase courses",
        variant: "destructive",
      });
      return;
    }

    if (!course) return;

    setIsPurchasing(true);
    try {
      await purchaseCourse(course.id);
      toast({
        title: "Course purchased!",
        description: "You can now download this course",
      });
      
      // Reload course to update purchase status
      loadCourse();
    } catch (error) {
      console.error("Failed to purchase course:", error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleDownload = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Restricted Action",
        description: "Please login to download courses",
        variant: "destructive",
      });
      return;
    }

    if (!course) return;

    setIsDownloading(true);
    try {
      const blob = await downloadCourse(course.id);
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${course.title}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        toast({
          title: "Download iniciado",
          description: "Seu curso está sendo baixado",
        });
      }
    } catch (error) {
      console.error("Failed to download course:", error);
      toast({
        title: "Download Error",
        description: "You need to purchase the course first",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Course not found</h1>
        <p className="text-muted-foreground mb-6">
          The course you are looking for does not exist or has been removed.
        </p>
        <Button onClick={() => navigate("/")}>Back to home page</Button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] py-10">
      <div className="max-w-6xl mx-auto px-4">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to courses
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 animate-slide-up opacity-0">
            <div className="relative overflow-hidden rounded-lg aspect-video bg-muted mb-6">
              <img
                src={course.cover_image || "/placeholder.svg"}
                alt={course.title}
                className="object-cover w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>

            <h1 className="text-3xl font-bold mb-4">{course.title}</h1>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-muted-foreground mr-1" />
                <span className="text-muted-foreground">
                  {formatDuration(course.duration_minutes)}
                </span>
              </div>
              <div className="flex items-center">
                <User className="h-5 w-5 text-muted-foreground mr-1" />
                <span className="text-muted-foreground">
                  Instructor ID: {course.uploaded_by}
                </span>
              </div>
              <div className="flex items-center">
                <Heart
                  className={`h-5 w-5 mr-1 ${course.liked ? "fill-red-500 text-red-500" : "text-muted-foreground"}`}
                />
                <span className="text-muted-foreground">
                  {course.likes_count || 0} likes
                </span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-3">Descrição do Curso</h2>
              <p className="text-muted-foreground whitespace-pre-line">
                {course.description}
              </p>
            </div>
          </div>

          <div className="md:col-span-1 animate-slide-up opacity-0" style={{ animationDelay: "0.1s" }}>
            <div className="bg-muted rounded-lg p-6 shadow-lg border border-border sticky top-20">
              <div className="text-3xl font-bold mb-4">{formatPrice(course.price)}</div>

              <div className="space-y-4">
                <Button
                  className="w-full"
                  onClick={handlePurchase}
                  disabled={isPurchasing}
                >
                  {isPurchasing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="mr-2 h-4 w-4" />
                      Buy Course
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleDownload}
                  disabled={isDownloading}
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Preparing download...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  className={`w-full ${course.liked ? "text-red-500" : ""}`}
                  onClick={handleLike}
                  disabled={isLiking}
                >
                  {isLiking ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Heart
                      className={`h-4 w-4 mr-1 ${course.liked ? "fill-red-500" : ""}`}
                    />
                  )}
                  {course.liked ? "Remove like" : "Like course"}
                </Button>
              </div>

              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="font-semibold mb-2">What you'll receive:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-primary mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Lifetime access to course content</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-primary mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Regularly updated with new content</span>
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="h-5 w-5 text-primary mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span>Offline study content</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
