import React from 'react';
import { useLiveGemini } from '../hooks/useLiveGemini';
import { IconMic, IconLive } from './icons';

export const LiveInterface: React.FC = () => {
  const { isConnected, isSpeaking, connect, disconnect, error } = useLiveGemini();

  const handleToggle = () => {
    if (isConnected) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-slate-800 text-white rounded-lg shadow-lg relative overflow-hidden">
      
      {/* Background Pulse Effect */}
      {isConnected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className={`w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-20 animate-pulse ${isSpeaking ? 'scale-125 duration-75' : 'scale-100 duration-1000'}`}></div>
           <div className={`absolute w-48 h-48 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse delay-100 ${isSpeaking ? 'scale-110' : 'scale-95'}`}></div>
        </div>
      )}

      <div className="z-10 text-center space-y-8">
        <div>
           <h2 className="text-3xl font-bold mb-2">Manzoor Live</h2>
           <p className="text-gray-400">Real-time voice conversation in Urdu</p>
        </div>

        <div className="relative">
          <button
            onClick={handleToggle}
            className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
              isConnected 
                ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-500/30' 
                : 'bg-indigo-600 hover:bg-indigo-500 ring-4 ring-indigo-500/30'
            }`}
          >
            {isConnected ? (
              <div className="h-8 w-8 bg-white rounded-sm" /> // Stop Icon
            ) : (
              <IconMic /> // Mic Icon
            )}
          </button>
          
          {isConnected && (
            <div className="absolute -bottom-12 left-0 right-0 text-center">
               <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-900/50 text-red-300 border border-red-500/30 animate-pulse">
                 <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                 LIVE
               </span>
            </div>
          )}
        </div>

        <div className="h-12 flex items-center justify-center">
            {error && <p className="text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-lg border border-red-500/20">{error}</p>}
            {!error && isConnected && (
                <p className={`text-lg font-urdu transition-opacity duration-300 ${isSpeaking ? 'opacity-100 text-indigo-300' : 'opacity-60 text-gray-400'}`}>
                    {isSpeaking ? "Manzoor is speaking..." : "Listening..."}
                </p>
            )}
            {!error && !isConnected && (
                <p className="text-gray-500 text-sm">Tap microphone to start</p>
            )}
        </div>
      </div>
    </div>
  );
};
