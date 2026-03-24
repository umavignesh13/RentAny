import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Monitor, Car, Tent, Hammer, Sofa, ArrowRight, ShieldCheck, Zap, Sparkles } from "lucide-react";
import { useGetPopularProducts, useGetRecommendations } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { motion } from "framer-motion";

const categories = [
  { name: "Electronics", icon: Monitor, color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
  { name: "Vehicles", icon: Car, color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { name: "Outdoors", icon: Tent, color: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
  { name: "Tools", icon: Hammer, color: "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" },
  { name: "Furniture", icon: Sofa, color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400" },
];

export default function Home() {
  const [search, setSearch] = useState("");
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      setLocation(`/browse?search=${encodeURIComponent(search)}`);
    } else {
      setLocation('/browse');
    }
  };

  const { data: popularProducts, isLoading: isPopularLoading } = useGetPopularProducts({ limit: 4 });
  const { data: aiRecommended, isLoading: isAiLoading } = useGetRecommendations({ limit: 4 });

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center pt-16 pb-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Hero abstract background" 
            className="w-full h-full object-cover object-center opacity-90 dark:opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background z-10" />
        </div>

        <div className="container mx-auto px-4 relative z-20">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary font-medium text-sm mb-6 backdrop-blur-md border border-primary/20">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Rental Marketplace</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-extrabold text-foreground mb-6 leading-tight">
              Rent anything, <br />
              <span className="text-gradient">anywhere, anytime.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of people sharing tools, electronics, and gear. Save money, reduce waste, and connect with your community.
            </p>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
              <div className="relative bg-card flex items-center p-2 rounded-2xl shadow-xl border">
                <Search className="w-6 h-6 text-muted-foreground ml-3" />
                <Input 
                  type="text" 
                  placeholder="What do you need to rent today?" 
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 text-lg px-4 h-14 bg-transparent"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Button type="submit" size="lg" className="rounded-xl h-12 px-8 font-bold bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
                  Search
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-background relative z-20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-display font-bold mb-2">Explore Categories</h2>
              <p className="text-muted-foreground">Find exactly what you need from our wide selection</p>
            </div>
            <Button variant="ghost" className="hidden md:flex items-center gap-2" onClick={() => setLocation('/browse')}>
              View all <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setLocation(`/browse?category=${cat.name}`)}
                className="bg-card hover:bg-accent border rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:shadow-lg group"
              >
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${cat.color} group-hover:scale-110 transition-transform`}>
                  <cat.icon className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-foreground">{cat.name}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-3xl border shadow-sm text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Verified Users</h3>
              <p className="text-muted-foreground">Every user is identity-checked and fraud-scored by our AI system for maximum safety.</p>
            </div>
            <div className="bg-card p-8 rounded-3xl border shadow-sm text-center transform md:-translate-y-4 shadow-xl shadow-primary/5 border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-blue-500"></div>
              <div className="w-16 h-16 mx-auto bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full flex items-center justify-center mb-6">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Booking</h3>
              <p className="text-muted-foreground">Find what you need and book instantly. No waiting for manual approvals.</p>
            </div>
            <div className="bg-card p-8 rounded-3xl border shadow-sm text-center">
              <div className="w-16 h-16 mx-auto bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-3">AI Pricing</h3>
              <p className="text-muted-foreground">Our AI suggests optimal prices so owners earn more and renters get fair deals.</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Recommendations */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-10">
            <div className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-900/30 rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold">Picked for You</h2>
              <p className="text-muted-foreground">AI-driven recommendations based on your area</p>
            </div>
          </div>

          {isAiLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-card h-[350px] rounded-2xl animate-pulse border" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiRecommended?.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Popular Products */}
      <section className="py-20 bg-background border-t">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-display font-bold mb-10">Trending Right Now</h2>
          {isPopularLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {[1, 2, 3, 4].map(i => <div key={i} className="bg-card h-[350px] rounded-2xl animate-pulse border" />)}
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularProducts?.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
          <div className="mt-12 text-center">
            <Button size="lg" variant="outline" className="rounded-xl px-8" onClick={() => setLocation('/browse')}>
              Browse All Items
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
