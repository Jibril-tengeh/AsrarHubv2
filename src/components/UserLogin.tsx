import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult
} from 'firebase/auth';
import { Moon, AlertCircle, Mail, Phone, ChevronLeft } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

type AuthMode = 'select' | 'email' | 'phone' | 'verify';

export default function UserLogin() {
  const [mode, setMode] = useState<AuthMode>('select');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const isIframe = window.self !== window.top;
  const isNative = Capacitor.isNativePlatform();

  // Email state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Check for redirect results on mount
    const checkRedirect = async () => {
      try {
        setLoading(true);
        const result = await getRedirectResult(auth);
        if (result) {
          // Successfully logged in via redirect!
          // We can optionally do something here, state will update via onAuthStateChanged
        }
      } catch (err: any) {
        console.error("Redirect Error:", err);
        setError(err.message || 'Erreur lors de la connexion via Google');
      } finally {
        setLoading(false);
      }
    };
    checkRedirect();

    // Cleanup recaptcha if it was created and we leave phone modes
    if (mode !== 'phone' && mode !== 'verify') {
      if ((window as any).recaptchaVerifier) {
        try {
          (window as any).recaptchaVerifier.clear();
          (window as any).recaptchaVerifier = null;
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [mode]);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const provider = new GoogleAuthProvider();
      
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Login erreur:", err);
      let errMsg = err.message || 'Erreur lors de la connexion Google';
      if (err.code === 'auth/popup-blocked') {
        const provider = new GoogleAuthProvider();
        await signInWithRedirect(auth, provider).catch(e => {
            setError(e.message);
            setLoading(false);
        });
        return;
      } else if (err.code === 'auth/network-request-failed') {
        errMsg = "Erreur réseau. Veuillez vérifier votre connexion internet.";
      } else if (err.code === 'auth/popup-closed-by-user') {
        errMsg = "La fenêtre de connexion a été fermée.";
      }
      setError(errMsg);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error("Email auth erreur:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Cet email est déjà utilisé.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Email invalide.");
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError("Identifiants incorrects.");
      } else if (err.code === 'auth/weak-password') {
        setError("Le mot de passe doit comporter au moins 6 caractères.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("L'authentification par email n'est pas activée dans Firebase. Allez dans Firebase Console -> Authentication -> Sign-in method.");
      } else {
        setError(err.message || "Erreur de connexion.");
      }
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) {
      setError("Veuillez entrer un numéro de téléphone.");
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      // Add country code if basic number starts with 0
      let formattedPhone = phoneNumber.trim();
      if (!formattedPhone.startsWith('+')) {
         // Defaulting to simple formatting for example, usually user inputs +33...
         // Or prompt user to include the country code
         if (formattedPhone.startsWith('0')) {
             setError("Veuillez inclure l'indicatif du pays (ex: +33 pour la France)");
             setLoading(false);
             return;
         } else {
            formattedPhone = '+' + formattedPhone;
         }
      }

      const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(result);
      setMode('verify');
      setLoading(false);
    } catch (err: any) {
      console.error("Erreur d'envoi du SMS:", err);
      if (err.code === 'auth/invalid-phone-number') {
        setError("Numéro de téléphone invalide (incluez l'indicatif ex:+33).");
      } else {
        setError(err.message || "Erreur d'envoi du SMS.");
      }
      if ((window as any).recaptchaVerifier) {
         try {
           (window as any).recaptchaVerifier.clear();
           (window as any).recaptchaVerifier = null;
         } catch(e){}
      }
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length < 6) {
      setError("Veuillez entrer le code à 6 chiffres.");
      return;
    }
    
    if (!confirmationResult) {
      setError("Session expirée. Veuillez recommencer.");
      setMode('phone');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await confirmationResult.confirm(verificationCode);
    } catch (err: any) {
      console.error("Code de vérification erroné:", err);
      if (err.code === 'auth/invalid-verification-code') {
        setError("Code invalide.");
      } else if (err.code === 'auth/code-expired') {
        setError("Le code a expiré.");
      } else {
        setError(err.message || "Erreur lors de la vérification.");
      }
      setLoading(false);
    }
  };

  if (isIframe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="max-w-md w-full relative z-10 bg-neutral-900 border border-white/10 rounded-3xl p-8 sm:p-10 text-center shadow-2xl flex flex-col items-center">
          <Moon className="w-16 h-16 text-yellow-500 mb-6 drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
          <h2 className="text-2xl font-bold mb-4 text-white">Ouverture requise</h2>
          <p className="opacity-80 mb-8 max-w-sm text-neutral-300">
            L'authentification est bloquée à l'intérieur de l'aperçu AI Studio pour des raisons de sécurité. Veuillez ouvrir l'application en plein écran (dans un nouvel onglet) pour vous connecter.
          </p>
          <button 
            onClick={() => window.open(window.location.href, '_blank')}
            className="bg-white text-black font-bold py-3 px-8 rounded-xl shadow-lg hover:scale-105 transition"
          >
            Ouvrir en plein écran
          </button>
        </div>
      </div>
    );
  }

  // Show a global loading spinner while redirect check is active
  if (loading && mode === 'select') {
     return (
       <div className="min-h-screen flex flex-col items-center justify-center bg-black px-4 relative">
          <div className="p-5 bg-white/5 rounded-full border border-white/10 shadow-inner mb-6 animate-pulse">
            <Moon className="w-16 h-16 text-yellow-500 animate-spin-slow drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
          </div>
          <p className="text-white text-sm opacity-50">Vérification de l'authentification...</p>
       </div>
     );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      <div className="max-w-md w-full relative z-10 bg-neutral-900 border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl overflow-hidden">
        {mode !== 'select' && (
          <button 
            onClick={() => {
              setMode('select');
              setError('');
              if (mode === 'verify') {
                setVerificationCode('');
                setConfirmationResult(null);
              }
            }}
            className="mb-6 flex items-center text-neutral-400 hover:text-white transition"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Retour
          </button>
        )}

        <div className="mb-8 flex justify-center">
          <div className="p-5 bg-white/5 rounded-full border border-white/10 shadow-inner">
            <Moon className="w-16 h-16 text-yellow-500 animate-pulse drop-shadow-[0_0_15px_rgba(234,179,8,0.5)]" />
          </div>
        </div>

        <h1 className="text-3xl font-display font-bold text-white mb-2 text-center">AsrarHub</h1>
        <p className="text-neutral-400 mb-8 text-center">Connectez-vous pour commencer votre voyage spirituel.</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3 text-left w-full break-words break-all whitespace-break-spaces">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-xs break-words break-all">{error}</p>
          </div>
        )}

        {mode === 'select' && (
          <div className="flex flex-col gap-4">
            {!isNative && (
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 px-6 rounded-xl hover:opacity-90 transition active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuer avec Google
              </button>
            )}
            
            <button
              onClick={() => setMode('email')}
              className="w-full flex items-center justify-center gap-3 bg-neutral-800 text-white font-bold py-4 px-6 rounded-xl hover:bg-neutral-700 transition active:scale-95 border border-white/10"
            >
              <Mail className="w-5 h-5 text-neutral-300" />
              Continuer avec Email
            </button>
            
            <button
              onClick={() => setMode('phone')}
              className="w-full flex items-center justify-center gap-3 bg-neutral-800 text-white font-bold py-4 px-6 rounded-xl hover:bg-neutral-700 transition active:scale-95 border border-white/10"
            >
              <Phone className="w-5 h-5 text-neutral-300" />
              Continuer avec Téléphone
            </button>
          </div>
        )}

        {mode === 'email' && (
          <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-neutral-400 ml-1">Adresse Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-neutral-500" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition"
                  placeholder="nom@exemple.com"
                  required
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-neutral-400 ml-1">Mot de passe</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 mt-2 px-6 rounded-xl hover:opacity-90 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                isSignUp ? "S'inscrire" : "Se connecter"
              )}
            </button>
            
            <div className="mt-4 text-center">
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-neutral-400 hover:text-white transition"
              >
                {isSignUp ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
              </button>
            </div>
          </form>
        )}

        {mode === 'phone' && (
          <form onSubmit={handleSendCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-neutral-400 ml-1">Numéro de téléphone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-neutral-500" />
                </div>
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition"
                  placeholder="+33 6 12 34 56 78"
                  required
                />
              </div>
              <p className="text-xs text-neutral-500 ml-1 mt-1">Veuillez inclure l'indicatif du pays (+33 pour la France)</p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 mt-2 px-6 rounded-xl hover:opacity-90 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                "Envoyer le code SMS"
              )}
            </button>
            
            <div id="recaptcha-container"></div>
          </form>
        )}

        {mode === 'verify' && (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-neutral-400 ml-1">Code de vérification</label>
              <input 
                type="text" 
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full bg-black border border-white/10 rounded-xl py-4 px-4 text-white text-center tracking-[1em] text-xl font-mono focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition"
                placeholder="000000"
                required
                maxLength={6}
              />
              <p className="text-xs text-neutral-500 ml-1 mt-1 text-center">Un code à 6 chiffres a été envoyé au {phoneNumber}</p>
            </div>
            
            <button
              type="submit"
              disabled={loading || verificationCode.length < 6}
              className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 mt-2 px-6 rounded-xl hover:opacity-90 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                "Vérifier le code"
              )}
            </button>
          </form>
        )}

        {mode === 'select' && (
          <p className="mt-6 text-xs text-neutral-500 text-center">
            En vous connectant, vous acceptez nos conditions d'utilisation et notre politique de confidentialité.
          </p>
        )}
      </div>
    </div>
  );
}


