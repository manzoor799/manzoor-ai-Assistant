
import React, { useState, useRef, useEffect } from 'react';
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
  IconHome, IconPlant, IconForm, IconDocument, IconHealth, IconBook, IconTools,
  IconFinance, IconLegal, IconVisual, IconMedicine, IconCow, IconBriefcase, IconNews, IconSOS,
  IconShopping, IconBell, IconMoon, IconWoman, IconUser, IconFingerprint, IconMic
} from './components/icons';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [showSOS, setShowSOS] = useState(false);

  // Profile State
  const [voiceIdStatus, setVoiceIdStatus] = useState<'Not Set' | 'Active'>('Not Set');
  const [isRecordingProfile, setIsRecordingProfile] = useState(false);
  const [isProcessingProfile, setIsProcessingProfile] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Audio Cleanup on Mode Change
  useEffect(() => {
    // This effect runs when 'mode' changes.
    // The individual components (ChatInterface, FeatureChat, etc.) handles their own cleanup on unmount.
    // This is just a safeguard or place for global audio state if needed later.
    return () => {
       // Stop any global players if they existed
    }
  }, [mode]);

  const DashboardCard = ({ m, icon, titleUrdu, titleEng, color }: any) => (
    <button
      onClick={() => setMode(m)}
      className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col items-center justify-center text-center space-y-4 group hover:border-${color}-200 h-full`}
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

  const handleSOS = () => {
      setShowSOS(true);
      setTimeout(() => setShowSOS(false), 5000);
  };

  const handleRecordVoicePrint = async () => {
    if (isRecordingProfile) {
        // Stop Recording
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
        setIsRecordingProfile(false);
        setIsProcessingProfile(true);
        
        // Simulate Processing Delay
        setTimeout(() => {
            setIsProcessingProfile(false);
            setVoiceIdStatus('Active');
        }, 2000);
        return;
    }

    // Start Recording
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start();
        setIsRecordingProfile(true);
    } catch (e) {
        alert("Microphone access denied");
    }
  };

  const ProfileInterface = () => (
    <div className="h-full flex flex-col items-center justify-center bg-white p-6 rounded-xl overflow-y-auto">
        <div className={`p-6 rounded-full mb-6 transition-all duration-500 ${voiceIdStatus === 'Active' ? 'bg-green-50 text-green-600' : 'bg-indigo-50 text-indigo-600'}`}>
            <IconFingerprint />
        </div>
        <h2 className="text-2xl font-bold mb-2 font-urdu">میری پروفائل</h2>
        <p className="text-gray-500 mb-8">Personal Voice Identity & Security</p>
        
        <div className="space-y-4 w-full max-w-sm">
            <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <span>Name</span>
                <span className="font-bold">Manzoor User</span>
            </div>
             <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <span>Voice ID</span>
                <span className={`font-bold ${voiceIdStatus === 'Active' ? 'text-green-600' : 'text-gray-400'}`}>
                    {voiceIdStatus === 'Active' ? 'Active' : 'Not Set'}
                </span>
            </div>
             <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                <span>Language</span>
                <span>Urdu / English</span>
            </div>

             {voiceIdStatus === 'Not Set' && !isProcessingProfile && (
                 <div className="mt-4 p-4 bg-indigo-50 rounded-lg text-sm text-indigo-800 text-center">
                     Please say: <strong>"My name is Manzoor and this is my voice."</strong>
                 </div>
             )}

             <button 
                onClick={handleRecordVoicePrint}
                disabled={isProcessingProfile || voiceIdStatus === 'Active'}
                className={`w-full py-4 rounded-lg font-bold flex items-center justify-center transition-all ${
                    voiceIdStatus === 'Active' 
                        ? 'bg-green-600 text-white cursor-default'
                        : isRecordingProfile 
                            ? 'bg-red-500 text-white animate-pulse'
                            : isProcessingProfile
                                ? 'bg-gray-300 text-gray-500 cursor-wait'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
             >
                 {voiceIdStatus === 'Active' ? (
                     "Voice Print Verified"
                 ) : isProcessingProfile ? (
                     "Processing Voice Print..."
                 ) : isRecordingProfile ? (
                     <>
                        <span className="animate-pulse mr-2">●</span> Stop Recording
                     </>
                 ) : (
                     <>
                        <span className="mr-2"><IconMic /></span> Set Voice ID
                     </>
                 )}
             </button>
             
             {voiceIdStatus === 'Active' && (
                 <button onClick={() => setVoiceIdStatus('Not Set')} className="w-full text-gray-400 text-sm hover:text-red-500">
                     Reset Voice Print
                 </button>
             )}
        </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans flex-col">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4 lg:px-8 shadow-sm">
          <button onClick={() => setMode(AppMode.DASHBOARD)} className="font-bold text-xl flex items-center text-slate-800">
             <span className="w-8 h-8 bg-indigo-600 rounded mr-2 flex items-center justify-center text-white text-sm">M</span> Manzoor AI
          </button>
          
          <div className="flex items-center space-x-3">
             <button onClick={handleSOS} className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-full shadow-sm hover:bg-red-700 transition-transform active:scale-95">
                <IconSOS /> <span className="hidden sm:inline font-bold">SOS</span>
             </button>
             <button onClick={() => setMode(AppMode.PROFILE)} className={`p-2 rounded-full ${mode === AppMode.PROFILE ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                <IconUser />
             </button>
          </div>
      </div>

      {/* SOS Modal */}
      {showSOS && (
          <div className="fixed inset-0 z-[100] bg-red-900/90 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm">
             <div className="bg-white p-8 rounded-3xl text-center max-w-sm w-full shadow-2xl border-4 border-red-500">
                 <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                     <IconSOS />
                 </div>
                 <h2 className="text-3xl font-bold text-red-700 font-urdu mb-2">مدد! (Emergency)</h2>
                 <p className="text-gray-600 mb-6 text-lg">Alerting family...<br/>Dialing 1122...</p>
                 <button onClick={() => setShowSOS(false)} className="bg-gray-200 text-gray-800 px-6 py-4 rounded-xl font-bold w-full text-lg">Cancel</button>
             </div>
          </div>
      )}

      {/* Main Content */}
      <div className="flex-1 h-full overflow-hidden p-4 lg:p-6 pt-20 relative bg-slate-50">
        <div className="h-full max-w-7xl mx-auto">

           {/* Dashboard View */}
           {mode === AppMode.DASHBOARD && (
             <div className="h-full overflow-y-auto pb-24 scrollbar-hide">
               <div className="mb-8 text-center">
                  <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 font-urdu mb-2">خوش آمدید، دوست!</h2>
                  <p className="text-slate-500">Tap a button or speak to start.</p>
               </div>

               {/* 2. Agriculture & Livestock */}
               <div className="mb-10">
                  <div className="flex items-center space-x-2 mb-4 border-b border-slate-200 pb-2">
                      <IconPlant />
                      <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider">Agriculture & Livestock</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DashboardCard m={AppMode.CROPS} icon={<IconPlant />} titleUrdu="فصلوں کا ڈاکٹر" titleEng="Crop Doctor (Photo)" color="emerald" />
                      <DashboardCard m={AppMode.FARMING} icon={<IconPlant />} titleUrdu="کسان مشیر" titleEng="Farming Guide" color="green" />
                      <DashboardCard m={AppMode.LIVESTOCK} icon={<IconCow />} titleUrdu="مویشیوں کا علاج" titleEng="Livestock Health" color="orange" />
                      <DashboardCard m={AppMode.SHOPPING} icon={<IconShopping />} titleUrdu="منڈی / ریٹ" titleEng="Market Rates" color="rose" />
                  </div>
               </div>

               {/* 3. Finance & Earning */}
               <div className="mb-10">
                  <div className="flex items-center space-x-2 mb-4 border-b border-slate-200 pb-2">
                      <IconFinance />
                      <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider">Finance & Earning</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DashboardCard m={AppMode.FINANCE} icon={<IconFinance />} titleUrdu="بجٹ / قرض" titleEng="Budget & Loans" color="teal" />
                      <DashboardCard m={AppMode.SHOPPING} icon={<IconShopping />} titleUrdu="آن لائن بازار" titleEng="Voice Shopping" color="rose" />
                      <DashboardCard m={AppMode.JOBS} icon={<IconBriefcase />} titleUrdu="روزگار تلاش" titleEng="Job Finder" color="cyan" />
                      <DashboardCard m={AppMode.FORMS} icon={<IconForm />} titleUrdu="فارم بھریں" titleEng="Form Filler" color="amber" />
                  </div>
               </div>

               {/* 4. Health & Wellness */}
               <div className="mb-10">
                   <div className="flex items-center space-x-2 mb-4 border-b border-slate-200 pb-2">
                      <IconHealth />
                      <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider">Health & Wellness</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DashboardCard m={AppMode.HEALTH} icon={<IconHealth />} titleUrdu="علامات چیک" titleEng="Symptom Checker" color="red" />
                      <DashboardCard m={AppMode.MEDICINE} icon={<IconMedicine />} titleUrdu="نسخہ پڑھیں" titleEng="Prescription Reader" color="pink" />
                      <DashboardCard m={AppMode.WOMEN} icon={<IconWoman />} titleUrdu="خواتین کارنر" titleEng="Maternal Care" color="fuchsia" />
                      <DashboardCard m={AppMode.HEALTH} icon={<IconHealth />} titleUrdu="ڈاکٹر تلاش" titleEng="Find Doctor" color="red" />
                  </div>
               </div>

               {/* 5. Education & Govt */}
               <div className="mb-10">
                   <div className="flex items-center space-x-2 mb-4 border-b border-slate-200 pb-2">
                      <IconBook />
                      <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider">Education & Government</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DashboardCard m={AppMode.EDUCATION} icon={<IconBook />} titleUrdu="تعلیم / کہانیاں" titleEng="Education & Stories" color="purple" />
                      <DashboardCard m={AppMode.VISUAL} icon={<IconVisual />} titleUrdu="یہ کیا ہے؟" titleEng="Visual Tutor" color="lime" />
                      <DashboardCard m={AppMode.LEGAL} icon={<IconLegal />} titleUrdu="قانونی مدد" titleEng="Legal Aid" color="indigo" />
                      <DashboardCard m={AppMode.FORMS} icon={<IconForm />} titleUrdu="سرکاری سکیمیں" titleEng="Scheme Finder" color="amber" />
                  </div>
               </div>
               
               {/* 7. Community & Culture */}
               <div className="mb-10">
                   <div className="flex items-center space-x-2 mb-4 border-b border-slate-200 pb-2">
                      <IconMoon />
                      <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider">Community & Culture</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DashboardCard m={AppMode.CULTURE} icon={<IconMoon />} titleUrdu="مقامی ٹوٹکے" titleEng="Local Tips" color="violet" />
                      <DashboardCard m={AppMode.NEWS} icon={<IconNews />} titleUrdu="علاقائی خبریں" titleEng="Local News" color="sky" />
                      <DashboardCard m={AppMode.CULTURE} icon={<IconMoon />} titleUrdu="ثقافت / دین" titleEng="Culture & Religion" color="violet" />
                  </div>
               </div>

               {/* 8. Personal Tools */}
               <div className="mb-10">
                   <div className="flex items-center space-x-2 mb-4 border-b border-slate-200 pb-2">
                      <IconTools />
                      <h3 className="text-lg font-bold text-slate-700 uppercase tracking-wider">Personal Tools</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <DashboardCard m={AppMode.CHAT} icon={<IconChat />} titleUrdu="جنرل چیٹ" titleEng="AI Chat" color="indigo" />
                      <DashboardCard m={AppMode.LIVE} icon={<IconLive />} titleUrdu="لائیو بات" titleEng="Live Voice" color="red" />
                      <DashboardCard m={AppMode.REMINDERS} icon={<IconBell />} titleUrdu="یاد دہانی" titleEng="Voice Reminders" color="yellow" />
                      <DashboardCard m={AppMode.UTILITIES} icon={<IconTools />} titleUrdu="کیلکولیٹر" titleEng="Calculator/Units" color="gray" />
                      <DashboardCard m={AppMode.IMAGE_EDIT} icon={<IconImage />} titleUrdu="تصویر ایڈیٹر" titleEng="Magic Editor" color="indigo" />
                  </div>
               </div>
             </div>
           )}

           {/* Component Rendering */}
           {mode === AppMode.PROFILE && <ProfileInterface />}
           {mode === AppMode.CHAT && <ChatInterface />}
           {mode === AppMode.LIVE && <LiveInterface />}
           {mode === AppMode.IMAGE_EDIT && <ImageEditInterface />}
           {mode === AppMode.TRANSCRIBE && <TranscribeInterface />}
           {mode === AppMode.TTS && <TTSInterface />}
           
           {/* Vision Modes */}
           {mode === AppMode.CROPS && <ImageAnalysis mode="CROPS" />}
           {mode === AppMode.DOCS && <ImageAnalysis mode="DOCS" />}
           {mode === AppMode.MEDICINE && <ImageAnalysis mode="HEALTH" />} 
           {mode === AppMode.LIVESTOCK && <ImageAnalysis mode="LIVESTOCK" />}
           {mode === AppMode.VISUAL && <ImageAnalysis mode="VISUAL" />} 

           {/* Chat Features */}
           {mode === AppMode.FORMS && (
              <FeatureChat 
                 title="Gov Forms & Schemes" 
                 subtitle="فارم اور سکیمیں"
                 systemInstruction="You are a government service assistant. Help users find schemes and fill forms in Urdu. Ask questions one by one."
                 initialMessageUrdu="میں آپ کا فارم بھرنے یا سکیم تلاش کرنے میں مدد کر سکتا ہوں۔"
                 initialMessageEnglish="I can help fill forms or find schemes."
                 placeholder="Find pension scheme..."
                 accentColor="amber"
              />
           )}
           {mode === AppMode.FARMING && (
              <FeatureChat 
                 title="Farming Advisor" 
                 subtitle="کسان مشیر"
                 systemInstruction="You are an expert agricultural advisor. Provide month-by-month crop advice and sustainable tips in simple Urdu."
                 initialMessageUrdu="فصل، موسم، یا قدرتی کھاد کے بارے میں پوچھیں۔"
                 initialMessageEnglish="Ask about crops or sustainable farming."
                 placeholder="Wheat advice..."
                 accentColor="green"
              />
           )}
           {mode === AppMode.SHOPPING && (
              <FeatureChat 
                 title="Marketplace" 
                 subtitle="بازار / منڈی"
                 systemInstruction="You are a marketplace assistant. Help users buy/sell goods, check market prices, and connect with buyers in Urdu."
                 initialMessageUrdu="آج کا ریٹ پتہ کریں یا کچھ بیچیں۔"
                 initialMessageEnglish="Check rates or sell something."
                 placeholder="Cotton price today..."
                 accentColor="rose"
              />
           )}
           {mode === AppMode.FINANCE && (
              <FeatureChat 
                 title="Finance Advisor" 
                 subtitle="مالیاتی مشیر"
                 systemInstruction="You are a personal finance assistant. Help track budget, explain loans, and suggest savings in simple Urdu."
                 initialMessageUrdu="اپنا خرچہ نوٹ کریں یا قرض کے بارے میں پوچھیں۔"
                 initialMessageEnglish="Log expense or ask about loans."
                 placeholder="I spent 500 rupees..."
                 accentColor="teal"
              />
           )}
           {mode === AppMode.HEALTH && (
              <FeatureChat 
                 title="Health Advisor" 
                 subtitle="صحت رہنما"
                 systemInstruction="You are a health guide. Check symptoms, find doctors, and give first aid advice in Urdu. Always advise professional care."
                 initialMessageUrdu="اپنی طبیعت/علامات بتائیں یا ڈاکٹر تلاش کریں۔"
                 initialMessageEnglish="Describe symptoms or find a doctor."
                 placeholder="Headache and fever..."
                 accentColor="red"
              />
           )}
           {mode === AppMode.WOMEN && (
              <FeatureChat 
                 title="Women's Corner" 
                 subtitle="خواتین کارنر"
                 systemInstruction="You are a supportive assistant for women. Guide on maternal health, pregnancy (week-by-week), and home business in Urdu."
                 initialMessageUrdu="حمل، بچہ، یا گھریلو ہنر کے بارے میں پوچھیں۔"
                 initialMessageEnglish="Ask about pregnancy or skills."
                 placeholder="20th week of pregnancy..."
                 accentColor="fuchsia"
              />
           )}
           {mode === AppMode.EDUCATION && (
              <FeatureChat 
                 title="Education & Skills" 
                 subtitle="تعلیم اور ہنر"
                 systemInstruction="You are a tutor. Teach school subjects, practical skills (tailoring, repair), or tell stories in Urdu."
                 initialMessageUrdu="کوئی سبق یا ہنر سیکھیں۔"
                 initialMessageEnglish="Learn a subject or skill."
                 placeholder="Teach me sewing..."
                 accentColor="purple"
              />
           )}
           {mode === AppMode.CULTURE && (
              <FeatureChat 
                 title="Community & Culture" 
                 subtitle="بیٹھک"
                 systemInstruction="You are a community voice. Share local tips, folk tales, religious quotes, or help form self-help groups in Urdu."
                 initialMessageUrdu="کہانی سنیں یا کمیونٹی مشورہ لیں۔"
                 initialMessageEnglish="Hear a story or community tip."
                 placeholder="Tell a folk tale..."
                 accentColor="violet"
              />
           )}
           {mode === AppMode.LEGAL && (
              <FeatureChat 
                 title="Legal Rights" 
                 subtitle="قانونی حقوق"
                 systemInstruction="You are a legal aid assistant. Explain rights regarding land, labor, and police in simple Urdu."
                 initialMessageUrdu="اپنے قانونی مسئلہ کے بارے میں پوچھیں۔"
                 initialMessageEnglish="Ask about a legal issue."
                 placeholder="Land dispute..."
                 accentColor="indigo"
              />
           )}
           {mode === AppMode.JOBS && (
              <FeatureChat 
                 title="Job Finder" 
                 subtitle="روزگار"
                 systemInstruction="You are a career assistant. Help find local jobs, create CVs, and prepare for interviews in Urdu."
                 initialMessageUrdu="نوکری تلاش کریں یا سی وی بنائیں۔"
                 initialMessageEnglish="Find a job or make CV."
                 placeholder="Driver job nearby..."
                 accentColor="cyan"
              />
           )}
           {mode === AppMode.REMINDERS && (
              <FeatureChat 
                 title="Voice Reminders" 
                 subtitle="یاد دہانی"
                 systemInstruction="You are a reminder assistant. Help schedule tasks and medicines. Confirm details in Urdu."
                 initialMessageUrdu="کیا یاد کروانا ہے؟"
                 initialMessageEnglish="What to remind?"
                 placeholder="Medicine at 8 PM..."
                 accentColor="yellow"
              />
           )}
           {mode === AppMode.NEWS && (
              <FeatureChat 
                 title="Local News" 
                 subtitle="خبریں"
                 systemInstruction="You are a news reader. Provide local announcements, weather alerts, and disaster warnings in Urdu."
                 initialMessageUrdu="علاقائی خبریں اور موسم کا حال۔"
                 initialMessageEnglish="Local news and weather."
                 placeholder="Weather alert..."
                 accentColor="sky"
              />
           )}
           {mode === AppMode.UTILITIES && (
              <FeatureChat 
                 title="Utilities" 
                 subtitle="روزمرہ اوزار"
                 systemInstruction="You are a utility helper. Perform calculations, unit conversions (kanal/acre), and translations in Urdu."
                 initialMessageUrdu="حساب، کنورژن، یا ترجمہ کریں۔"
                 initialMessageEnglish="Math, conversion, or translation."
                 placeholder="5 acres in kanal..."
                 accentColor="gray"
              />
           )}

        </div>
      </div>
    </div>
  );
};

export default App;
