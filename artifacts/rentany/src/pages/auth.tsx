import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin, useRegister, RegisterInputRole } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from "@/components/ui/glass-card";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<RegisterInputRole>('user');

  const loginMutation = useLogin();
  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await loginMutation.mutateAsync({ data: { email, password } });
        login(res.token, res.user);
        toast({ title: "Welcome back!", description: "Successfully logged in." });
        setLocation("/dashboard");
      } else {
        const res = await registerMutation.mutateAsync({ data: { name, email, password, role } });
        login(res.token, res.user);
        toast({ title: "Account created!", description: "Welcome to RentAny." });
        setLocation("/dashboard");
      }
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: err.message || "Authentication failed. Please try again." 
      });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-12 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Decorative blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="w-full max-w-md px-4 relative z-10">
        <GlassCard>
          <GlassCardHeader className="text-center pb-2">
            <GlassCardTitle className="text-3xl mb-2">
              {isLogin ? "Welcome back" : "Create an account"}
            </GlassCardTitle>
            <p className="text-muted-foreground text-sm">
              {isLogin ? "Enter your details to access your account" : "Join our community today"}
            </p>
          </GlassCardHeader>
          
          <GlassCardContent>
            <div className="flex p-1 bg-muted/50 rounded-xl mb-8">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${isLogin ? 'bg-white dark:bg-slate-800 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setIsLogin(true)}
              >
                Log In
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${!isLogin ? 'bg-white dark:bg-slate-800 shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setIsLogin(false)}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input 
                        id="name" 
                        placeholder="John Doe" 
                        required={!isLogin}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="bg-white/50 dark:bg-slate-900/50 rounded-xl"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>I want to...</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div 
                          className={`border rounded-xl p-3 text-center cursor-pointer transition-all ${role === 'user' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'}`}
                          onClick={() => setRole('user')}
                        >
                          <span className="font-semibold block">Rent items</span>
                          <span className="text-xs opacity-70">Borrow from others</span>
                        </div>
                        <div 
                          className={`border rounded-xl p-3 text-center cursor-pointer transition-all ${role === 'owner' ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50'}`}
                          onClick={() => setRole('owner')}
                        >
                          <span className="font-semibold block">List items</span>
                          <span className="text-xs opacity-70">Earn money</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/50 dark:bg-slate-900/50 rounded-xl"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {isLogin && <span className="text-xs text-primary cursor-pointer hover:underline">Forgot password?</span>}
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/50 dark:bg-slate-900/50 rounded-xl"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl mt-6 text-base font-bold shadow-lg shadow-primary/25 transition-transform active:scale-[0.98]" 
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? "Sign In" : "Create Account")}
              </Button>
            </form>
          </GlassCardContent>
        </GlassCard>
      </div>
    </div>
  );
}
