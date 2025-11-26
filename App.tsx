import React, { useState } from 'react';
import { AppMode } from './types';
import { ChatInterface } from './components/ChatInterface';
import { LiveInterface } from './components/LiveInterface';
import { ImageEditInterface } from './components/ImageEditInterface';
import { TranscribeInterface } from './components/TranscribeInterface';
import { TTSInterface } from './components/TTSInterface';
import { FeatureChat } from './components/FeatureChat';
import { ImageAnalysis } from './components/ImageAnalysis';
import { 
  IconChat, IconLive, IconImage, IconTranscribe, IconVolumeUp, 
  IconHome, IconPlant, IconForm, IconDocument, IconHealth, IconBook, IconTools 
} from './components/icons';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);

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
      <span className="font-medium text-sm">{label}</span>
    </button>
  );

  const DashboardCard = ({ m, icon, titleUrdu, titleEng, color }: any) => (
    <button
      onClick={() => setMode(m)}
      className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center justify-center text-center space-y-4 group hover:border-${color}-200`}
    >
      <div className={`p-4 rounded-full bg-${color}-50 text-${color}-600 group-hover:bg-${color}-100 transition-colors`}>
        {icon}
      </div>
      <div>
        <h3 className="text-xl font-bold font-urdu text-gray-800 mb-1">{titleUrdu}</h3>
        <p className="text-sm text-gray-500 font-medium">{titleEng}</p>
      </div>
    </button>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans">
      {/* Sidebar (Desktop) */}
      <div className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-100 cursor-pointer" onClick={() => setMode(AppMode.DASHBOARD)}>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center">
            <span className="w-8 h-8 bg-indigo-600 rounded-lg mr-3 flex items-center justify-center text-white text-lg">M</span>
            Manzoor AI
          </h1>
          <p className="text-xs text-slate-400 mt-1 pl-11">Powered by Gemini</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-2">Main</p>
          <NavItem m={AppMode.DASHBOARD} icon={<IconHome />} label="Home / گھر" />
          <NavItem m={AppMode.CHAT} icon={<IconChat />} label="General Chat" />
          <NavItem m={AppMode.LIVE} icon={<IconLive />} label="Live Voice" />
          
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6">Features</p>
          <NavItem m={AppMode.FORMS} icon={<IconForm />} label="Gov Forms" />
          <NavItem m={AppMode.CROPS} icon={<IconPlant />} label="Crop Doctor" />
          <NavItem m={AppMode.DOCS} icon={<IconDocument />} label="Doc Scanner" />
          <NavItem m={AppMode.FARMING} icon={<IconPlant />} label="Farming Advisor" />
          <NavItem m={AppMode.HEALTH} icon={<IconHealth />} label="Health Guide" />
          <NavItem m={AppMode.EDUCATION} icon={<IconBook />} label="Education Tutor" />
          
          <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6">Tools</p>
          <NavItem m={AppMode.IMAGE_EDIT} icon={<IconImage />} label="Image Editor" />
          <NavItem m={AppMode.TRANSCRIBE} icon={<IconTranscribe />} label="Transcribe" />
          <NavItem m={AppMode.TTS} icon={<IconVolumeUp />} label="Text to Speech" />
        </nav>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4 shadow-sm">
          <button onClick={() => setMode(AppMode.DASHBOARD)} className="font-bold text-lg flex items-center">
             <span className="w-6 h-6 bg-indigo-600 rounded mr-2 flex items-center justify-center text-white text-xs">M</span> Manzoor AI
          </button>
          <button onClick={() => setMode(AppMode.LIVE)} className="p-2 bg-red-50 text-red-600 rounded-full animate-pulse">
            <IconLive />
          </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-full overflow-hidden p-4 md:p-6 pt-20 md:pt-6 relative">
        <div className="h-full max-w-6xl mx-auto relative">
           
           {/* Dashboard View */}
           {mode === AppMode.DASHBOARD && (
             <div className="h-full overflow-y-auto pb-20">
               <div className="mb-8 text-center md:text-left">
                  <h2 className="text-3xl font-bold text-slate-800 font-urdu mb-2">خوش آمدید! (Welcome)</h2>
                  <p className="text-slate-500">Select a service to get started • خدمت کا انتخاب کریں</p>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  <DashboardCard m={AppMode.LIVE} icon={<IconLive />} titleUrdu="لائیو بات چیت" titleEng="Live Voice Chat" color="indigo" />
                  <DashboardCard m={AppMode.FORMS} icon={<IconForm />} titleUrdu="سرکاری فارم" titleEng="Gov Form Assistant" color="orange" />
                  <DashboardCard m={AppMode.CROPS} icon={<IconPlant />} titleUrdu="فصلوں کا ڈاکٹر" titleEng="Crop Doctor" color="emerald" />
                  <DashboardCard m={AppMode.DOCS} icon={<IconDocument />} titleUrdu="دستاویز پڑھیں" titleEng="Doc Reader" color="blue" />
                  <DashboardCard m={AppMode.FARMING} icon={<IconPlant />} titleUrdu="کسان مشیر" titleEng="Farming Advisor" color="green" />
                  <DashboardCard m={AppMode.HEALTH} icon={<IconHealth />} titleUrdu="صحت رہنما" titleEng="Health Guide" color="red" />
                  <DashboardCard m={AppMode.EDUCATION} icon={<IconBook />} titleUrdu="تعلیمی ٹیوٹر" titleEng="Education Tutor" color="purple" />
                  <DashboardCard m={AppMode.UTILITIES} icon={<IconTools />} titleUrdu="روزمرہ کام" titleEng="Daily Utilities" color="gray" />
               </div>
             </div>
           )}

           {/* Feature Views */}
           <div className={`h-full w-full ${mode === AppMode.CHAT ? 'block' : 'hidden'}`}>
             <ChatInterface />
           </div>
           <div className={`h-full w-full ${mode === AppMode.LIVE ? 'block' : 'hidden'}`}>
             <LiveInterface />
           </div>
           
           {/* New Features - Chat Based */}
           {mode === AppMode.FORMS && (
              <FeatureChat 
                 title="Gov Form Assistant" 
                 subtitle="سرکاری فارم معاون"
                 systemInstruction="You are a helpful government form assistant in Pakistan. Ask the user questions one by one in Urdu to collect information for a form (like ID renewal, subsidy, etc.). Keep questions simple. Once you have the info, summarize it."
                 initialMessageUrdu="میں آپ کا فارم بھرنے میں مدد کر سکتا ہوں۔ آپ کون سا فارم بھرنا چاہتے ہیں؟"
                 initialMessageEnglish="I can help you fill a form. Which form do you need help with?"
                 placeholder="Form name (e.g. ID Card)..."
                 accentColor="orange"
              />
           )}
           {mode === AppMode.FARMING && (
              <FeatureChat 
                 title="Farming Advisor" 
                 subtitle="کسان مشیر"
                 systemInstruction="You are an expert agricultural advisor for Pakistani farmers. Answer questions about crops (wheat, cotton, rice), weather, pests, and market prices in simple, rural Urdu. Provide actionable advice."
                 initialMessageUrdu="اپنی فصل یا موسم کے بارے میں سوال پوچھیں۔"
                 initialMessageEnglish="Ask about your crops or the weather."
                 placeholder="e.g. Wheat yield advice..."
                 accentColor="green"
              />
           )}
           {mode === AppMode.EDUCATION && (
              <FeatureChat 
                 title="Education Tutor" 
                 subtitle="تعلیمی ٹیوٹر"
                 systemInstruction="You are a patient and friendly tutor. Explain concepts (science, math, history) in very simple Urdu using local examples, like a teacher speaking to a young student."
                 initialMessageUrdu="آپ کیا سیکھنا چاہتے ہیں؟ کوئی بھی سوال پوچھیں۔"
                 initialMessageEnglish="What do you want to learn? Ask any question."
                 placeholder="e.g. What is gravity?..."
                 accentColor="purple"
              />
           )}
           {mode === AppMode.UTILITIES && (
              <FeatureChat 
                 title="Daily Utilities" 
                 subtitle="روزمرہ کام"
                 systemInstruction="You are a helpful assistant for daily tasks. Help with math, unit conversions (acres to kanals), and translating messages between Urdu and English. Keep answers short and practical."
                 initialMessageUrdu="میں حساب کتاب یا ترجمہ میں مدد کر سکتا ہوں۔"
                 initialMessageEnglish="I can help with calculations or translation."
                 placeholder="e.g. Translate this..."
                 accentColor="gray"
              />
           )}

           {/* New Features - Vision Based */}
           {mode === AppMode.CROPS && <ImageAnalysis mode="CROPS" />}
           {mode === AppMode.DOCS && <ImageAnalysis mode="DOCS" />}
           {mode === AppMode.HEALTH && <ImageAnalysis mode="HEALTH" />}

           {/* Existing Tools */}
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