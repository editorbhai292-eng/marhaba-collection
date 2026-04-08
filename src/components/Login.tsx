import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Mail, ArrowRight, ShieldCheck, Fingerprint, X, Chrome, Eye, EyeOff, Phone, Smartphone, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { storeConfig, loginAdmin } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminError, setAdminError] = useState(false);
  
  // Phone Auth State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const recaptchaVerifierRef = React.useRef<RecaptchaVerifier | null>(null);

  const navigate = useNavigate();

  React.useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.error("Error clearing recaptcha:", e);
        }
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const setupRecaptcha = () => {
    if (!recaptchaVerifierRef.current) {
      try {
        const container = document.getElementById('recaptcha-container');
        if (!container) return;
        
        // Ensure container is empty to prevent "already rendered" error
        container.innerHTML = '';
        
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {
            console.log('Recaptcha resolved');
          },
          'expired-callback': () => {
            if (recaptchaVerifierRef.current) {
              recaptchaVerifierRef.current.clear();
              recaptchaVerifierRef.current = null;
            }
          }
        });
      } catch (err) {
        console.error("Recaptcha init error:", err);
      }
    }
  };

  const handlePhoneSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      setupRecaptcha();
      if (!recaptchaVerifierRef.current) {
        throw new Error('Failed to initialize reCAPTCHA. Please refresh the page.');
      }
      
      const appVerifier = recaptchaVerifierRef.current;
      const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+91${phoneNumber}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      setShowOtpInput(true);
    } catch (err: any) {
      console.error(err);
      const errorCode = err.code || '';
      const errorMessage = err.message || '';
      
      if (errorCode === 'auth/operation-not-allowed' || errorMessage.includes('SMS unable to be sent until this region enabled')) {
        setError(
          'CRITICAL: SMS Region Not Enabled. \n\n' +
          '1. Go to Firebase Console > Authentication > Settings.\n' +
          '2. Click "SMS Region Policy".\n' +
          '3. Add "India (+91)" to the allowed list.\n\n' +
          'Alternatively, use Google Sign-In or Guest mode to continue.'
        );
      } else if (errorMessage.includes('reCAPTCHA has already been rendered')) {
        // If this happens despite our checks, try to reset and suggest refresh
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        }
        setError('reCAPTCHA error. Please try clicking "Send OTP" again.');
      } else {
        setError(err.message || 'Failed to send OTP. Please check the number.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) return;
    setLoading(true);
    setError('');

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          phone: user.phoneNumber,
          role: 'user',
          createdAt: serverTimestamp()
        });
      }
      navigate('/');
    } catch (err: any) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isDarkMode = storeConfig.theme === 'Winter';

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(false);
    const success = await loginAdmin(adminUser, adminPass);
    if (success) {
      navigate('/admin');
    } else {
      setAdminError(true);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser!.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: email,
          role: 'user'
        });
        navigate('/');
      }
    } catch (err: any) {
      const errorCode = err.code || '';
      const errorMessage = err.message || '';
      
      if (errorCode === 'auth/operation-not-allowed') {
        setError('Login method not enabled. Please enable Email/Password in the Firebase Console.');
      } else if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorMessage.includes('invalid-credential')) {
        setError(isLogin ? 'Invalid email or password. If you are new, please Sign Up first.' : 'Invalid details or account already exists.');
      } else if (errorCode === 'auth/invalid-email') {
        if (email.toLowerCase().includes('gulamsarwar')) {
          setError('Admin username detected. Please use the "ADMIN LOGIN" button above.');
        } else {
          setError('Please enter a valid email address.');
        }
      } else if (errorCode === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (errorCode === 'auth/email-already-in-use') {
        setError('This email is already registered. Please sign in instead.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore, if not create profile
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: 'user',
          displayName: user.displayName,
          photoURL: user.photoURL
        });
      }
      
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error("Google Sign-In Error:", err);
      const errorCode = err.code;
      
      if (errorCode === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.');
      } else if (errorCode === 'auth/internal-error') {
        setError('Internal Error: 1. Enable Google Sign-In in Firebase Console. 2. Enable Google People API in Google Cloud Console. 3. Add your email to "Test Users" in OAuth Consent Screen.');
      } else if (errorCode === 'auth/unauthorized-domain') {
        setError('Unauthorized Domain. Please whitelist this domain in Firebase Console > Authentication > Settings > Authorized Domains.');
      } else if (errorCode === 'auth/popup-closed-by-user') {
        // Gracefully handle popup closed by user - no error message needed
        console.log('Sign-in popup closed by user');
      } else if (errorCode === 'auth/cancelled-popup-request') {
        setError('Sign-in request was cancelled.');
      } else {
        setError(err.message || 'An unexpected error occurred during Google Sign-In.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("p-8 flex flex-col items-center justify-center min-h-screen space-y-8 transition-colors duration-500", isDarkMode ? "bg-slate-900" : "bg-orange-50/30")}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm text-center space-y-8"
      >
        {/* Top Icon */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-charcoal rounded-full flex items-center justify-center border-2 border-gold/30 shadow-2xl">
            <div className="text-4xl font-serif text-gold font-black">A</div>
            <div className="absolute bottom-4 w-8 h-0.5 bg-gold/40 rounded-full blur-[1px]" />
          </div>
        </div>
        
        {/* Branding */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
            <span className="text-6xl font-serif italic text-charcoal">Rahbar</span>
          </div>
          <div className="relative space-y-1">
            <h1 className="text-3xl font-serif font-black tracking-tighter text-charcoal uppercase">
              MARHABA COLLECTION
            </h1>
            <div className="flex flex-col gap-1">
              <p className="text-[10px] font-bold text-gold uppercase tracking-[0.3em]">ADMIN PORTAL ACCESS</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">WELCOME BACK</p>
            </div>
          </div>
        </div>

        {/* Admin Login Button */}
        <button
          onClick={() => setIsAdminModalOpen(true)}
          className="w-full bg-charcoal text-gold py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl border border-gold/20 flex items-center justify-center gap-3 active:scale-95 transition-all group"
        >
          <Lock className="w-4 h-4 text-gold group-hover:rotate-12 transition-transform" />
          ADMIN LOGIN
        </button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-[8px] uppercase tracking-widest font-bold text-gray-400"><span className="bg-white px-4">OR CUSTOMER ACCESS</span></div>
        </div>

        {/* Auth Method Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1">
          <button
            onClick={() => setAuthMethod('email')}
            className={cn(
              "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              authMethod === 'email' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
            )}
          >
            <Mail className="w-3 h-3" />
            Email
          </button>
          <button
            onClick={() => setAuthMethod('phone')}
            className={cn(
              "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
              authMethod === 'phone' ? "bg-white text-blue-600 shadow-sm" : "text-gray-400"
            )}
          >
            <Smartphone className="w-3 h-3" />
            Phone
          </button>
        </div>

        {authMethod === 'email' ? (
          <form onSubmit={handleAuth} className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-2xl p-5 focus:ring-2 focus:ring-gold outline-none transition-all font-bold shadow-sm"
                  placeholder="Enter your email"
                />
                <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white border border-gray-100 rounded-2xl p-5 focus:ring-2 focus:ring-gold outline-none transition-all font-bold shadow-sm"
                  placeholder="••••••••"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 hover:text-gold transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Customer Sign In' : 'Customer Sign Up'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-left">
            {!showOtpInput ? (
              <form onSubmit={handlePhoneSignIn} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-2xl p-5 focus:ring-2 focus:ring-gold outline-none transition-all font-bold shadow-sm"
                      placeholder="9334808340"
                    />
                    <Phone className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                  </div>
                  <p className="text-[8px] text-gray-400 ml-4">We'll send an OTP to verify your number.</p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold shadow-xl shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Enter OTP</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                      className="w-full bg-white border border-gray-100 rounded-2xl p-5 focus:ring-2 focus:ring-gold outline-none transition-all font-bold shadow-sm tracking-[1em] text-center"
                      placeholder="••••••"
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowOtpInput(false)}
                    className="text-[8px] font-bold text-blue-600 uppercase tracking-widest ml-4 hover:underline"
                  >
                    Change Phone Number
                  </button>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-5 rounded-2xl font-bold shadow-xl shadow-green-200 hover:bg-green-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Verify OTP
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        <div id="recaptcha-container"></div>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <div className="relative flex justify-center text-[8px] uppercase tracking-widest font-bold text-gray-300"><span className="bg-white px-4">OR CONTINUE WITH</span></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border border-gray-100 py-4 rounded-2xl font-bold text-gray-600 shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          <Chrome className="w-5 h-5 text-blue-500" />
          Sign in with Google
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
        >
          Continue as Guest
        </button>

        <div className="pt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-gold transition-colors"
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
          </button>
        </div>

        <div className="pt-8 border-t border-gray-100">
          <div className="space-y-2">
            <div className="text-[8px] font-serif italic text-gray-300">
              Rahbar Signature Secure Authentication
            </div>
            <div className="text-[7px] font-bold text-gray-400 uppercase tracking-widest">
              Secure Admin Verification: gulamsarwar@123 / gulam@sarwar123
            </div>
          </div>
        </div>
      </motion.div>

      {/* Admin Verification Modal */}
      <AnimatePresence>
        {isAdminModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdminModalOpen(false)}
              className="fixed inset-0 bg-charcoal/60 backdrop-blur-md z-[100]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-white z-[110] rounded-[2.5rem] shadow-2xl p-8 overflow-hidden border border-gold/20"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="space-y-1">
                  <h3 className="text-xl font-serif font-black tracking-tight uppercase text-charcoal">Admin Access</h3>
                  <div className="w-8 h-1 bg-gold rounded-full" />
                </div>
                <button onClick={() => setIsAdminModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Admin Username</label>
                  <input
                    type="text"
                    required
                    value={adminUser}
                    onChange={e => setAdminUser(e.target.value)}
                    className="w-full bg-gray-50 border-none rounded-2xl p-5 focus:ring-2 focus:ring-gold outline-none transition-all font-bold"
                    placeholder="Enter username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-4">Admin Password</label>
                  <div className="relative">
                    <input
                      type={showAdminPass ? "text" : "password"}
                      required
                      value={adminPass}
                      onChange={e => setAdminPass(e.target.value)}
                      className="w-full bg-gray-50 border-none rounded-2xl p-5 focus:ring-2 focus:ring-gold outline-none transition-all font-bold"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowAdminPass(!showAdminPass)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 hover:text-gold transition-colors"
                    >
                      {showAdminPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {adminError && (
                  <div className="text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">
                    Invalid Admin Credentials
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-charcoal text-gold py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  Verify & Access
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
