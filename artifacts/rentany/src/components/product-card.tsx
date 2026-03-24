import { Link } from "wouter";
import { Product } from "@workspace/api-client-react";
import { Star, MapPin, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function ProductCard({ product, index = 0 }: { product: Product, index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Link href={`/product/${product.id}`}>
        <div className="group relative bg-card rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer flex flex-col h-full hover:-translate-y-1">
          <div className="aspect-[4/3] w-full overflow-hidden relative bg-muted">
            {product.images && product.images.length > 0 ? (
              <img 
                src={product.images[0]} 
                alt={product.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No Image
              </div>
            )}
            
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow-sm flex items-center gap-1">
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
            
            {!product.isAvailable && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="bg-destructive text-white px-3 py-1 rounded-full text-sm font-bold">Rented Out</span>
              </div>
            )}
          </div>
          
          <div className="p-4 flex flex-col flex-grow">
            <div className="flex justify-between items-start mb-2 gap-2">
              <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{product.title}</h3>
              <div className="text-right whitespace-nowrap">
                <span className="font-bold text-lg">${product.pricePerDay}</span>
                <span className="text-xs text-muted-foreground block">/day</span>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-grow">
              {product.description}
            </p>
            
            <div className="mt-auto flex items-center justify-between pt-3 border-t">
              <div className="flex items-center text-xs text-muted-foreground gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[100px]">{product.location}</span>
              </div>
              <div className="flex items-center gap-2">
                {product.ownerAvatar ? (
                  <img src={product.ownerAvatar} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                    {product.ownerName?.charAt(0)}
                  </div>
                )}
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
