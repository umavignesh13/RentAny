import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Package, CalendarCheck, Star, Shield, ArrowRight, Wallet, MessageSquare } from "lucide-react";
import { useGetUserBookings } from "@workspace/api-client-react";

export default function Dashboard() {
  const { user, authHeaders } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/auth");
    return null;
  }

  // Fetch some summary data - using bookings as proxy for activity
  const { data: bookings } = useGetUserBookings({ role: 'renter' }, { request: authHeaders });
  
  const stats = [
    { title: "Trust Score", value: `${user.trustScore}%`, icon: Shield, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "My Rating", value: user.rating.toFixed(1), icon: Star, color: "text-yellow-500", bg: "bg-yellow-500/10" },
    { title: "Active Bookings", value: bookings?.filter(b => b.status === 'active' || b.status === 'confirmed').length || 0, icon: CalendarCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
  ];

  if (user.role === 'owner' || user.role === 'admin') {
    stats.push({ title: "Active Listings", value: "3", icon: Package, color: "text-purple-500", bg: "bg-purple-500/10" });
    stats.push({ title: "Earnings (Mo)", value: "$450", icon: Wallet, color: "text-green-500", bg: "bg-green-500/10" });
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Welcome back, {user.name.split(' ')[0]}! 👋</h1>
        <p className="text-muted-foreground mt-2">Here's what's happening with your account today.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {stats.map((stat, i) => (
          <GlassCard key={i}>
            <GlassCardContent className="p-6">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <h3 className="text-muted-foreground text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold">{stat.value}</p>
            </GlassCardContent>
          </GlassCard>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-display">Quick Actions</h2>
          
          <button onClick={() => setLocation('/browse')} className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border hover:border-primary hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Package className="w-5 h-5" /></div>
              <div className="text-left"><h4 className="font-bold">Rent an Item</h4><p className="text-sm text-muted-foreground">Browse the marketplace</p></div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
          </button>

          {(user.role === 'owner' || user.role === 'admin') && (
            <button onClick={() => setLocation('/add-product')} className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border hover:border-primary hover:shadow-md transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500"><Package className="w-5 h-5" /></div>
                <div className="text-left"><h4 className="font-bold">List an Item</h4><p className="text-sm text-muted-foreground">Earn money renting your gear</p></div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
            </button>
          )}

          <button onClick={() => setLocation('/messages')} className="w-full flex items-center justify-between p-4 bg-card rounded-2xl border hover:border-primary hover:shadow-md transition-all group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500"><MessageSquare className="w-5 h-5" /></div>
              <div className="text-left"><h4 className="font-bold">Messages</h4><p className="text-sm text-muted-foreground">Check your inbox</p></div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transform group-hover:translate-x-1 transition-all" />
          </button>
        </div>

        {/* Recent Activity placeholder */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold font-display">Recent Bookings</h2>
          <GlassCard>
            <GlassCardContent className="p-0">
              {bookings && bookings.length > 0 ? (
                <div className="divide-y">
                  {bookings.slice(0,3).map(b => (
                    <div key={b.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                          {b.product?.images?.[0] && <img src={b.product.images[0]} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-medium">{b.product?.title}</p>
                          <p className="text-xs text-muted-foreground">{new Date(b.startDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-secondary-foreground'}`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>No recent bookings.</p>
                </div>
              )}
              <div className="p-3 border-t text-center">
                <button onClick={() => setLocation('/bookings')} className="text-sm font-medium text-primary hover:underline">View All</button>
              </div>
            </GlassCardContent>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
