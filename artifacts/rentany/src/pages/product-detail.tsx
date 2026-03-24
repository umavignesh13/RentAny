import { useState } from "react";
import { useRoute } from "wouter";
import { useGetProductById, useCreateBooking } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard, GlassCardContent } from "@/components/ui/glass-card";
import { useToast } from "@/hooks/use-toast";
import { Star, MapPin, ShieldCheck, Calendar, Info, MessageSquare, Loader2, ArrowLeft } from "lucide-react";
import { differenceInDays, addDays, format } from "date-fns";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const id = Number(params?.id);
  const { user, authHeaders } = useAuth();
  const { toast } = useToast();

  const { data: product, isLoading, error } = useGetProductById(id, {
    query: { enabled: !!id }
  });

  const createBooking = useCreateBooking({ request: authHeaders });

  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 3), 'yyyy-MM-dd'));

  const days = Math.max(1, differenceInDays(new Date(endDate), new Date(startDate)));
  const totalItemPrice = product ? days * product.pricePerDay : 0;
  const deposit = product?.deposit || 0;
  const fee = totalItemPrice * 0.1; // 10% platform fee
  const total = totalItemPrice + deposit + fee;

  const handleBooking = async () => {
    if (!user) {
      toast({ title: "Login required", description: "Please login to book items.", variant: "destructive" });
      return;
    }
    try {
      await createBooking.mutateAsync({
        data: {
          productId: id,
          startDate,
          endDate
        }
      });
      toast({ title: "Booking Requested!", description: "The owner will review your request shortly." });
    } catch (err: any) {
      toast({ title: "Booking Failed", description: err.message || "Could not create booking.", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="h-[80vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (error || !product) return <div className="text-center py-20 text-destructive font-bold">Product not found.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <button onClick={() => window.history.back()} className="flex items-center text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to results
      </button>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          {/* Images */}
          <div className="aspect-[4/3] md:aspect-[16/9] rounded-3xl overflow-hidden bg-muted border">
            {product.images && product.images.length > 0 ? (
              <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Images</div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">{product.title}</h1>
              <div className="text-right">
                <span className="text-3xl font-bold text-primary">${product.pricePerDay}</span>
                <span className="text-muted-foreground">/day</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8 pb-8 border-b">
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {product.rating.toFixed(1)} ({product.reviewCount} reviews)</span>
              <span>•</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {product.location}</span>
              <span>•</span>
              <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md font-medium">{product.category}</span>
            </div>

            <h3 className="text-xl font-bold mb-4">Description</h3>
            <p className="text-muted-foreground leading-relaxed mb-8 whitespace-pre-wrap">
              {product.description}
            </p>

            {/* Owner Block */}
            <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary overflow-hidden">
                  {product.ownerAvatar ? <img src={product.ownerAvatar} className="w-full h-full object-cover" /> : product.ownerName.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold">Owned by {product.ownerName}</h4>
                  <div className="flex items-center text-sm text-muted-foreground gap-1 mt-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Identity verified
                  </div>
                </div>
              </div>
              <Button variant="outline" className="rounded-xl gap-2 hidden sm:flex">
                <MessageSquare className="w-4 h-4" /> Contact Owner
              </Button>
            </div>
          </div>
        </div>

        {/* Booking Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <GlassCard className="shadow-2xl shadow-primary/10 border-primary/20">
              <GlassCardContent className="p-6">
                <div className="flex items-center justify-between mb-6 pb-6 border-b">
                  <h3 className="font-bold text-xl">Book this item</h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${product.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
                    {product.isAvailable ? 'Available' : 'Unavailable'}
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="rounded-xl" min={format(new Date(), 'yyyy-MM-dd')} />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="rounded-xl" min={startDate} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">${product.pricePerDay} × {days} days</span>
                    <span>${totalItemPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">Service fee <Info className="w-3 h-3" /></span>
                    <span>${fee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Refundable deposit</span>
                    <span>${deposit.toFixed(2)}</span>
                  </div>
                  <div className="pt-3 border-t flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button 
                  className="w-full h-12 rounded-xl text-base font-bold shadow-lg shadow-primary/25" 
                  disabled={!product.isAvailable || createBooking.isPending}
                  onClick={handleBooking}
                >
                  {createBooking.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request to Book'}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4">You won't be charged yet</p>
              </GlassCardContent>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
