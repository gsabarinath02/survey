'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { RoleSelection } from './RoleSelection';
import { SectionProgress } from './SectionProgress';
import { CompletionScreen } from './CompletionScreen';
import { QuestionCard } from './QuestionCard';
import { ParticipantEntry } from './ParticipantEntry';
import { AlreadyCompleted } from './AlreadyCompleted';
import { ArrowLeft, Loader2, Globe, WifiOff } from 'lucide-react';
import { clsx } from 'clsx';
import { generateFingerprint } from '@/lib/fingerprint';
import { saveProgress, loadProgress, clearProgress, queueResponse, syncPendingResponses, isOffline, setupOnlineSync, markResponseSynced } from '@/lib/storage';
import { SUPPORTED_LOCALES, getLocale, setLocale, t, type Locale } from '@/lib/i18n';

interface Question {
  id: string;
  externalId: string;
  section: string;
  sectionOrder: number;
  order: number;
  text: string;
  subText?: string;
  type: string;
  options?: string[];
  required: boolean;
  randomize?: boolean;
  conditions?: Array<{
    questionId: string;
    operator: string;
    value: unknown;
  }>;
  config?: {
    min?: number;
    max?: number;
    likertLabels?: { low: string; high: string };
    placeholder?: string;
    maxSelections?: number;
  };
}

interface Section {
  name: string;
  questionCount: number;
  answeredCount: number;
}

type Phase = 'participant-entry' | 'role-selection' | 'recovery-prompt' | 'survey' | 'completed' | 'already-completed';

