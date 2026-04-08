export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  season?: 'Summer' | 'Winter';
  image: string; // Base64 or URL
  colors?: string[];
  sizes?: string[];
  description: string;
  inStock: boolean;
  hidden?: boolean;
  badge?: string;
  createdAt?: any;
  reviews?: Review[];
  flashSale?: {
    active: boolean;
    endTime: any; // Timestamp
  };
  notifyList?: string[]; // User IDs
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  media?: {
    type: 'image';
    url: string;
  }[];
  verified: boolean;
  createdAt: any;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: {
    village: string;
    address: string;
    city: string;
    state: string;
  };
  items: CartItem[];
  total: number;
  screenshot: string; // Base64 encoded screenshot
  status: 'pending' | 'packed' | 'shipped' | 'out-for-delivery' | 'completed';
  coordinates?: {
    lat: number;
    lng: number;
  };
  marhabaCoinsEarned?: number;
  createdAt: any;
}

export interface CartItem extends Product {
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  season: 'Summer' | 'Winter';
  active: boolean;
}

export interface StoreConfig {
  announcement: string;
  theme: 'Summer' | 'Winter';
}

export interface UserProfile {
  uid: string;
  email?: string;
  phone?: string;
  displayName?: string;
  photoURL?: string;
  role: 'user' | 'admin';
  coins?: number;
  createdAt?: any;
}
