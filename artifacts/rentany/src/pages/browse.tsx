import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useGetProducts, GetProductsSortBy } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, Loader2, PackageX } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export default function Browse() {
  const [locationObj] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [search, setSearch] = useState(searchParams.get('search') || "");
  const [category, setCategory] = useState(searchParams.get('category') || "");
  const [sortBy, setSortBy] = useState<GetProductsSortBy>('newest');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, error } = useGetProducts({
    search: debouncedSearch || undefined,
    category: category || undefined,
    minPrice: priceRange[0],
    maxPrice: priceRange[1] === 500 ? undefined : priceRange[1],
    sortBy,
    limit: 20
  });

  const FilterContent = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Category</h4>
        <div className="flex flex-col gap-2">
          {["", "Electronics", "Vehicles", "Outdoors", "Tools", "Furniture"].map(c => (
            <button 
              key={c}
              onClick={() => setCategory(c)}
              className={`text-left px-3 py-2 rounded-lg text-sm transition-colors ${category === c ? 'bg-primary text-primary-foreground font-medium shadow-md shadow-primary/20' : 'hover:bg-accent'}`}
            >
              {c || "All Categories"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between">
          <h4 className="font-semibold text-sm uppercase text-muted-foreground tracking-wider">Price Range</h4>
          <span className="text-sm font-medium">${priceRange[0]} - ${priceRange[1] === 500 ? '500+' : priceRange[1]}</span>
        </div>
        <Slider 
          defaultValue={[0, 500]} 
          max={500} 
          step={10} 
          value={priceRange}
          onValueChange={setPriceRange}
          className="py-4"
        />
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Search & Sort */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-start md:items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for anything..." 
            className="pl-10 h-12 rounded-xl bg-card border shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="h-12 rounded-xl md:hidden flex-1 gap-2">
                <Filter className="w-4 h-4" /> Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader className="mb-6">
                <SheetTitle>Filters</SheetTitle>
              </SheetHeader>
              <FilterContent />
            </SheetContent>
          </Sheet>

          <Select value={sortBy} onValueChange={(v: GetProductsSortBy) => setSortBy(v)}>
            <SelectTrigger className="w-full md:w-[180px] h-12 rounded-xl bg-card">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters (Desktop) */}
        <div className="hidden md:block w-64 shrink-0 border-r pr-6">
          <FilterContent />
        </div>

        {/* Results Grid */}
        <div className="flex-1">
          <div className="mb-6 flex justify-between items-end">
            <h1 className="text-2xl font-bold font-display">
              {search ? `Results for "${search}"` : category ? category : "All Items"}
            </h1>
            <span className="text-muted-foreground text-sm">
              {data?.total || 0} items found
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-destructive/10 text-destructive rounded-xl">
              Failed to load products. Please try again.
            </div>
          ) : data?.products.length === 0 ? (
            <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
              <PackageX className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No items found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your filters or search terms.</p>
              <Button onClick={() => { setSearch(''); setCategory(''); setPriceRange([0,500]); }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {data?.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
