import React, { useState } from 'react';
import { AppMode } from './types';
import { ChatInterface } from './components/ChatInterface';
import { LiveInterface } from './components/LiveInterface';
import { ImageEditInterface } from './components/ImageEditInterface';
import { TranscribeInterface } from './components/TranscribeInterface';
import { TTSInterface } from './components/TTSInterface';
import { IconChat, IconLive, IconImage, IconTranscribe, IconVolumeUp } from './components/icons';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.CHAT);

  const NavItem = ({ m, icon, label }: { m: AppMode, icon: React.ReactNode, label: string }) => (
    <button
      onClick={() => setMode(m)}
      className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 w-full ${
        mode === m 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <div className={`${mode === m ? 'text-white' : 'text-slate-500'}`}>{icon}</div>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg mr-3 flex items-center justify-center text-white text-lg">M</span>
            Manzoor AI
          </h1>
          <p className="text-xs text-slate-400 mt-1 pl-11">Powered by Gemini</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem m={AppMode.CHAT} icon={<IconChat />} label="Chat Assistant" />
          <NavItem m={AppMode.LIVE} icon={<IconLive />} label="Live Voice" />
          <NavItem m={AppMode.IMAGE_EDIT} icon={<IconImage />} label="Image Editor" />
          <NavItem m={AppMode.TRANSCRIBE} icon={<IconTranscribe />} label="Transcribe" />
          <NavItem m={AppMode.TTS} icon={<IconVolumeUp />} label="Text to Speech" />
        </nav>

        <div className="p-4 border-t border-slate-100">
            <div className="text-xs text-slate-400 text-center">
                Built with Gemini 2.5 Flash & 3.0 Pro
            </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
          <span className="font-bold text-lg">Manzoor AI</span>
          <div className="flex space-x-2">
              <button onClick={() => setMode(AppMode.CHAT)} className={`p-2 rounded ${mode===AppMode.CHAT ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500'}`}><IconChat/></button>
              <button onClick={() => setMode(AppMode.LIVE)} className={`p-2 rounded ${mode===AppMode.LIVE ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500'}`}><IconLive/></button>
              <button onClick={() => setMode(AppMode.IMAGE_EDIT)} className={`p-2 rounded ${mode===AppMode.IMAGE_EDIT ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500'}`}><IconImage/></button>
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-hidden p-4 md:p-6 pt-20 md:pt-6 relative">
        <div className="h-full max-w-5xl mx-auto relative">
           {/* We keep all components mounted but toggle visibility to preserve state */}
           <div className={`h-full w-full ${mode === AppMode.CHAT ? 'block' : 'hidden'}`}>
             <ChatInterface />
           </div>
           <div className={`h-full w-full ${mode === AppMode.LIVE ? 'block' : 'hidden'}`}>
             <LiveInterface />
           </div>
           <div className={`h-full w-full ${mode === AppMode.IMAGE_EDIT ? 'block' : 'hidden'}`}>
             <ImageEditInterface />
           </div>
           <div className={`h-full w-full ${mode === AppMode.TRANSCRIBE ? 'block' : 'hidden'}`}>
             <TranscribeInterface />
           </div>
           <div className={`h-full w-full ${mode === AppMode.TTS ? 'block' : 'hidden'}`}>
             <TTSInterface />
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;