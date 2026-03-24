import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGetUserBookings, useUpdateBookingStatus } from "@workspace/api-client-react";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function MyBookings() {
  const { authHeaders } = useAuth();
  const [roleFilter, setRoleFilter] = useState<'renter' | 'owner'>('renter');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useGetUserBookings(
    { role: roleFilter },
    { request: authHeaders }
  );

  const updateStatus = useUpdateBookingStatus({ request: authHeaders });

  const handleStatusUpdate = async (id: number, status: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await updateStatus.mutateAsync({ id, data: { status } });
      toast({ title: "Status updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/bookings"] });
    } catch (err) {
      toast({ title: "Failed to update status", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'confirmed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'completed': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">My Bookings</h1>
          <p className="text-muted-foreground">Manage your rentals and requests.</p>
        </div>
        <div className="flex bg-muted p-1 rounded-xl">
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${roleFilter === 'renter' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            onClick={() => setRoleFilter('renter')}
          >
            I am renting
          </button>
          <button 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${roleFilter === 'owner' ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            onClick={() => setRoleFilter('owner')}
          >
            My items
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : !bookings || bookings.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed rounded-3xl">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold">No bookings found</h3>
          <p className="text-muted-foreground">You don't have any bookings in this category yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map(booking => (
            <GlassCard key={booking.id}>
              <GlassCardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
                <div className="w-full md:w-32 h-24 bg-muted rounded-xl overflow-hidden shrink-0">
                  {booking.product?.images?.[0] && <img src={booking.product.images[0]} className="w-full h-full object-cover" />}
                </div>
                
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg">{booking.product?.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                    <div><span className="text-muted-foreground block text-xs">Dates</span><span className="font-medium">{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</span></div>
                    <div><span className="text-muted-foreground block text-xs">Duration</span><span className="font-medium">{booking.totalDays} days</span></div>
                    <div><span className="text-muted-foreground block text-xs">Total</span><span className="font-medium">${booking.totalPrice}</span></div>
                    <div><span className="text-muted-foreground block text-xs">{roleFilter === 'renter' ? 'Owner' : 'Renter'}</span><span className="font-medium">{roleFilter === 'renter' ? booking.product?.ownerName : booking.user?.name}</span></div>
                  </div>
                </div>

                {roleFilter === 'owner' && booking.status === 'pending' && (
                  <div className="flex flex-row md:flex-col w-full md:w-auto gap-2 shrink-0">
                    <Button onClick={() => handleStatusUpdate(booking.id, 'confirmed')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">Approve</Button>
                    <Button onClick={() => handleStatusUpdate(booking.id, 'cancelled')} variant="outline" className="flex-1 text-destructive hover:bg-destructive/10">Decline</Button>
                  </div>
                )}
                {roleFilter === 'owner' && booking.status === 'active' && (
                  <div className="w-full md:w-auto shrink-0">
                    <Button onClick={() => handleStatusUpdate(booking.id, 'completed')} className="w-full">Mark Returned</Button>
                  </div>
                )}
              </GlassCardContent>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
