import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatNotif } from '@/context/ChatNotifContext';
import { MessageSquare, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function GlobalToast() {
  const { latestMsg } = useChatNotif();
  const [isVisible, setIsVisible] = useState(false);
  const [msgData, setMsgData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (latestMsg) {
      setMsgData(latestMsg);
      setIsVisible(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4000); // Tampil selama 4 detik
      
      return () => clearTimeout(timer);
    }
  }, [latestMsg]);

  return (
    <AnimatePresence>
      {isVisible && msgData && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed top-4 left-0 right-0 z-[9999] px-4 pointer-events-none flex justify-center"
        >
          <div className="w-full max-w-sm sm:max-w-md pointer-events-auto cursor-pointer" onClick={() => {
            setIsVisible(false);
            navigate('/dashboard/chat');
          }}>
            {/* WhatsApp-style premium container */}
            <div className="relative overflow-hidden rounded-[20px] bg-[#111111]/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)] p-1">
              
              {/* Subtle top glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent blur-sm"></div>

              <div className="flex items-start gap-3 p-3">
                {/* Icon Wrapper */}
                <div className="w-10 h-10 flex-shrink-0 rounded-[14px] bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/20 flex items-center justify-center shadow-inner">
                  <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="text-sm font-bold text-white truncate pr-2">
                      {msgData.sender_name}
                    </h4>
                    <span className="text-[10px] font-medium text-emerald-400 whitespace-nowrap bg-emerald-400/10 px-1.5 py-0.5 rounded-md border border-emerald-400/20">
                      Pesan Baru
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {msgData.content}
                  </p>
                </div>
                
                {/* Close Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsVisible(false);
                  }}
                  className="w-6 h-6 flex-shrink-0 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors border border-white/5 text-neutral-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
