import React from 'react'
import { VENDOR_PORTAL_BASE } from '../../utils/envUrls'

export default function ProfileMyStore() {
    return (
        <div className="font-sen">
            <div className="bg-white/[0.02] backdrop-blur-2xl border border-white/5 rounded-[3rem] p-12 md:p-20 shadow-2xl relative overflow-hidden group">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10 max-w-4xl mx-auto space-y-16">
                    <div className="text-center space-y-6">
                        <div className="space-y-2">
                            <p className="text-purple-400 text-[10px] font-black uppercase tracking-[0.4em] leading-none">Global Commerce</p>
                            <h2 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-[0.9]">
                                Elevate Your Business <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-purple-500/50">
                                    to the Next Level
                                </span>
                            </h2>
                        </div>
                        <p className="text-white/40 text-lg font-medium max-w-2xl mx-auto leading-relaxed">
                            Pinksurfing provides the world's most sophisticated marketplace infrastructure. 
                            Join our elite circle of vendors and scale your brand globally.
                        </p>
                    </div>

                    <div className="pt-8 flex flex-col items-center space-y-8">
                        <div className="text-center space-y-2">
                            <p className="text-white font-black uppercase tracking-[0.2em] text-[10px]">Merchant Onboarding</p>
                            <p className="text-white/20 text-sm font-medium">Ready to deploy? Initialize your storefront in minutes.</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-6 w-full justify-center">
                            <a
                                href={VENDOR_PORTAL_BASE}
                                className="px-16 py-6 bg-white text-black font-black rounded-2xl transition-all duration-500 uppercase tracking-[0.2em] text-xs shadow-2xl hover:bg-purple-50 active:scale-95 text-center"
                            >
                                Deploy Merchant Portal
                            </a>
                            <div className="text-white/20 text-xs font-black uppercase tracking-widest">
                                Already Registered?{' '}
                                <a href={VENDOR_PORTAL_BASE} className="text-purple-400 hover:text-purple-300 transition-colors ml-2 underline decoration-purple-500/30 underline-offset-4">
                                    Sign In
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
