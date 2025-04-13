import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Download, Clock, Loader2 } from "lucide-react";
import { Course } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { purchaseCourse, downloadCourse, toggleCourseLike, getCourseCoverUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CourseCardProps {
  course: Course;
  onUpdated?: () => void;
}

const CourseCard = ({ course, onUpdated }: CourseCardProps) => {
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [isLiking, setIsLiking] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [courseLiked, setCourseLiked] = useState(course.liked);
  const [likesCount, setLikesCount] = useState(course.likes_count || 0);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatPrice = (price: number) => {
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

    setIsLiking(true);
    try {
      const result = await toggleCourseLike(course.id);
      setCourseLiked(result.liked);
      setLikesCount(result.likes_count);
      if (onUpdated) onUpdated();
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

    setIsPurchasing(true);
    try {
      await purchaseCourse(course.id);
      toast({
        title: "Course purchased!",
        description: "You can now download this course",
      });
      if (onUpdated) onUpdated();
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

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/20 animate-slide-up opacity-0 h-full flex flex-col group">
      <Link to={`/courses/${course.id}`} className="relative">
        <div className="relative overflow-hidden aspect-video bg-muted">
          <img
            src={getCourseCoverUrl(course.id)}
            alt={course.title}
            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Badge className="absolute top-2 right-2 bg-primary">
            {formatPrice(course.price)}
          </Badge>
          <div className="absolute bottom-2 right-2 flex items-center space-x-1">
            <Clock className="h-3 w-3 text-white" />
            <span className="text-xs text-white">{formatDuration(course.duration_minutes)}</span>
          </div>
        </div>
      </Link>
      <CardHeader className="pb-2">
        <Link to={`/courses/${course.id}`} className="hover:underline">
          <h3 className="font-bold text-lg line-clamp-1">{course.title}</h3>
        </Link>
      </CardHeader>
      <CardContent className="flex-grow pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
      </CardContent>
      <CardFooter className="flex justify-between pt-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLike}
          disabled={isLiking}
          className={courseLiked ? "text-red-500" : ""}
        >
          {isLiking ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 mr-1 ${courseLiked ? "fill-red-500" : ""}`} />
          )}
          {likesCount}
        </Button>
        <div className="flex space-x-1">
          <Button
            variant="default"
            size="sm"
            onClick={handlePurchase}
            disabled={isPurchasing}
          >
            {isPurchasing ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              "Buy"
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CourseCard;
