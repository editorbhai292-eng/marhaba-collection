import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, onSnapshot, query, orderBy, doc, getDoc, getDocs, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Product, CartItem, UserProfile, Banner, StoreConfig } from '../types';
import { INITIAL_PRODUCTS } from '../constants';

interface AppContextType {
  user: User | null;
  userProfile: UserProfile | null;
  products: Product[];
  banners: Banner[];
  storeConfig: StoreConfig;
  cart: CartItem[];
  addToCart: (product: Product, selectedColor?: string, selectedSize?: string) => void;
  removeFromCart: (productId: string, selectedColor?: string, selectedSize?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, selectedColor?: string, selectedSize?: string) => void;
  clearCart: () => void;
  isAdmin: boolean;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  toggleTheme: () => Promise<void>;
  loginAdmin: (username: string, pass: string) => Promise<boolean>;
  updateUserCoins: (amount: number) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  db: any;
  auth: any;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>({ announcement: 'Welcome to Marhaba Collection', theme: 'Summer' });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isManualAdmin, setIsManualAdmin] = useState(false);

  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }
        } catch (error) {
          handleFirestoreError(error, 'get', `users/${currentUser.uid}`);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    const productsCollection = collection(db, 'products');
    
    // Seed products if empty
    const seedProducts = async () => {
      try {
        const snapshot = await getDocs(productsCollection);
        if (snapshot.empty) {
          for (const product of INITIAL_PRODUCTS) {
            const { id, ...productData } = product;
            await addDoc(productsCollection, {
              ...productData,
              createdAt: serverTimestamp()
            });
          }
        }
      } catch (error) {
        handleFirestoreError(error, 'seed', 'products');
      }
    };
    seedProducts();

    const productsQuery = query(productsCollection, orderBy('createdAt', 'desc'));
    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
    }, (error) => {
      handleFirestoreError(error, 'list', 'products');
    });

    const bannersQuery = query(collection(db, 'banners'), orderBy('season', 'asc'));
    const unsubscribeBanners = onSnapshot(bannersQuery, (snapshot) => {
      const bannersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Banner));
      setBanners(bannersData);
    }, (error) => {
      handleFirestoreError(error, 'list', 'banners');
    });

    const unsubscribeConfig = onSnapshot(doc(db, 'config', 'store'), (doc) => {
      if (doc.exists()) {
        setStoreConfig(doc.data() as StoreConfig);
      }
    }, (error) => {
      handleFirestoreError(error, 'get', 'config/store');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProducts();
      unsubscribeBanners();
      unsubscribeConfig();
    };
  }, []);

  const addToCart = (product: Product, selectedColor?: string, selectedSize?: string) => {
    setCart(prev => {
      const existing = prev.find(item => 
        item.id === product.id && 
        item.selectedColor === selectedColor && 
        item.selectedSize === selectedSize
      );
      if (existing) {
        return prev.map(item => 
          (item.id === product.id && item.selectedColor === selectedColor && item.selectedSize === selectedSize) 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedColor, selectedSize }];
    });
  };

  const removeFromCart = (productId: string, selectedColor?: string, selectedSize?: string) => {
    setCart(prev => prev.filter(item => 
      !(item.id === productId && item.selectedColor === selectedColor && item.selectedSize === selectedSize)
    ));
  };

  const updateCartQuantity = (productId: string, quantity: number, selectedColor?: string, selectedSize?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedColor, selectedSize);
      return;
    }
    setCart(prev => prev.map(item => 
      (item.id === productId && item.selectedColor === selectedColor && item.selectedSize === selectedSize) 
      ? { ...item, quantity } 
      : item
    ));
  };

  const clearCart = () => setCart([]);

  const toggleTheme = async () => {
    const newTheme = storeConfig.theme === 'Summer' ? 'Winter' : 'Summer';
    await setDoc(doc(db, 'config', 'store'), { ...storeConfig, theme: newTheme });
  };

  const loginAdmin = async (username: string, pass: string) => {
    const trimmedUser = username.trim();
    const trimmedPass = pass.trim();

    if (trimmedUser === 'gulamsarwar@123' && trimmedPass === 'gulam@sarwar123') {
      setIsManualAdmin(true); // Allow UI access immediately for master credentials
      
      const adminEmail = 'admin@marhabacollection.com';
      try {
        // Try to sync with Firebase Auth for database permissions
        await signInWithEmailAndPassword(auth, adminEmail, trimmedPass);
      } catch (err: any) {
        console.warn("Firebase Auth sync failed, but master credentials accepted:", err.code);
        
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-email') {
          try {
            const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, trimmedPass);
            await setDoc(doc(db, 'users', userCredential.user.uid), {
              uid: userCredential.user.uid,
              email: adminEmail,
              role: 'admin'
            });
          } catch (createErr: any) {
            console.error("Admin background creation failed:", createErr.code);
          }
        }
      }
      return true;
    }
    return false;
  };

  const isAdmin = userProfile?.role === 'admin' || 
    (user?.email === 'admin@marhabacollection.com') || 
    (user?.email === 'rahbarboss4@gmail.com') || 
    (user?.email === 'gulamsarwar@123.com') ||
    isManualAdmin;

  const refreshUserProfile = async () => {
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      }
    }
  };

  const updateUserCoins = async (amount: number) => {
    if (!user || !userProfile) return;
    const coinsEarned = Math.floor(amount / 100);
    if (coinsEarned <= 0) return;

    const newCoins = (userProfile.coins || 0) + coinsEarned;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, { ...userProfile, coins: newCoins }, { merge: true });
    await refreshUserProfile();
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      userProfile, 
      products, 
      banners,
      storeConfig,
      cart, 
      addToCart, 
      removeFromCart, 
      updateCartQuantity,
      clearCart, 
      isAdmin, 
      loading,
      searchQuery,
      setSearchQuery,
      toggleTheme,
      loginAdmin,
      updateUserCoins,
      refreshUserProfile,
      db,
      auth
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
