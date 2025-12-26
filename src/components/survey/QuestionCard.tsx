'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { VoiceRecorder } from './VoiceRecorder';
import { clsx } from 'clsx';
import { Check, ArrowRight, ThumbsUp, ThumbsDown } from 'lucide-react';

export type QuestionType = 'choice' | 'multi-choice' | 'text' | 'textarea' | 'slider' | 'boolean' | 'likert' | 'info';

export interface Question {
  id: string;
  section: string;
  text: string;
  subText?: string;
  type: QuestionType;
  options?: string[];
  isCore: boolean;
  required?: boolean;
  min?: number;
  max?: number;
  labels?: { [key: number]: string };
}

interface QuestionCardProps {
  question: Question;
  answer: unknown;
  onAnswer: (value: unknown) => void;
  onNext: (skipValidation?: boolean) => void;
}

interface AnswerWithOther {
  selected: string | string[];
  otherText?: string;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, answer, onAnswer, onNext }) => {
  const [otherText, setOtherText] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  // Check if answer contains "Other" selection
  useEffect(() => {
    const checkForOther = () => {
      // Direct string "Other"
      if (typeof answer === 'string' && answer === 'Other') {
        return true;
      }
      // Direct array containing "Other"
      if (Array.isArray(answer) && answer.includes('Other')) {
        return true;
      }
      // AnswerWithOther object format
      if (typeof answer === 'object' && answer !== null && 'selected' in answer) {
        const selected = (answer as AnswerWithOther).selected;
        if (typeof selected === 'string' && selected === 'Other') {
          return true;
        }
        if (Array.isArray(selected) && selected.includes('Other')) {
          return true;
        }
      }
      return false;
    };

    setShowOtherInput(checkForOther());
  }, [answer]);

  // Parse answer that may include other text
  const getAnswerValue = () => {
    if (typeof answer === 'object' && answer !== null && 'selected' in answer) {
      return (answer as AnswerWithOther).selected;
    }
    return answer;
  };

  const answerValue = getAnswerValue();

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (question.type === 'choice' && question.options) {
        const index = parseInt(e.key) - 1;
        if (index >= 0 && index < question.options.length) {
          handleChoiceSelect(question.options[index]);
        }
      }
      if (question.type === 'likert') {
        const num = parseInt(e.key);
        const min = question.min || 1;
        const max = question.max || 5;
        if (num >= min && num <= max) {
          onAnswer(num);
          setTimeout(() => onNext(true), 300);
        }
      }
      if (e.key === 'Enter' && answerValue && !showOtherInput) {
        onNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [question, answerValue, onAnswer, onNext, showOtherInput]);

  const handleChoiceSelect = (option: string) => {
    if (option === 'Other') {
      setShowOtherInput(true);
      onAnswer({ selected: option, otherText: otherText });
    } else {
      setShowOtherInput(false);
      onAnswer(option);
      setTimeout(() => onNext(true), 250);
    }
  };

  const handleMultiSelect = (option: string) => {
    const current = Array.isArray(answerValue) ? [...answerValue] : [];

    if (current.includes(option)) {
      const filtered = current.filter((i: string) => i !== option);
      if (option === 'Other') {
        setShowOtherInput(false);
        onAnswer(filtered);
      } else {
        onAnswer(filtered.includes('Other') ? { selected: filtered, otherText } : filtered);
      }
    } else {
      const newSelection = [...current, option];
      if (option === 'Other') {
        setShowOtherInput(true);
        onAnswer({ selected: newSelection, otherText: otherText });
      } else {
        onAnswer(current.includes('Other') ? { selected: newSelection, otherText } : newSelection);
      }
    }
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    if (Array.isArray(answerValue)) {
      onAnswer({ selected: answerValue, otherText: text });
    } else {
      onAnswer({ selected: 'Other', otherText: text });
    }
  };

  const handleOtherSubmit = () => {
    if (otherText.trim()) {
      onNext();
    }
  };

  const getIconForOption = (opt: string) => {
    if (opt.includes('Morning')) return '🌅';
    if (opt.includes('Evening')) return '🌇';
    if (opt.includes('Night')) return '🌙';
    if (opt.includes('Yes') && !opt.includes('year')) return <ThumbsUp size={18} />;
    if (opt === 'No') return <ThumbsDown size={18} />;
    return null;
  };

  // Likert scale labels
  const getLikertLabel = (value: number) => {
    if (question.labels && question.labels[value]) {
      return question.labels[value];
    }
    const min = question.min || 1;
    const max = question.max || 5;
    if (value === min) return 'Low';
    if (value === max) return 'High';
    return '';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="w-full max-w-xl mx-auto relative z-10"
    >
      <div className="md:glass-card md:rounded-3xl md:p-10 p-4 relative overflow-hidden">

        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="flex items-center justify-between mb-4"
          >
            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-cyan-300 text-[10px] font-bold tracking-widest uppercase backdrop-blur-sm">
              {question.section}
            </span>
          </motion.div>

          <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight tracking-tight">
            {question.text}
          </h2>

          {question.subText && (
            <p className="text-slate-400 text-base font-normal leading-relaxed">
              {question.subText}
            </p>
          )}
        </div>

        <div className="space-y-4">
          {/* Choice Questions */}
          {question.type === 'choice' && (
            <div className="grid gap-3">
              {question.options?.map((option, idx) => (
                <motion.button
                  key={option}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => handleChoiceSelect(option)}
                  className={clsx(
                    "group w-full p-5 rounded-2xl text-left text-lg font-medium transition-all border relative overflow-hidden active:scale-[0.98]",
                    answerValue === option || (typeof answer === 'object' && (answer as AnswerWithOther)?.selected === option)
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                      : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <span className="flex items-center gap-3">
                      <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-700 rounded-md opacity-50 group-hover:opacity-100 transition-opacity">
                        {idx + 1}
                      </span>
                      {getIconForOption(option) && <span className="text-xl opacity-80">{getIconForOption(option)}</span>}
                      {option}
                    </span>
                    {(answerValue === option || (typeof answer === 'object' && (answer as AnswerWithOther)?.selected === option)) &&
                      <Check className="text-cyan-400 animate-scale-in" size={20} />}
                  </div>
                </motion.button>
              ))}

              {/* Other input field */}
              {showOtherInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <input
                    type="text"
                    value={otherText}
                    onChange={(e) => handleOtherTextChange(e.target.value)}
                    placeholder="Please specify..."
                    className="w-full p-4 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                    autoFocus
                  />
                  <button
                    onClick={handleOtherSubmit}
                    disabled={!otherText.trim()}
                    className="w-full bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Continue <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}
            </div>
          )}

          {/* Boolean Questions */}
          {question.type === 'boolean' && (
            <div className="flex gap-4">
              {['Yes', 'No'].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onAnswer(option === 'Yes');
                    setTimeout(() => onNext(true), 250);
                  }}
                  className={clsx(
                    "flex-1 p-6 rounded-2xl text-center text-xl font-bold transition-all border active:scale-95",
                    answerValue === (option === 'Yes')
                      ? option === 'Yes' ? "bg-green-500/20 border-green-500/50 text-green-100" : "bg-rose-500/20 border-rose-500/50 text-rose-100"
                      : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                  )}
                >
                  <div className="mb-2 text-3xl">{option === 'Yes' ? '👍' : '👎'}</div>
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Multi-Choice Questions */}
          {question.type === 'multi-choice' && (
            <div className="grid gap-3">
              {question.options?.map((option, idx) => {
                const selectedArray = Array.isArray(answerValue) ? answerValue :
                  (typeof answer === 'object' && (answer as AnswerWithOther)?.selected ?
                    (Array.isArray((answer as AnswerWithOther).selected) ? (answer as AnswerWithOther).selected : [(answer as AnswerWithOther).selected]) :
                    []);
                const isSelected = (selectedArray as string[]).includes(option);

                return (
                  <motion.button
                    key={option}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => handleMultiSelect(option)}
                    className={clsx(
                      "p-4 rounded-xl text-left text-base font-medium transition-all border flex items-center justify-between active:scale-[0.99]",
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-100"
                        : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                    )}
                  >
                    <span>{option}</span>
                    <div className={clsx(
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                      isSelected ? "border-cyan-400 bg-cyan-400" : "border-slate-600"
                    )}>
                      {isSelected && <Check size={12} className="text-slate-900 stroke-[3px]" />}
                    </div>
                  </motion.button>
                );
              })}

              {/* Other input field for multi-choice */}
              {showOtherInput && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-2"
                >
                  <input
                    type="text"
                    value={otherText}
                    onChange={(e) => handleOtherTextChange(e.target.value)}
                    placeholder="Please specify..."
                    className="w-full p-4 rounded-xl bg-slate-800/50 border border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                  />
                </motion.div>
              )}

              <motion.button
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => onNext()}
                disabled={(showOtherInput && !otherText.trim()) || (question.required && (!Array.isArray(answerValue) || answerValue.length === 0))}
                className="mt-6 w-full bg-slate-100 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-base shadow-lg shadow-white/10"
              >
                {question.required ? 'Continue' : 'Continue (Optional)'} <ArrowRight size={18} />
              </motion.button>
            </div>
          )}

          {/* Likert Scale Questions */}
          {question.type === 'likert' && (
            <div className="py-4">
              <div className="flex flex-col gap-6">
                {/* Scale buttons */}
                <div className="flex justify-between gap-2">
                  {Array.from({ length: (question.max || 5) - (question.min || 1) + 1 }, (_, i) => {
                    const value = (question.min || 1) + i;
                    const isSelected = answerValue === value;
                    return (
                      <motion.button
                        key={value}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => {
                          onAnswer(value);
                          setTimeout(() => onNext(true), 300);
                        }}
                        className={clsx(
                          "flex-1 aspect-square max-w-16 rounded-xl text-xl font-bold transition-all border flex items-center justify-center",
                          isSelected
                            ? "bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/30"
                            : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        {value}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Labels */}
                <div className="flex justify-between text-sm text-slate-500">
                  <span>{question.labels?.[question.min || 1] || getLikertLabel(question.min || 1)}</span>
                  <span>{question.labels?.[question.max || 5] || getLikertLabel(question.max || 5)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Slider Questions */}
          {question.type === 'slider' && (
            <div className="py-6">
              <div className="relative mb-12 pt-8 px-2">
                <input
                  type="range"
                  min={question.min}
                  max={question.max}
                  value={(answerValue as number) || Math.floor((question.max! + question.min!) / 2)}
                  onChange={(e) => onAnswer(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-700/50 rounded-full appearance-none cursor-pointer accent-cyan-400 touch-none"
                  style={{
                    background: `linear-gradient(to right, #22d3ee 0%, #22d3ee ${(((answerValue as number) || Math.floor((question.max! + question.min!) / 2)) - question.min!) / (question.max! - question.min!) * 100}%, rgba(51, 65, 85, 0.5) ${(((answerValue as number) || Math.floor((question.max! + question.min!) / 2)) - question.min!) / (question.max! - question.min!) * 100}%, rgba(51, 65, 85, 0.5) 100%)`
                  }}
                />

                <div className="mt-8 text-center">
                  <div className="text-5xl font-black text-white">
                    {(answerValue as number) || Math.floor((question.max! + question.min!) / 2)}
                  </div>
                </div>

                {question.labels && (
                  <div className="flex justify-between mt-4 text-xs text-slate-500 font-medium">
                    {Object.entries(question.labels).map(([val, label]) => (
                      <span key={val}>{label}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => onNext()}
                disabled={question.required && answerValue === undefined}
                className="w-full bg-slate-100 disabled:bg-slate-700 disabled:text-slate-500 text-slate-900 font-bold py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-white/10"
              >
                {question.required ? 'Confirm' : 'Confirm (Optional)'}
              </button>
            </div>
          )}

          {/* Text/Textarea Questions */}
          {(question.type === 'textarea' || question.type === 'text') && (
            <div>
              <VoiceRecorder
                onTranscript={onAnswer}
                initialText={answerValue as string | undefined}
                placeholder={question.type === 'text' ? "Type here..." : "Tap mic to speak or type your response..."}
              />
              <button
                onClick={() => onNext()}
                disabled={question.required && !answerValue}
                className="mt-6 w-full bg-slate-100 disabled:bg-slate-800 disabled:text-slate-600 text-slate-900 font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 text-base shadow-lg shadow-white/10"
              >
                {question.required ? 'Next' : 'Next (Optional)'} <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Info type - just display text with continue button */}
          {question.type === 'info' && (
            <button
              onClick={() => onNext()}
              className="w-full bg-cyan-500 text-white font-bold py-4 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              Continue <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
