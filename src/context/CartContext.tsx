import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { Product } from './ProductContext';

export interface CartItem {
  product: Product;
  quantity: number;
  size: string;
  color: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, quantity: number, size: string, color: string) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  clearCart: () => void;
  total: number;
  placeOrder: (paymentScreenshot: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { user } = useAuth();

  const addToCart = (product: Product, quantity: number, size: string, color: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.size === size && item.color === color);
      if (existing) {
        return prev.map(item => item === existing ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { product, quantity, size, color }];
    });
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart(prev => prev.filter(item => !(item.product.id === productId && item.size === size && item.color === color)));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const placeOrder = async (paymentScreenshot: string) => {
    if (!user) throw new Error('Must be logged in to place order');
    
    await addDoc(collection(db, 'orders'), {
      userId: user.uid,
      items: cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
        price: item.product.price
      })),
      totalAmount: total,
      paymentScreenshot,
      status: 'pending',
      createdAt: Timestamp.now()
    });
    
    clearCart();
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, total, placeOrder }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
