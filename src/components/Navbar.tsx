import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { isUserAdmin } from "@/lib/api";
import { BookOpen, LogOut, User, Wallet, Menu, X, LayoutDashboard } from "lucide-react";

const Navbar = () => {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Update authentication and admin status
  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      // Verifique diretamente pelo token em vez de depender do objeto do usuário
      setIsAdmin(isUserAdmin());
    } else {
      setIsAdmin(false);
    }
  }, [isAuthenticated, user]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navLinks = [
    { name: "Cursos", path: "/", icon: BookOpen },
    ...(isAuthenticated ? [{ name: "Carteira", path: "/wallet", icon: Wallet }] : []),
    ...(isAdmin ? [{ name: "Admin", path: "/admin", icon: LayoutDashboard }] : []),
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  // Don't render authenticated content until we've checked auth status
  if (!mounted) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container flex h-16 items-center">
        <Link to="/" className="mr-8 flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <span className="font-bold">Boolen</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1">
          <ul className="flex space-x-4">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Button
                  variant={isActive(link.path) ? "secondary" : "ghost"}
                  asChild
                >
                  <Link to={link.path} className="flex items-center space-x-1">
                    <link.icon className="h-4 w-4" />
                    <span>{link.name}</span>
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {!isLoading && !isAuthenticated && (
            <Button asChild variant="ghost">
              <Link to="/login">Entrar</Link>
            </Button>
          )}

          {!isLoading && isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-9 w-9 border border-primary">
                    <AvatarImage
                      src={user?.profile_picture}
                      alt={user?.username || "User"}
                    />
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(user?.username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.username}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center cursor-pointer">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            className="md:hidden"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b md:hidden">
            <ul className="container py-4">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Button
                    variant={isActive(link.path) ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    asChild
                  >
                    <Link
                      to={link.path}
                      className="flex items-center space-x-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <link.icon className="h-4 w-4" />
                      <span>{link.name}</span>
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
