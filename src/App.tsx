/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { 
  Code2, ArrowRight, Github, Twitter, Linkedin, Terminal, 
  Monitor, Briefcase, Palette, Sparkles, Plus, Trash2, 
  ExternalLink, LogIn, LogOut, X, Loader2, IndianRupee, Zap, ShieldCheck,
  Instagram, MessageSquare, Layout
} from "lucide-react";
import { useState, useEffect } from "react";
import * as React from "react";
import { 
  collection, onSnapshot, query, orderBy, addDoc, 
  deleteDoc, doc, serverTimestamp, setDoc 
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, onAuthStateChanged, signOut, 
  createUserWithEmailAndPassword, setPersistence, browserLocalPersistence 
} from "firebase/auth";
import { db, auth } from "./lib/firebase";
import { Project } from "./types";

const services = [
  {
    title: "Website Building",
    description: "Custom-built, responsive websites tailored to your unique vision and goals. We use the latest technologies to ensure speed and security.",
    icon: Monitor,
    delay: 0.1,
  },
  {
    title: "Commercial Business Website Making",
    description: "High-conversion websites designed specifically for businesses. From e-commerce to service portals, we drive growth through code.",
    icon: Briefcase,
    delay: 0.2,
  },
  {
    title: "Graphic Designing",
    description: "Stunning visual identities and digital assets that capture your brand's essence and leave a lasting impression on your audience.",
    icon: Palette,
    delay: 0.3,
  },
];

const BackgroundParticles = React.memo(() => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 bg-lightning-blue/60 rounded-full shadow-[0_0_8px_rgba(0,209,255,0.8)]"
          style={{ willChange: "transform, opacity" }}
          initial={{
            x: `${Math.random() * 100}vw`,
            y: `${Math.random() * 100}vh`,
            opacity: Math.random() * 0.5 + 0.3,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            x: [
              `${Math.random() * 100}vw`,
              `${Math.random() * 100}vw`,
              `${Math.random() * 100}vw`,
            ],
            y: [
              `${Math.random() * 100}vh`,
              `${Math.random() * 100}vh`,
              `${Math.random() * 100}vh`,
            ],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: Math.random() * 20 + 20, // Slower for better performance
            repeat: Infinity,
            ease: "linear", // Linear is easier to calculate over long paths
          }}
        />
      ))}
    </div>
  );
});

