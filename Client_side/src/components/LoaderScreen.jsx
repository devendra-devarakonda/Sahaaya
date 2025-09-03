import React from 'react';
import { NetworkBackground } from './NetworkBackground';
import { LogoImage } from './LogoImage';
import { HeartbeatAnimation } from './HeartbeatAnimation';
export function LoaderScreen() {
  return <div className="relative w-full h-screen overflow-hidden bg-gradient-to-b from-navy to-black flex flex-col items-center justify-center">
      <NetworkBackground />
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-4 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px]">
            <div className="w-full h-full rounded-full border-4 border-t-transparent border-b-transparent border-l-[#44d690]/30 border-r-[#00b7ff]/30 animate-spin" style={{
            animationDuration: '8s'
          }}></div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px]">
            <div className="w-full h-full rounded-full border-2 border-[#44d690]/20 animate-pulse" style={{
            animationDuration: '2s'
          }}></div>
          </div>
          <LogoImage />
        </div>
        <HeartbeatAnimation />
        <p className="text-gray-300 text-lg font-light tracking-wide text-center mt-8">
          PUBLIC HELP & RESOURCE PLATFORM
        </p>
        <div className="mt-6 flex items-center">
          <div className="h-1.5 w-1.5 rounded-full bg-[#00b7ff] mr-1.5 animate-pulse"></div>
          <div className="h-1.5 w-1.5 rounded-full bg-[#44d690] mr-1.5 animate-pulse" style={{
          animationDelay: '0.2s'
        }}></div>
          <div className="h-1.5 w-1.5 rounded-full bg-[#00b7ff] animate-pulse" style={{
          animationDelay: '0.4s'
        }}></div>
        </div>
      </div>
    </div>;
}