'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Sparkles, X } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  initialText?: string;
  placeholder?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscript, initialText = '', placeholder = 'Tap mic to speak...' }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [text, setText] = useState(initialText);
  const recognitionRef = useRef<any>(null);
  const [volume, setVolume] = useState(0);

  // Simulate volume fluctuation for visual effect when recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setVolume(Math.random() * 100);
      }, 100);
    } else {
      setVolume(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (finalTranscript || interimTranscript) {
            const newText = text + (text && finalTranscript ? ' ' : '') + finalTranscript + interimTranscript;
            // Note: This is a simplified handling. Ideally we'd separate final and interim.
            // For now, we just update the text area.
            // Better approach:
          }
        };

        // Simplified for this demo: just append final results
        recognitionRef.current.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0])
            .map((result) => result.transcript)
            .join('');

          // We need to handle the state carefully to avoid overwriting user edits
          // For this "GOD Mode" demo, let's assume voice is primary.
          setText(transcript);
          onTranscript(transcript);
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          if (isRecording) {
            // recognitionRef.current.start(); // Auto-restart if needed
            setIsRecording(false);
          }
        }
      }
    }
  }, [isRecording, onTranscript]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('Voice recognition not supported in this browser. Please type your answer.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTranscript(e.target.value);
  };

  const clearText = () => {
    setText('');
    onTranscript('');
  }

  return (
    <div className="w-full space-y-4">
      <div className="relative group">
        <textarea
          className="w-full p-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-slate-100 focus:ring-2 focus:ring-cyan-400/50 focus:border-transparent outline-none min-h-[120px] resize-none placeholder:text-slate-500 transition-all text-lg leading-relaxed shadow-inner"
          value={text}
          onChange={handleTextChange}
          placeholder={placeholder}
        />

        {text && (
          <button onClick={clearText} className="absolute top-2 right-2 p-2 text-slate-500 hover:text-white">
            <X size={16} />
          </button>
        )}

        {/* Waveform Visualizer Overlay */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute bottom-4 left-4 right-16 h-12 flex items-end gap-1 pointer-events-none"
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    height: [4, Math.random() * 32 + 4, 4],
                    backgroundColor: ['#22d3ee', '#a78bfa', '#22d3ee']
                  }}
                  transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.05 }}
                  className="w-1 bg-cyan-400 rounded-full opacity-80"
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Recording Button */}
        <div className="absolute bottom-3 right-3">
          <button
            onClick={toggleRecording}
            className={clsx(
              "w-12 h-12 rounded-full transition-all shadow-lg flex items-center justify-center relative overflow-hidden active:scale-90",
              isRecording
                ? "bg-rose-500 text-white shadow-rose-500/40"
                : "bg-cyan-500 text-slate-900 shadow-cyan-500/40"
            )}
          >
            {isRecording ? (
              <Square size={20} className="fill-current relative z-10" />
            ) : (
              <Mic size={24} className="relative z-10" />
            )}
          </button>
        </div>
      </div>

      {!text && !isRecording && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center text-slate-500 text-xs flex items-center justify-center gap-2"
        >
          <Sparkles size={12} className="text-yellow-500" />
          <span>Tap mic to speak</span>
        </motion.div>
      )}
    </div>
  );
};
