import { Button } from "../components/ui/button";
import { signInWithGoogle } from "../lib/firebase";
import { TrendingUp } from "lucide-react";
import { Meteors } from "../components/magicui/meteors";
import { Ripple } from "../components/magicui/ripple";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg-app relative flex flex-col items-center justify-center p-4 overflow-hidden font-sans">
      <Meteors number={30} className="opacity-10" />
      <Ripple color="#1A73E8" opacity={0.05} />
      
      <div className="max-w-md w-full text-center space-y-16 relative z-10">
        <div className="flex flex-col items-center gap-8">
          <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary/20 transform -rotate-3 hover:rotate-0 transition-transform duration-500 group">
            <TrendingUp className="w-12 h-12 text-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-7xl font-black tracking-tighter text-black-main mb-3 uppercase leading-none italic">TradeFlow</h1>
            <p className="text-gray-main font-black text-xs uppercase tracking-[0.4em]">Omni-channel Execution Terminal</p>
          </div>
        </div>

        <div className="bg-white p-12 rounded-[3.5rem] border border-stroke shadow-2xl shadow-black/5 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/20 rounded-full -mr-16 -mt-16 blur-3xl animate-pulse" />
          
          <div className="space-y-4 relative z-10">
            <h2 className="text-3xl font-black text-black-main uppercase tracking-tighter">Terminal Access</h2>
            <p className="text-gray-main font-medium leading-relaxed px-4">Initialize synchronization to access performance analytics and risk matrices.</p>
          </div>

          <Button 
            variant="outline" 
            className="w-full h-16 border-stroke bg-white hover:bg-black-main text-black-main hover:text-white gap-5 rounded-[1.5rem] transition-all font-black uppercase tracking-[0.2em] text-[10px] hover:border-black-main shadow-sm hover:shadow-2xl shadow-black/10 group active:scale-[0.98]"
            onClick={signInWithGoogle}
          >
            <div className="bg-white p-1 rounded-md group-hover:bg-white/10 transition-colors">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </div>
            Sign In with Google Cloud
          </Button>
          
          <div className="relative z-10 space-y-4">
            <div className="h-px bg-stroke/30 w-full" />
            <p className="text-[9px] uppercase font-black text-gray-main px-8 tracking-[0.2em] leading-relaxed opacity-60 italic">
              Access restricted to authorized personnel. Data integrity subject to terminal encryption protocols.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-8 text-center pt-8 border-t border-stroke/30">
          <div className="space-y-2">
            <p className="text-3xl font-black text-black-main tracking-tighter leading-none">0%</p>
            <p className="text-[9px] uppercase tracking-[0.3em] text-gray-main font-black">Fee Margin</p>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black text-black-main tracking-tighter leading-none">High</p>
            <p className="text-[9px] uppercase tracking-[0.3em] text-gray-main font-black">Resolution</p>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black text-black-main tracking-tighter leading-none">Auto</p>
            <p className="text-[9px] uppercase tracking-[0.3em] text-gray-main font-black">Relay</p>
          </div>
        </div>
      </div>
    </div>
  );
}
