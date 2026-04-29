/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, signInWithGoogle, logout } from "./lib/firebase";
import { LayoutDashboard, FileText, BookOpen, Download, Wallet, LogOut, TrendingUp, Menu, X } from "lucide-react";
import { Button } from "./components/ui/button";
import { Toaster } from "./components/ui/sonner";
import Ticker from "./components/Ticker";
import { DotPattern } from "./components/magicui/dot-pattern";

// Pages (will implement next)
import DashboardPage from "./pages/Dashboard";
import TradesPage from "./pages/Trades";
import JournalPage from "./pages/Journal";
import FundsPage from "./pages/Funds";
import ImportPage from "./pages/Import";
import LoginPage from "./pages/Login";

function AppLayout({ children, user }: { children: React.ReactNode, user: User }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Trade Log", path: "/trades", icon: FileText },
    { name: "Journal", path: "/journal", icon: BookOpen },
    { name: "Funds", path: "/funds", icon: Wallet },
    { name: "Import", path: "/import", icon: Download },
  ];

  return (
    <div className="min-h-screen bg-transparent text-black-main flex flex-col md:flex-row relative">
      <DotPattern width={20} height={20} cx={1} cy={1} cr={1} className="opacity-40 [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-stroke bg-white/80 backdrop-blur-md sticky top-0 h-screen shadow-sm">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-black-main">TradeFlow</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg font-bold text-[13px] text-gray-main hover:text-black-main hover:bg-accent transition-all active:scale-[0.98]"
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-stroke/50">
          <div className="flex items-center gap-3 px-3 py-2 bg-accent/50 rounded-lg border border-stroke/50">
            <img src={user.photoURL || ""} alt={user.displayName || ""} className="w-8 h-8 rounded-full border border-stroke/50 shadow-sm" />
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black text-black-main truncate">{user.displayName}</p>
              <p className="text-[10px] text-gray-main font-medium truncate">{user.email}</p>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-rose-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-stroke bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary" />
          <span className="text-lg font-black text-black-main">TradeFlow</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-black-main">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white pt-16">
          <nav className="p-6 space-y-4">
            {navItems.map((item) => (
              <Link 
                key={item.path} 
                to={item.path}
                className="flex items-center gap-4 text-xl font-black text-black-main"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="w-6 h-6 text-primary" />
                {item.name}
              </Link>
            ))}
            <button 
              onClick={() => { logout(); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-4 text-xl font-black text-destructive pt-4 border-t border-stroke w-full"
            >
              <LogOut className="w-6 h-6" />
              Sign Out
            </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:h-screen overflow-hidden">
        <Ticker />
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Toaster />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
        <Route path="*" element={
          user ? (
            <AppLayout user={user}>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/trades" element={<TradesPage />} />
                <Route path="/journal" element={<JournalPage />} />
                <Route path="/funds" element={<FundsPage />} />
                <Route path="/import" element={<ImportPage />} />
              </Routes>
            </AppLayout>
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </Router>
  );
}