export function SurveyContainer() {
  const [phase, setPhase] = useState<Phase>('participant-entry');
  const [role, setRole] = useState<'nurse' | 'doctor' | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [startTime] = useState(Date.now());
  const [language, setLanguage] = useState<Locale>('en');
  const [savedProgress, setSavedProgress] = useState<ReturnType<typeof loadProgress>>(null);
  const [offline, setOffline] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Participant info
  const [participantName, setParticipantName] = useState<string>('');
  const [participantPhone, setParticipantPhone] = useState<string>('');
  const [participantHash, setParticipantHash] = useState<string>('');
  const [completedAt, setCompletedAt] = useState<string | undefined>(undefined);

  // Initialize language and check for saved progress
  useEffect(() => {
    const savedLocale = getLocale();
    setLanguage(savedLocale);

    const progress = loadProgress();
    if (progress) {
      setSavedProgress(progress);
      setPhase('recovery-prompt');
    }

    // Setup offline sync
    setupOnlineSync();

    // Check online status
    setOffline(isOffline());
    window.addEventListener('online', () => setOffline(false));
    window.addEventListener('offline', () => setOffline(true));

    return () => {
      window.removeEventListener('online', () => setOffline(false));
      window.removeEventListener('offline', () => setOffline(true));
    };
  }, []);

  // Save progress on changes
  useEffect(() => {
    if (sessionId && role && phase === 'survey') {
      saveProgress({
        sessionId,
        role,
        currentIndex,
        answers,
        language,
        startTime,
        lastUpdated: Date.now()
      });
    }
  }, [sessionId, role, currentIndex, answers, language, startTime, phase]);

  // Update question start time when question changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  // Filter visible questions based on conditions and role
  const visibleQuestions = useMemo(() => {
    if (!questions.length) return [];

    return questions.filter(q => {
      if (q.conditions && q.conditions.length > 0) {
        const conditionsMet = q.conditions.every(cond => {
          const targetQuestion = questions.find(tq => tq.externalId === cond.questionId);
          const targetId = targetQuestion?.id || cond.questionId;
          const answer = answers[targetId];

          if (answer === undefined) return false;

          switch (cond.operator) {
            case 'equals':
              return answer === cond.value;
            case 'notEquals':
              return answer !== cond.value;
            case 'contains':
              if (Array.isArray(answer)) {
                return answer.includes(cond.value as string);
              }
              return String(answer).includes(String(cond.value));
            case 'in':
              if (Array.isArray(cond.value)) {
                return cond.value.includes(answer as string);
              }
              return false;
            case 'notIn':
              if (Array.isArray(cond.value)) {
                return !cond.value.includes(answer as string);
              }
              return true;
            default:
              return true;
          }
        });

        if (!conditionsMet) return false;
      }
      return true;
    });
  }, [questions, answers]);

  // Calculate sections from visible questions
  const sections = useMemo(() => {
    const sectionMap = new Map<string, Section>();

    visibleQuestions.forEach(q => {
      const existing = sectionMap.get(q.section);
      if (existing) {
        existing.questionCount++;
        if (answers[q.id] !== undefined) {
          existing.answeredCount++;
        }
      } else {
        sectionMap.set(q.section, {
          name: q.section,
          questionCount: 1,
          answeredCount: answers[q.id] !== undefined ? 1 : 0,
        });
      }
    });

    return Array.from(sectionMap.values());
  }, [visibleQuestions, answers]);

  // Current question
  const currentQuestion = visibleQuestions[currentIndex];

  // Piping: Replace {{questionId}} placeholders with previous answers
  const processedCurrentQuestion = useMemo(() => {
    if (!currentQuestion) return null;

    // Function to pipe previous answers into question text
    const pipeAnswers = (text: string): string => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, questionId) => {
        // Find the question by externalId
        const targetQuestion = questions.find(q => q.externalId === questionId);
        if (!targetQuestion) return match;

        const answer = answers[targetQuestion.id];
        if (answer === undefined) return match;

        // Format the answer for display
        if (Array.isArray(answer)) return answer.join(', ');
        if (typeof answer === 'object') return JSON.stringify(answer);
        return String(answer);
      });
    };

    return {
      ...currentQuestion,
      text: pipeAnswers(currentQuestion.text),
      subText: currentQuestion.subText ? pipeAnswers(currentQuestion.subText) : undefined
    };
  }, [currentQuestion, questions, answers]);

  // Calculate current section info
  const currentSectionInfo = useMemo(() => {
    if (!currentQuestion) return { index: 0, inSection: 0, totalInSection: 0 };

    const sectionName = currentQuestion.section;
    const sectionIndex = sections.findIndex(s => s.name === sectionName);
    const sectionStart = visibleQuestions.findIndex(q => q.section === sectionName);
    const positionInSection = currentIndex - sectionStart + 1;
    const questionsInSection = visibleQuestions.filter(q => q.section === sectionName).length;

    return {
      index: sectionIndex,
      inSection: positionInSection,
      totalInSection: questionsInSection,
    };
  }, [currentQuestion, currentIndex, sections, visibleQuestions]);

  // Handle language change
  const handleLanguageChange = useCallback((newLocale: Locale) => {
    setLanguage(newLocale);
    setLocale(newLocale);
    setShowLanguageMenu(false);
  }, []);

  // Resume saved progress
  const handleResumeProgress = useCallback(async () => {
    if (savedProgress) {
      setIsLoading(true);

      try {
        // Use the /resume endpoint to get questions and previous answers from server
        const response = await fetch(`/api/sessions/${savedProgress.sessionId}/resume`);

        if (!response.ok) {
          // If session doesn't exist anymore, start fresh
          clearProgress();
          setPhase('participant-entry');
          return;
        }

        const data = await response.json();

        // Set all session data from the resume response
        setRole(data.role);
        setSessionId(savedProgress.sessionId);
        setLanguage(data.language as Locale || savedProgress.language as Locale);

        // Load questions from the server response
        let processedQuestions = data.questions as Question[];
        processedQuestions = processedQuestions.map(q => {
          if (q.randomize && q.options) {
            return {
              ...q,
              options: [...q.options].sort(() => Math.random() - 0.5)
            };
          }
          return q;
        });
        setQuestions(processedQuestions);

        // Merge server answers with any local answers that may not have synced
        const mergedAnswers = { ...data.answers, ...savedProgress.answers };
        setAnswers(mergedAnswers);

        // Use the currentIndex from server (which accounts for answered questions)
        setCurrentIndex(data.currentIndex ?? savedProgress.currentIndex ?? 0);

        setPhase('survey');
      } catch (error) {
        console.error('Error resuming progress:', error);
        // If session doesn't exist anymore, start fresh
        clearProgress();
        setPhase('participant-entry');
      } finally {
        setIsLoading(false);
      }
    }
  }, [savedProgress]);

  // Start fresh
  const handleStartFresh = useCallback(() => {
    clearProgress();
    setSavedProgress(null);
    setParticipantName('');
    setParticipantPhone('');
    setParticipantHash('');
    setPhase('participant-entry');
  }, []);

  // Generate participant hash
  const generateHash = (name: string, phone: string): string => {
    const combined = `${name.toLowerCase().trim()}-${phone.replace(/\D/g, '')}`;
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  };

  // Handle participant entry submission
  const handleParticipantSubmit = useCallback(async (name: string, phone: string) => {
    setIsLoading(true);
    setParticipantName(name);
    setParticipantPhone(phone);

    try {
      const fp = await generateFingerprint();
      const hash = generateHash(name, phone);
      setParticipantHash(hash);

      // Check if participant already has a session
      const checkUrl = `/api/check-participant?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&fingerprint=${encodeURIComponent(fp.hash)}`;
      const response = await fetch(checkUrl);
      const data = await response.json();

      if (data.status === 'completed') {
        setCompletedAt(data.completedAt);
        setPhase('already-completed');
      } else if (data.status === 'in_progress') {
        // Resume existing session
        setSessionId(data.sessionId);
        setRole(data.role);
        // Load the session data
        const sessResponse = await fetch(`/api/sessions/${data.sessionId}/resume`);
        if (sessResponse.ok) {
          const sessData = await sessResponse.json();
          setQuestions(sessData.questions || []);
          setAnswers(sessData.answers || {});
          setCurrentIndex(sessData.currentIndex || 0);
          setPhase('survey');
        } else {
          // Couldn't resume, go to role selection for new session
          setPhase('role-selection');
        }
      } else {
        // New participant - go to role selection
        setPhase('role-selection');
      }
    } catch (error) {
      console.error('Error checking participant:', error);
      // On error, proceed to role selection
      setPhase('role-selection');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Start session with selected role
  const handleSelectRole = useCallback(async (selectedRole: 'nurse' | 'doctor') => {
    setIsLoading(true);
    setRole(selectedRole);

    try {
      // Generate fingerprint
      const fp = await generateFingerprint();

      // Get source code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const sourceCode = urlParams.get('ref') || undefined;

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          fingerprint: fp.hash,
          language,
          sourceCode,
          participantName,
          participantPhone,
          participantHash,
          deviceInfo: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Session creation failed:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();

      if (!data.questions || data.questions.length === 0) {
        console.error('No questions returned from API');
        throw new Error('No questions available. Please contact administrator.');
      }

      setSessionId(data.sessionId);

      // Randomize options if needed
      let processedQuestions = data.questions as Question[];
      processedQuestions = processedQuestions.map(q => {
        if (q.randomize && q.options) {
          return {
            ...q,
            options: [...q.options].sort(() => Math.random() - 0.5)
          };
        }
        return q;
      });

      setQuestions(processedQuestions);
      setPhase('survey');
    } catch (error) {
      console.error('Error starting session:', error);
      alert(error instanceof Error ? error.message : 'Failed to start survey. Please try again.');
      // Stay on role selection instead of going to broken survey
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, [language, participantName, participantPhone, participantHash]);

  // Handle answer submission - LOCAL-FIRST for guaranteed delivery
  const handleAnswer = useCallback(async (value: unknown) => {
    if (!currentQuestion) return;

    const timeTaken = Math.round((Date.now() - questionStartTime) / 1000);
    const timestamp = Date.now();
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Submit to API
    if (sessionId) {
      const responseId = `${sessionId}_${currentQuestion.id}_${timestamp}`;

      // ALWAYS queue locally first for guaranteed delivery
      await queueResponse({
        sessionId,
        questionId: currentQuestion.id,
        value,
        timestamp
      });

      // Then attempt immediate sync if online
      if (!offline) {
        try {
          const res = await fetch('/api/responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              questionId: currentQuestion.id,
              value,
              timeTaken
            }),
          });

          if (res.ok) {
            // Mark as synced only on successful API response
            await markResponseSynced(responseId);
          }
        } catch (error) {
          console.error('Error submitting response:', error);
          // Response is already queued locally, will sync later
        }
      }
    }
  }, [currentQuestion, answers, sessionId, questionStartTime, offline]);

  // Navigate to next question
  const handleNext = useCallback(async () => {
    if (currentIndex < visibleQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Complete the survey with retry logic
      const responseTime = Math.round((Date.now() - startTime) / 1000);

      if (sessionId) {
        // Sync any pending responses first
        if (!offline) {
          try {
            await syncPendingResponses();
          } catch (e) {
            console.error('Error syncing pending responses:', e);
          }
        }

        // Complete session with retry logic (up to 3 attempts with exponential backoff)
        let completed = false;
        for (let attempt = 0; attempt < 3 && !completed; attempt++) {
          try {
            const res = await fetch(`/api/sessions/${sessionId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ complete: true, responseTime }),
            });
            if (res.ok) {
              completed = true;
            } else {
              throw new Error(`HTTP ${res.status}`);
            }
          } catch (error) {
            console.error(`Error completing session (attempt ${attempt + 1}):`, error);
            if (attempt < 2) {
              // Wait before retry: 1s, 2s
              await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
            }
          }
        }

        if (!completed) {
          // Store completion request locally for later retry
          localStorage.setItem(`pending_completion_${sessionId}`, JSON.stringify({
            sessionId,
            responseTime,
            timestamp: Date.now()
          }));
        }
      }

      clearProgress();
      setPhase('completed');
    }
  }, [currentIndex, visibleQuestions.length, sessionId, startTime, offline]);

  // Navigate to previous question
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Start new survey
  const handleStartNew = useCallback(() => {
    setPhase('participant-entry');
    setRole(null);
    setSessionId(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setParticipantName('');
    setParticipantPhone('');
    setParticipantHash('');
  }, []);

  // Render based on phase
  if (phase === 'participant-entry') {
    return <ParticipantEntry onSubmit={handleParticipantSubmit} isLoading={isLoading} />;
  }

  if (phase === 'already-completed') {
    return <AlreadyCompleted participantName={participantName} completedAt={completedAt} />;
  }

  if (phase === 'role-selection') {
    return <RoleSelection onSelectRole={handleSelectRole} isLoading={isLoading} />;
  }

  // Recovery prompt
  if (phase === 'recovery-prompt' && savedProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-8 rounded-3xl bg-slate-800/50 border border-slate-700"
        >
          <h2 className="text-2xl font-bold text-white mb-3">{t('recovery.found', language)}</h2>
          <p className="text-slate-400 mb-6">{t('recovery.message', language)}</p>
          <p className="text-sm text-slate-500 mb-6">
            Role: <span className="text-cyan-400 capitalize">{savedProgress.role}</span> •
            Progress: <span className="text-cyan-400">{savedProgress.currentIndex + 1} questions</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleResumeProgress}
              className="flex-1 bg-cyan-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-cyan-600 transition-colors"
            >
              {t('recovery.resume', language)}
            </button>
            <button
              onClick={handleStartFresh}
              className="flex-1 bg-slate-700 text-slate-300 font-bold py-3 px-6 rounded-xl hover:bg-slate-600 transition-colors"
            >
              {t('recovery.startNew', language)}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'completed') {
    const completionTime = Math.round((Date.now() - startTime) / 60000);
    return (
      <CompletionScreen
        role={role!}
        totalQuestions={visibleQuestions.length}
        completionTime={completionTime}
        onStartNew={handleStartNew}
      />
    );
  }

  // Survey phase
  if (isLoading || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 md:p-8">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl" />
      </div>

      {/* Offline indicator */}
      {offline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-amber-500/20 border border-amber-500/50 text-amber-200 px-4 py-2 rounded-full flex items-center gap-2 text-sm"
        >
          <WifiOff className="w-4 h-4" />
          {t('offline.notice', language)}
        </motion.div>
      )}

      {/* Header with Back Button and Language Toggle */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={currentIndex === 0 ? handleStartNew : handlePrevious}
          className={clsx(
            'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
            'transition-all duration-200',
            currentIndex === 0
              ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          {currentIndex === 0 ? t('survey.exit', language) : t('survey.back', language)}
        </button>

        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-500">
            {role === 'nurse' ? t('survey.nurseSurvey', language) : t('survey.doctorSurvey', language)}
          </div>

          {/* Language Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
            >
              <Globe className="w-4 h-4" />
              {SUPPORTED_LOCALES.find(l => l.code === language)?.nativeName || 'English'}
            </button>

            {showLanguageMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden"
              >
                {SUPPORTED_LOCALES.map(locale => (
                  <button
                    key={locale.code}
                    onClick={() => handleLanguageChange(locale.code)}
                    className={clsx(
                      'w-full px-4 py-2 text-left text-sm transition-colors',
                      language === locale.code
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : 'text-slate-300 hover:bg-slate-700'
                    )}
                  >
                    {locale.nativeName}
                  </button>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Section Progress */}
      <SectionProgress
        sections={sections}
        currentSectionIndex={currentSectionInfo.index}
        currentQuestionInSection={currentSectionInfo.inSection}
        totalQuestionsInCurrentSection={currentSectionInfo.totalInSection}
      />

      {/* Question Card */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl"
          >
            <QuestionCard
              question={{
                id: currentQuestion.id,
                section: currentQuestion.section,
                text: processedCurrentQuestion?.text || currentQuestion.text,
                subText: processedCurrentQuestion?.subText || currentQuestion.subText,
                type: currentQuestion.type as 'choice' | 'multi-choice' | 'text' | 'textarea' | 'slider' | 'boolean' | 'likert' | 'info',
                options: currentQuestion.options,
                isCore: currentQuestion.required,
                required: currentQuestion.required,
                min: currentQuestion.config?.min,
                max: currentQuestion.config?.max,
                labels: currentQuestion.config?.likertLabels
                  ? { 1: currentQuestion.config.likertLabels.low, 5: currentQuestion.config.likertLabels.high }
                  : undefined,
              }}
              answer={answers[currentQuestion.id]}
              onAnswer={handleAnswer}
              onNext={handleNext}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Question Counter */}
      <div className="text-center text-sm text-slate-500 mt-4">
        {t('survey.question', language)} {currentIndex + 1} {t('survey.of', language)} {visibleQuestions.length}
      </div>
    </div>
  );
}
