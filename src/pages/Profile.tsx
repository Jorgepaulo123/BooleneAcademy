import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { updateProfilePicture, getProfilePictureUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [profilePicture, setProfilePicture] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        toast({
          title: "Invalid Format",
          description: "Profile picture must be PNG or JPEG",
          variant: "destructive",
        });
        return;
      }
      setProfilePicture(file);
    }
  };

  const handleProfilePictureUpload = async () => {
    if (!profilePicture) {
      toast({
        title: "No File Selected",
        description: "Please select an image to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      await updateProfilePicture(profilePicture);
      toast({
        title: "Picture Updated",
        description: "Your profile picture has been successfully updated",
      });
      
      // Reload the user data to get the updated profile picture
      await refreshUser();
      setProfilePicture(null);
    } catch (error) {
      console.error("Failed to update profile picture:", error);
      toast({
        title: "Update Failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your profile information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                {user?.id && (
                  <AvatarImage
                    src={getProfilePictureUrl(user.id)}
                    alt={user.username}
                  />
                )}
                <AvatarFallback>{getInitials(user?.username)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-medium">{user?.username}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground">
                  Member since {formatDate(user?.created_at)}
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleProfilePictureChange}
              className="bg-muted"
            />
            {profilePicture && (
              <p className="text-xs text-muted-foreground">
                Selected file: {profilePicture.name}
              </p>
            )}
            <Button
              className="w-full"
              onClick={handleProfilePictureUpload}
              disabled={!profilePicture || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Update Picture
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
