import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Menu, X, Search, Package, Calendar, 
  MessageSquare, User as UserIcon, LogOut, LayoutDashboard, ShieldCheck
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Browse", path: "/browse", icon: Search, show: true },
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard, show: !!user },
    { name: "My Bookings", path: "/bookings", icon: Calendar, show: !!user },
    { name: "My Listings", path: "/listings", icon: Package, show: user?.role === 'owner' || user?.role === 'admin' },
    { name: "Messages", path: "/messages", icon: MessageSquare, show: !!user },
    { name: "Admin", path: "/admin", icon: ShieldCheck, show: user?.role === 'admin' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <img 
                src={`${import.meta.env.BASE_URL}images/logo.png`} 
                alt="RentAny Logo" 
                className="w-8 h-8 group-hover:scale-110 transition-transform duration-300 drop-shadow-md" 
              />
              <span className="text-xl font-display font-bold tracking-tight text-foreground">
                Rent<span className="text-primary">Any</span>
              </span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.filter(l => l.show).map((link) => (
                <Link key={link.path} href={link.path} className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  location === link.path 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                  {link.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="hidden md:flex items-center gap-4">
                <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-blue-400 p-[2px]">
                    <div className="w-full h-full rounded-full bg-white dark:bg-slate-900 overflow-hidden">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-secondary text-primary font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-semibold hidden lg:block">{user.name}</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={() => { logout(); setLocation("/"); }} className="rounded-xl">
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" className="rounded-xl" onClick={() => setLocation("/auth")}>Log in</Button>
                <Button className="rounded-xl shadow-lg shadow-primary/25" onClick={() => setLocation("/auth")}>Sign up</Button>
              </div>
            )}
            
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b bg-card/95 backdrop-blur-xl"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.filter(l => l.show).map((link) => (
                <Link 
                  key={link.path} 
                  href={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium",
                    location === link.path ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.name}
                </Link>
              ))}
              {user ? (
                <>
                  <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-muted-foreground">
                    <UserIcon className="w-5 h-5" /> Profile
                  </Link>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); setLocation("/"); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-destructive">
                    <LogOut className="w-5 h-5" /> Log out
                  </button>
                </>
              ) : (
                <Button className="mt-4 w-full rounded-xl" onClick={() => { setLocation("/auth"); setIsMobileMenuOpen(false); }}>
                  Sign In
                </Button>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1">
        {children}
      </main>
      
      <footer className="border-t py-12 bg-card mt-auto">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 group mb-4">
              <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Logo" className="w-6 h-6 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
              <span className="text-lg font-display font-bold text-muted-foreground group-hover:text-foreground transition-colors">RentAny</span>
            </Link>
            <p className="text-sm text-muted-foreground">Rent anything from people nearby. Secure, easy, and affordable.</p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/browse">Browse Items</Link></li>
              <li><Link href="/auth">How it works</Link></li>
              <li><Link href="/auth">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Help Center</li>
              <li>Trust & Safety</li>
              <li>Contact Us</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Terms of Service</li>
              <li>Privacy Policy</li>
              <li>Cookie Policy</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