export default function App() {
  const [view, setView] = useState<'portfolio' | 'admin'>('portfolio');
  const [projects, setProjects] = useState<Project[]>([]);
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [socials, setSocials] = useState({
    instagram: "",
    linkedin: "",
    discord: "",
    behance: ""
  });
  const [isUpdatingSocials, setIsUpdatingSocials] = useState(false);
  
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    imageUrl: "",
    projectUrl: ""
  });

  const ADMIN_EMAIL = "asxramzonfire09@thecodehouse.com";

  useEffect(() => {
    // Ensure persistence is local (stays logged in on the device)
    setPersistence(auth, browserLocalPersistence).catch(err => {
      console.error("Persistence error:", err);
    });

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const q = query(collection(db, "projects"), orderBy("createdAt", "desc"));
    const unsubDocs = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Project[];
      setProjects(data);
    });

    const unsubSocials = onSnapshot(doc(db, "settings", "socials"), (snapshot) => {
      if (snapshot.exists()) {
        setSocials(snapshot.data() as any);
      }
    });

    return () => {
      unsubAuth();
      unsubDocs();
      unsubSocials();
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError("");
    
    // Map username to email for Auth
    const email = username.includes("@") ? username : `${username}@thecodehouse.com`;

    try {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr: any) {
        // If user doesn't exist and it's our admin email, create it
        if ((signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') && email === ADMIN_EMAIL) {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
          } catch (createErr: any) {
            // If creation fails (e.g. user already exists but password was wrong), throw the original sign-in error
            throw signInErr;
          }
        } else {
          throw signInErr;
        }
      }
      setUsername("");
      setPassword("");
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setLoginError("Invalid credentials. Please check your password.");
      } else if (err.code === 'auth/too-many-requests') {
        setLoginError("Too many failed attempts. Try again later.");
      } else {
        setLoginError(`System error: ${err.message}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setView('portfolio');
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title || !newProject.imageUrl || !newProject.projectUrl) return;
    
    try {
      await addDoc(collection(db, "projects"), {
        ...newProject,
        createdAt: serverTimestamp()
      });
      setNewProject({ title: "", description: "", imageUrl: "", projectUrl: "" });
      setIsAddingProject(false);
    } catch (err) {
      console.error("Error adding project:", err);
    }
  };

  const handleUpdateSocials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSocials(true);
    try {
      await setDoc(doc(db, "settings", "socials"), {
        ...socials,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error updating socials:", err);
    } finally {
      setIsUpdatingSocials(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteDoc(doc(db, "projects", id));
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  const DiscordIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C1.533 9.046 1.05 13.58 1.443 18.067a.072.072 0 0 0 .033.05 19.821 19.821 0 0 0 5.964 3.018.077.077 0 0 0 .085-.028c.463-.637.861-1.307 1.195-2.01a.076.076 0 0 0-.041-.105 13.11 13.11 0 0 1-1.857-.885.077.077 0 0 1-.008-.128c.125-.094.252-.192.373-.291a.073.073 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.071.071 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.857.884.076.076 0 0 0-.041.106c.33.702.729 1.372 1.192 2.009a.077.077 0 0 0 .085.029 19.814 19.814 0 0 0 5.973-3.02.077.077 0 0 0 .033-.049c.515-5.228-0.87-9.72-3.665-13.67a.066.066 0 0 0-.031-.026zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.42 0-1.336.953-2.422 2.157-2.422 1.213 0 2.176 1.096 2.156 2.422 0 1.335-0.953 2.42-2.156 2.42zm7.975 0c-1.183 0-2.157-1.085-2.157-2.42 0-1.336.955-2.422 2.157-2.422 1.213 0 2.176 1.096 2.156 2.422 0 1.335-0.943 2.42-2.156 2.42z"/>
    </svg>
  );

  const BehanceIcon = (props: any) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 14.364h-7.636c.11 1.636 1.411 2.345 3.12 2.345 1.418 0 2.65-.63 2.768-2.094h1.727c-.237 2.182-1.954 3.6-4.502 3.6-3.15 0-5.118-2.15-5.118-5.183 0-3.046 1.944-5.218 5.118-5.218 3.102 0 4.523 2.21 4.523 5.218 0 .1-.01.216-.02.332zm-7.614-1.31h5.83c-.09-1.36-.93-2.06-2.5-2.06-1.637 0-3.004.814-3.33 2.06zM6.92 6.545c2.46 0 4.14 1.134 4.14 3.09 0 1.24-.766 2.23-1.966 2.62v.064c1.623.27 2.614 1.48 2.614 3.018 0 2.28-2.227 3.42-4.787 3.42H2V6.545h4.92zm-1.05 5.564c1.47 0 2.484-.5 2.484-1.745 0-1.127-.92-1.755-2.31-1.755h-2.1V12.11h1.926zm.543 5.464c1.604 0 2.822-.64 2.822-1.99s-1.164-1.936-2.924-1.936H3.87V17.573h2.544zM20.182 8h-4.364V6.91h4.364V8z"/>
    </svg>
  );

  const isAdmin = user && user.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen flex flex-col font-sans relative">
      <BackgroundParticles />
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="font-display font-bold text-xl tracking-tight">
              THE CODE <span className="text-lightning-blue">HOUSE</span>
            </span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            {["WORK", "SERVICES", "PROCESS"].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                whileHover={{ scale: 1.05, color: "#00D1FF" }}
                className="transition-colors"
              >
                {item}
              </motion.a>
            ))}
          </div>
        </div>
      </nav>

      <AnimatePresence mode="wait">
        {view === 'admin' ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 flex flex-col pt-32 pb-20 px-6 max-w-7xl mx-auto w-full"
          >
            {!user ? (
              <div className="flex-1 flex items-center justify-center">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-zinc-900 w-full max-w-md rounded-[32px] border border-zinc-800 p-10 relative overflow-hidden shadow-2xl"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-lightning-blue" />
                  <div className="flex flex-col items-center mb-10">
                    <div className="w-20 h-20 bg-lightning-blue/10 rounded-3xl flex items-center justify-center mb-6 border border-lightning-blue/20">
                      <Terminal className="text-lightning-blue w-10 h-10" />
                    </div>
                    <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight">System Login</h2>
                    <p className="text-zinc-500 text-sm mt-2 text-center">Authentication required to access the central management console.</p>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Operator ID</label>
                      <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-lightning-blue transition-colors font-mono"
                        placeholder="Enter username..."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Access Key</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-lightning-blue transition-colors font-mono"
                        placeholder="********"
                        required
                      />
                    </div>
                    {loginError && <p className="text-red-500 text-xs text-center font-bold uppercase tracking-tight">{loginError}</p>}
                    <button 
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-5 bg-lightning-blue text-deep-blue rounded-2xl font-extrabold tracking-widest uppercase hover:bg-white transition-all flex items-center justify-center gap-2"
                    >
                      {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : "GRANT ACCESS"}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setView('portfolio')}
                      className="w-full text-zinc-600 text-[10px] font-bold uppercase tracking-[0.2em] hover:text-zinc-400 transition-colors"
                    >
                      Return to Surface
                    </button>
                  </form>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-zinc-800 pb-12">
                  <div>
                    <div className="flex items-center gap-3 text-lightning-blue mb-4">
                      <div className="w-2 h-2 rounded-full bg-lightning-blue animate-pulse" />
                      <span className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase">Session Active: {user.email}</span>
                    </div>
                    <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tighter">PROJECT <span className="text-lightning-blue">CONTROL</span></h1>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setIsAddingProject(true)}
                      className="px-6 py-3 bg-lightning-blue text-deep-blue rounded-full font-bold flex items-center gap-2 hover:bg-white transition-colors"
                    >
                      <Plus className="w-5 h-5" /> NEW DEPLOYMENT
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="px-6 py-3 border border-zinc-800 rounded-full font-bold text-zinc-400 hover:bg-zinc-900 transition-colors"
                    >
                      TERMINATE SESSION
                    </button>
                  </div>
                </div>

                {/* Social Registry Card */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-8">
                  <h2 className="font-display text-2xl font-bold mb-8 uppercase tracking-tight flex items-center gap-3">
                    <Terminal className="text-lightning-blue w-6 h-6" /> SOCIAL REGISTRY
                  </h2>
                  <form onSubmit={handleUpdateSocials} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Instagram Link</label>
                        <input 
                          type="url" 
                          value={socials.instagram}
                          onChange={(e) => setSocials({...socials, instagram: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-lightning-blue transition-colors text-sm"
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">LinkedIn Link</label>
                        <input 
                          type="url" 
                          value={socials.linkedin}
                          onChange={(e) => setSocials({...socials, linkedin: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-lightning-blue transition-colors text-sm"
                          placeholder="https://linkedin.com/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Discord Link</label>
                        <input 
                          type="url" 
                          value={socials.discord}
                          onChange={(e) => setSocials({...socials, discord: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-lightning-blue transition-colors text-sm"
                          placeholder="https://discord.gg/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Behance Link</label>
                        <input 
                          type="url" 
                          value={socials.behance}
                          onChange={(e) => setSocials({...socials, behance: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-3 text-white focus:outline-none focus:border-lightning-blue transition-colors text-sm"
                          placeholder="https://behance.net/..."
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        disabled={isUpdatingSocials}
                        className="px-8 py-3 bg-lightning-blue text-deep-blue rounded-full font-bold hover:bg-white transition-colors flex items-center gap-2"
                      >
                        {isUpdatingSocials ? <Loader2 className="w-4 h-4 animate-spin" /> : "UPDATE REGISTRY"}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="grid gap-6">
                  {projects.map((project) => (
                    <motion.div 
                      key={project.id}
                      layout
                      className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-8 group hover:border-lightning-blue/30 transition-colors"
                    >
                      <div className="w-full md:w-48 aspect-video rounded-xl overflow-hidden border border-zinc-800">
                        <img src={project.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h3 className="font-display text-xl font-bold mb-2 uppercase tracking-tight">{project.title}</h3>
                        <p className="text-zinc-500 text-sm line-clamp-1">{project.description}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <a 
                          href={project.projectUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-3 bg-zinc-800 rounded-xl hover:bg-lightning-blue hover:text-deep-blue transition-colors"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                        <button 
                          onClick={() => handleDeleteProject(project.id)}
                          className="p-3 bg-zinc-800 rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                  {projects.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                      <p className="text-zinc-600 font-mono text-xs tracking-widest uppercase">Registry Empty. Awaiting initial input.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="portfolio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col pt-20"
          >
            <main className="flex-1 flex flex-col">
              {/* Hero Section */}
              <section id="hero" className="relative pb-20 px-6 overflow-hidden min-h-[80vh] flex items-center">
          {/* Background Decorative Elements */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.1, 0.15, 0.1]
              }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-lightning-blue/10 blur-[120px] rounded-full" 
            />
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.05, 0.08, 0.05]
              }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-lightning-blue/5 blur-[120px] rounded-full" 
            />
          </div>

          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.2
                    }
                  }
                }}
              >
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lightning-blue/10 border border-lightning-blue/20 text-lightning-blue text-xs font-bold tracking-widest uppercase mb-6"
                >
                  <Terminal className="w-3 h-3" />
                  Available for new projects
                </motion.div>
                
                <div className="overflow-hidden mb-8">
                  <motion.h1 
                    variants={{
                      hidden: { y: "100%" },
                      visible: { y: 0 }
                    }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="font-display text-4xl md:text-8xl font-extrabold leading-[0.9] tracking-tighter"
                  >
                    WE BUILD <br />
                    <span className="text-lightning-blue">DIGITAL</span> <br />
                    EXPERIENCES.
                  </motion.h1>
                </div>
                
                <motion.p 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="text-zinc-400 text-lg md:text-xl max-w-lg mb-10 leading-relaxed"
                >
                  The Code House is a boutique development agency specializing in high-performance, 
                  visually stunning websites that push the boundaries of the web.
                </motion.p>

                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  className="flex flex-wrap gap-4"
                >
                  <motion.a 
                    href="#work"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group px-8 py-4 bg-lightning-blue text-deep-blue rounded-full font-extrabold text-lg flex items-center gap-2 hover:bg-white transition-colors"
                  >
                    VIEW OUR WORK
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.a>
                  <motion.a 
                    href="#services"
                    whileHover={{ scale: 1.05, backgroundColor: "rgba(39, 39, 42, 1)" }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 border border-zinc-700 rounded-full font-extrabold text-lg hover:bg-zinc-800 transition-colors"
                  >
                    OUR SERVICES
                  </motion.a>
                </motion.div>

                <motion.div 
                  variants={{
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 }
                  }}
                  className="mt-16 flex flex-col gap-6"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-mono uppercase tracking-[0.3em] text-zinc-500">FOLLOW OUR JOURNEY</span>
                    <div className="h-px w-12 bg-zinc-800" />
                  </div>
                  <div className="flex gap-6">
                    {[
                      { icon: Instagram, url: socials.instagram },
                      { icon: Linkedin, url: socials.linkedin },
                      { icon: DiscordIcon, url: socials.discord },
                      { icon: BehanceIcon, url: socials.behance }
                    ].map((social, i) => social.url ? (
                      <motion.a
                        key={i}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.2, color: "#00D1FF" }}
                        className="text-zinc-600 transition-colors"
                      >
                        <social.icon className="w-6 h-6" />
                      </motion.a>
                    ) : null)}
                  </div>
                </motion.div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative block"
              >
                <div className="relative z-10 aspect-square rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl max-w-2xl mx-auto">
                  <img 
                    src="https://picsum.photos/seed/codehouse/1200/1200" 
                    alt="The Code House Work" 
                    className="w-full h-full object-cover opacity-60 grayscale hover:grayscale-0 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                  
                  {/* Floating Tech Card */}
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8 p-4 md:p-6 rounded-2xl bg-zinc-900/90 backdrop-blur-md border border-lightning-blue/30 shadow-lightning-blue/10 shadow-2xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase">System Status: Optimal</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "85%" }}
                          transition={{ duration: 2, delay: 1 }}
                          className="h-full bg-lightning-blue" 
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-lightning-blue/70">
                        <span>PERFORMANCE</span>
                        <span>85%</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Decorative Rings */}
                <div className="absolute -top-5 -right-5 md:-top-10 md:-right-10 w-24 h-24 md:w-40 md:h-40 border border-lightning-blue/20 rounded-full -z-10" />
                <div className="absolute -bottom-10 -left-10 md:-bottom-20 md:-left-20 w-40 h-40 md:w-64 md:h-64 border border-lightning-blue/10 rounded-full -z-10" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Work Section */}
        <section id="work" className="py-32 px-6 border-t border-zinc-900 relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
              <div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lightning-blue/10 border border-lightning-blue/20 text-lightning-blue text-xs font-bold tracking-widest uppercase mb-6"
                >
                  <Code2 className="w-3 h-3" />
                  Recent Work
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="font-display text-4xl md:text-6xl font-extrabold tracking-tighter"
                >
                  SELECTED <span className="text-lightning-blue">PROJECTS</span>
                </motion.h2>
              </div>
              
              {isAdmin && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsAddingProject(true)}
                  className="px-6 py-3 bg-lightning-blue text-deep-blue rounded-full font-bold flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> ADD PROJECT
                </motion.button>
              )}
            </div>

            <div className="grid gap-16">
              {projects.length > 0 ? (
                projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group relative grid lg:grid-cols-2 gap-12 items-center bg-zinc-900/30 p-8 rounded-[40px] border border-zinc-800/50 hover:border-lightning-blue/30 transition-all duration-500 overflow-hidden"
                  >
                    <div className="order-2 lg:order-1">
                      <h3 className="font-display text-3xl md:text-5xl font-extrabold mb-6 group-hover:text-lightning-blue transition-colors uppercase tracking-tight">
                        {project.title}
                      </h3>
                      <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                        {project.description}
                      </p>
                      <div className="flex items-center gap-4">
                        <motion.a
                          href={project.projectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-8 py-4 bg-zinc-100 text-zinc-950 rounded-full font-bold flex items-center gap-2 hover:bg-lightning-blue hover:text-deep-blue transition-colors"
                        >
                          LIVE PREVIEW <ExternalLink className="w-4 h-4" />
                        </motion.a>
                        {isAdmin && (
                          <motion.button
                            onClick={() => handleDeleteProject(project.id)}
                            whileHover={{ scale: 1.1, color: "#ff4444" }}
                            className="p-4 text-zinc-500 transition-colors"
                          >
                            <Trash2 className="w-6 h-6" />
                          </motion.button>
                        )}
                      </div>
                    </div>
                    
                    <div className="order-1 lg:order-2 relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 group-hover:border-lightning-blue/50 transition-colors">
                      <img 
                        src={project.imageUrl} 
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950/40 to-transparent" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                  <p className="text-zinc-500 font-mono tracking-widest uppercase">No projects cataloged yet.</p>
                  {isAdmin && (
                    <button 
                      onClick={() => setIsAddingProject(true)}
                      className="mt-6 text-lightning-blue font-bold underline"
                    >
                      Add your first project
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section id="services" className="py-32 px-6 border-t border-zinc-900 bg-zinc-950/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/4 h-full bg-lightning-blue/5 blur-[120px] -z-10" />
          
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center mb-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lightning-blue/10 border border-lightning-blue/20 text-lightning-blue text-xs font-bold tracking-widest uppercase mb-6"
              >
                <Sparkles className="w-3 h-3" />
                Our Expertise
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-display text-4xl md:text-6xl font-extrabold tracking-tighter mb-6"
              >
                SPECIALIZED <span className="text-lightning-blue">SERVICES</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
              >
                We blend technical expertise with creative vision to deliver digital solutions that stand out in a crowded market.
              </motion.p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {services.map((service, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: service.delay, duration: 0.6 }}
                  whileHover={{ y: -10 }}
                  className="group p-8 rounded-3xl bg-zinc-900/50 border border-zinc-800 hover:border-lightning-blue/50 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <service.icon className="w-24 h-24 text-lightning-blue" />
                  </div>
                  
                  <div className="w-14 h-14 bg-lightning-blue/10 rounded-2xl flex items-center justify-center mb-6 border border-lightning-blue/20 group-hover:bg-lightning-blue group-hover:text-deep-blue transition-colors">
                    <service.icon className="w-7 h-7" />
                  </div>
                  
                  <h3 className="font-display text-2xl font-bold mb-4 tracking-tight group-hover:text-lightning-blue transition-colors leading-tight uppercase">
                    {service.title}
                  </h3>
                  
                  <p className="text-zinc-400 leading-relaxed text-sm mb-6">
                    {service.description}
                  </p>
                  
                  <motion.div 
                    className="flex items-center gap-2 text-lightning-blue text-sm font-bold tracking-widest uppercase cursor-pointer"
                    whileHover={{ x: 5 }}
                  >
                    Learn More
                    <ArrowRight className="w-4 h-4" />
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section id="why-us" className="py-32 px-6 border-t border-zinc-900 relative">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center text-center mb-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lightning-blue/10 border border-lightning-blue/20 text-lightning-blue text-xs font-bold tracking-widest uppercase mb-6"
              >
                <Terminal className="w-3 h-3" />
                The House Advantage
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="font-display text-4xl md:text-6xl font-extrabold tracking-tighter mb-6 uppercase"
              >
                WHY CHOOSE <span className="text-lightning-blue">US??</span>
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
              >
                We deliver world-class digital solutions with a focus on value, speed, and uncompromising quality.
              </motion.p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  title: "UNBEATABLE VALUE",
                  description: "We are proud to be the MOST AFFORDABLE agency in India, delivering premium quality at prices that empower local businesses.",
                  icon: IndianRupee,
                  delay: 0.1
                },
                {
                  title: "LIGHTNING PERFORMANCE",
                  description: "Our websites aren't just pretty—they are optimized for speed, ensuring your users never have to wait for your story to load.",
                  icon: Zap,
                  delay: 0.2
                },
                {
                  title: "ROCK-SOLID SECURITY",
                  description: "Built with the latest security protocols and 24/7 reliability, we ensure your business is protected in the digital frontier.",
                  icon: ShieldCheck,
                  delay: 0.3
                }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: item.delay }}
                  className="relative p-10 rounded-[40px] bg-zinc-900/40 border border-zinc-800 hover:border-lightning-blue/40 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <item.icon className="w-32 h-32 text-lightning-blue" />
                  </div>
                  
                  <div className="w-16 h-16 bg-lightning-blue/10 rounded-2xl flex items-center justify-center mb-8 border border-lightning-blue/20">
                    <item.icon className="w-8 h-8 text-lightning-blue" />
                  </div>
                  
                  <h3 className="font-display text-2xl font-bold mb-4 tracking-tight uppercase">
                    {item.title}
                  </h3>
                  
                  <p className="text-zinc-400 leading-relaxed">
                    {item.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </motion.div>
    )}
  </AnimatePresence>

  {/* Add Project Modal */}
  <AnimatePresence>
        {isAddingProject && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-zinc-900 w-full max-w-2xl rounded-[32px] border border-zinc-800 p-10 relative overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-lightning-blue" />
              <button 
                onClick={() => setIsAddingProject(false)}
                className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="font-display text-3xl font-extrabold uppercase tracking-tight mb-8">Deploy New Project</h2>

              <form onSubmit={handleAddProject} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Project Title</label>
                    <input 
                      type="text" 
                      value={newProject.title}
                      onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-lightning-blue transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Project Link</label>
                    <input 
                      type="url" 
                      value={newProject.projectUrl}
                      onChange={(e) => setNewProject({...newProject, projectUrl: e.target.value})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-lightning-blue transition-colors"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Image URL (Preview)</label>
                  <input 
                    type="url" 
                    value={newProject.imageUrl}
                    onChange={(e) => setNewProject({...newProject, imageUrl: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-lightning-blue transition-colors"
                    placeholder="https://..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 px-1">Description</label>
                  <textarea 
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-lightning-blue transition-colors h-32 resize-none"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAddingProject(false)}
                    className="flex-1 py-5 border border-zinc-800 rounded-2xl font-extrabold tracking-widest uppercase hover:bg-zinc-800 transition-all text-zinc-400"
                  >
                    ABORT
                  </button>
                  <button 
                    type="submit"
                    className="flex-2 py-5 bg-lightning-blue text-deep-blue rounded-2xl font-extrabold tracking-widest uppercase hover:bg-white transition-all transform active:scale-[0.98]"
                  >
                    INITIALIZE DEPLOYMENT
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer / Bottom Bar */}
      <footer className="py-20 px-6 border-t border-zinc-900 bg-zinc-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex flex-col items-center md:items-start gap-6">
            <span className="font-display font-bold text-2xl tracking-tight">
              THE CODE <span className="text-lightning-blue">HOUSE</span>
            </span>
            <p className="text-zinc-500 text-sm max-w-xs text-center md:text-left leading-relaxed">
              Crafting high-performance digital architectures for the modern web. Built with precision and passion.
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-6 text-center md:text-right">
            <nav className="flex flex-wrap justify-center gap-8 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
              <a href="#work" className="hover:text-lightning-blue transition-colors">Work</a>
              <a href="#services" className="hover:text-lightning-blue transition-colors">Services</a>
              <button onClick={() => setView('admin')} className="text-lightning-blue hover:text-white transition-colors">Console Access</button>
            </nav>
            <div className="flex gap-8 text-xs font-mono text-zinc-600 uppercase tracking-widest items-center">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                SERVER: ASIA-SOUTH-1
              </span>
              <span className="hidden md:inline">BUILD: V1.1.02</span>
              <p className="text-zinc-700">© 2026 THE CODE HOUSE</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
