import { Product } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Royal Velvet Overcoat',
    price: 14999,
    originalPrice: 18999,
    category: 'Man',
    season: 'Winter',
    image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=800',
    colors: ['Charcoal', 'Navy', 'Camel'],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'A premium velvet overcoat designed for the modern gentleman. Perfect for winter evenings.',
    inStock: true,
    badge: 'Limited Edition'
  },
  {
    id: '2',
    name: 'Silk Summer Breeze Dress',
    price: 8999,
    category: 'Woman',
    season: 'Summer',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=800',
    colors: ['Ivory', 'Gold', 'Rose'],
    sizes: ['S', 'M', 'L'],
    description: 'Lightweight silk dress with intricate floral patterns. Elegant and comfortable.',
    inStock: true,
    badge: 'Best Seller'
  },
  {
    id: '3',
    name: 'Classic Cashmere Sweater',
    price: 5999,
    category: 'Man',
    season: 'Winter',
    image: 'https://images.unsplash.com/photo-1516762689617-e1cffcef479d?auto=format&fit=crop&q=80&w=800',
    colors: ['Grey', 'Black', 'Burgundy'],
    sizes: ['M', 'L', 'XL'],
    description: 'Pure cashmere sweater for ultimate warmth and luxury.',
    inStock: true
  },
  {
    id: '4',
    name: 'Kids Golden Sun Dress',
    price: 2499,
    category: 'Kids',
    season: 'Summer',
    image: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80&w=800',
    colors: ['Yellow', 'White'],
    sizes: ['2T', '3T', '4T'],
    description: 'Vibrant cotton dress for little ones to shine in the sun.',
    inStock: true
  }
];
