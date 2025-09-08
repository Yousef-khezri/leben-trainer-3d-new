import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronLeft, ChevronRight, Languages, Hash, BookOpen, MapPin, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Types
type Question = {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  category: string;
  has_image: boolean;
  image_path: string | null;
  state_id?: string | null;
};

type State = {
  id: string;
  name: string;
};

type Translation = {
  question_text: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
};

type SpeedMode = "langsam" | "schnell";

const languages = [
  { value: "persisch", label: "Persisch (فارسی)" },
  { value: "englisch", label: "English" },
  { value: "russisch", label: "Русский" },
  { value: "ukrainisch", label: "Українська" },
  { value: "arabisch", label: "العربية" },
  { value: "türkisch", label: "Türkçe" }
];

// Normalize various forms of correct_option to 'a' | 'b' | 'c' | 'd'
function normalizeCorrectOption(
  value: any,
  q?: { option_a: string; option_b: string; option_c: string; option_d: string }
): 'a' | 'b' | 'c' | 'd' | null {
  if (value === undefined || value === null) return null;
  let raw = String(value).trim().toLowerCase();
  if (!raw) return null;

  if (['a', 'b', 'c', 'd'].includes(raw)) return raw as any;
  if (['1', '2', '3', '4'].includes(raw)) {
    return (['a', 'b', 'c', 'd'][parseInt(raw, 10) - 1]) as any;
  }
  if (raw.startsWith('option_')) {
    const last = raw.slice(-1);
    if (['a', 'b', 'c', 'd'].includes(last)) return last as any;
  }

  const first = raw[0];
  if (['a', 'b', 'c', 'd'].includes(first)) return first as any;

  if (q) {
    const mapText: Record<string, 'a' | 'b' | 'c' | 'd'> = {};
    if (q.option_a) mapText[q.option_a.trim().toLowerCase()] = 'a';
    if (q.option_b) mapText[q.option_b.trim().toLowerCase()] = 'b';
    if (q.option_c) mapText[q.option_c.trim().toLowerCase()] = 'c';
    if (q.option_d) mapText[q.option_d.trim().toLowerCase()] = 'd';
    const byText = mapText[raw];
    if (byText) return byText;
  }
  return null;
}

/**
 * 3D Speed Toggle (Langsam/Schnell) – کوچک و خوانا
 * Track تو رفته + Knob براق؛ متن با درخشش سبز/قرمز و سایه تیره برای خوانایی
 */
const SpeedToggle = ({
  mode,
  onToggle,
}: {
  mode: SpeedMode;
  onToggle: (m: SpeedMode) => void;
}) => {
  const isFast = mode === "schnell";

  // اندازه‌های جمع‌وجور
  const TRACK_W = 140; // px
  const KNOB_W = 68;   // px
  const PADDING = 8;   // p-1 => 4px در هر طرف => جمعاً 8px
  const travelX = TRACK_W - KNOB_W - PADDING; // 140 - 68 - 8 = 64px

  return (
    <button
      type="button"
      aria-label="Geschwindigkeit umschalten"
      aria-pressed={isFast}
      onClick={() => onToggle(isFast ? "langsam" : "schnell")}
      className="
        relative w-[140px] h-9 p-1 rounded-lg
        bg-background/70 border border-white/10
        shadow-inner
        [box-shadow:inset_0_2px_10px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.06)]
        backdrop-blur-sm overflow-hidden select-none
        hover:brightness-110 transition
      "
    >
      {/* نور ملایم بالا/پایین ترک */}
      <div className="absolute inset-0 pointer-events-none rounded-lg">
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-t-lg" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent rounded-b-lg" />
      </div>

      {/* دستگیره سه‌بعدی */}
      <motion.div
        className="
          absolute top-1 left-1 bottom-1 w-[68px] rounded-md
          bg-gradient-to-b from-white/30 to-white/10
          dark:from-white/10 dark:to-white/5
          border border-white/30 ring-1 ring-black/10
          shadow-[0_6px_14px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.25)]
          flex items-center justify-center
          pointer-events-none
        "
        animate={{ x: isFast ? travelX : 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
      >
        <span
          className={`text-[13px] font-bold tracking-wide ${
            isFast ? "text-red-500" : "text-green-500"
          }`}
          style={{
            // درخشش لامپی + خط دور تیره برای خوانایی بهتر
            textShadow: isFast
              ? "0 0 6px rgba(239,68,68,0.8), 0 0 10px rgba(239,68,68,0.5), 0 1px 0 rgba(0,0,0,0.95)"
              : "0 0 6px rgba(34,197,94,0.8), 0 0 10px rgba(34,197,94,0.5), 0 1px 0 rgba(0,0,0,0.95)",
          }}
        >
          {isFast ? "Schnell" : "Langsam"}
        </span>
      </motion.div>
    </button>
  );
};

const Training = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // Default language: persisch
  const [selectedLanguage, setSelectedLanguage] = useState<string>("persisch");
  const [showTranslation, setShowTranslation] = useState(false);
  const [jumpToQuestion, setJumpToQuestion] = useState("");
  
  // New state for question filtering
  const [isStateSpecific, setIsStateSpecific] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
  const [answerTimer, setAnswerTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Speed mode (Langsam/Schnell) + reveal delay based on it
  const [speedMode, setSpeedMode] = useState<SpeedMode>("langsam");
  // Schnell = 10s, Langsam = 30s
  const revealDelay = useMemo(() => (speedMode === "schnell" ? 10000 : 30000), [speedMode]);

  // Translation state and cache
  const [translation, setTranslation] = useState<Translation | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const translationsCache = useRef<Record<string, Translation>>({});

  // Fetch states on component mount
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const { data, error } = await supabase
          .from('states')
          .select('*')
          .order('name');
        
        if (error) throw error;
        setStates(data || []);
      } catch (error) {
        console.error('Error fetching states:', error);
        toast({
          title: "Fehler beim Laden der Bundesländer",
          description: "Die Bundesländer konnten nicht geladen werden.",
          variant: "destructive",
        });
      }
    };
    
    fetchStates();
  }, [toast]);

  // Fetch questions based on selection
  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      try {
        let query = supabase.from('questions').select('*');
        
        if (isStateSpecific && selectedState) {
          query = query.eq('state_id', selectedState);
        } else if (!isStateSpecific) {
          query = query.eq('category', 'general');
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        setQuestions(data || []);
        setCurrentQuestion(0);
        setShowTranslation(false);
        setTranslation(null);
        setSelectedAnswer("");
        setShowCorrectAnswer(false);
        if (answerTimer) {
          clearTimeout(answerTimer);
          setAnswerTimer(null);
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
        toast({
          title: "Fehler beim Laden der Fragen",
          description: "Die Fragen konnten nicht geladen werden.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!isStateSpecific || (isStateSpecific && selectedState)) {
      fetchQuestions();
    }
  }, [isStateSpecific, selectedState, toast]);

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowTranslation(false);
      setTranslation(null);
      resetAnswerState();
    }
  };

  const resetAnswerState = () => {
    setSelectedAnswer("");
    setShowCorrectAnswer(false);
    if (answerTimer) {
      clearTimeout(answerTimer);
      setAnswerTimer(null);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
    setCurrentQuestion(currentQuestion - 1);
      setShowTranslation(false);
      setTranslation(null);
      resetAnswerState();
    }
  };

  const handleJumpToQuestion = () => {
    const questionNum = parseInt(jumpToQuestion);
    if (questionNum >= 1 && questionNum <= questions.length) {
      setCurrentQuestion(questionNum - 1);
      setShowTranslation(false);
      setTranslation(null);
      resetAnswerState();
      setJumpToQuestion("");
    }
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer || showCorrectAnswer) return; // avoid multiple
    setSelectedAnswer(answer);
    setShowCorrectAnswer(true);
    if (answerTimer) {
      clearTimeout(answerTimer);
      setAnswerTimer(null);
    }
  };

  // Auto-reveal correct answer after delay based on speedMode
  useEffect(() => {
    const currentQuestionData = questions[currentQuestion];
    if (!showCorrectAnswer && !selectedAnswer && currentQuestionData) {
      const timer = setTimeout(() => {
        setShowCorrectAnswer(true);
      }, revealDelay);
      setAnswerTimer(timer);
      return () => clearTimeout(timer);
    }
    return () => {
      if (answerTimer) clearTimeout(answerTimer);
    };
  }, [currentQuestion, showCorrectAnswer, selectedAnswer, questions, revealDelay]);

  // Fetch translation from Supabase with cache (array-style, like questions)
  const fetchTranslation = useCallback(
    async (questionId: string, language?: string) => {
      if (!questionId) {
        console.warn('fetchTranslation: questionId is missing');
        return;
      }

      const lang = (language || selectedLanguage || "persisch").trim();
      const cacheKey = `${questionId}:${lang}`;

      if (translationsCache.current[cacheKey]) {
        setTranslation(translationsCache.current[cacheKey]);
        return;
      }

      setTranslationLoading(true);
      try {
        const { data, error } = await (supabase
          .from('question_translations' as any)
          .select('question_text, option_a, option_b, option_c, option_d')
          .eq('question_id', questionId)
          .eq('language', lang) as any);

        if (error) throw error;

        const row = Array.isArray(data) && data.length > 0 ? (data[0] as Translation) : null;

        if (row) {
          translationsCache.current[cacheKey] = row;
          setTranslation(row);
        } else {
          setTranslation(null);
        }
      } catch (e: any) {
        console.error('Error fetching translation:', {
          message: e?.message,
          details: e?.details,
          hint: e?.hint,
          code: e?.code,
        });
        toast({
          title: 'خطا در بارگذاری ترجمه',
          description: e?.message ?? 'ترجمه این سؤال قابل دریافت نیست.',
          variant: 'destructive',
        });
        setTranslation(null);
      } finally {
        setTranslationLoading(false);
      }
    },
    [selectedLanguage, toast]
  );

  // Load translation when toggled on / language changes / question changes
  useEffect(() => {
    const q = questions[currentQuestion];
    if (showTranslation && q?.id) {
      fetchTranslation(q.id, selectedLanguage || "persisch");
    } else if (!showTranslation) {
      setTranslation(null);
    }
  }, [showTranslation, selectedLanguage, currentQuestion, questions, fetchTranslation]);

  const handleQuestionTypeChange = (checked: boolean) => {
    setIsStateSpecific(checked);
    setSelectedState("");
    setCurrentQuestion(0);
  };

  const question = questions[currentQuestion];

  // Normalize correct option once per question
  const correctKey = useMemo(
    () => normalizeCorrectOption(question?.correct_option, question),
    [question]
  );
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero relative flex items-center justify-center">
        <Card className="card-3d p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground">Lade Fragen...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-hero relative flex items-center justify-center">
        <Card className="card-3d p-8 text-center">
          <p className="text-foreground mb-4">
            {isStateSpecific && !selectedState 
              ? "Bitte wählen Sie ein Bundesland aus." 
              : "Keine Fragen verfügbar."}
          </p>
          <Button onClick={() => navigate('/')} variant="outline" className="glass">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Startseite
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative">
      <div className="container mx-auto px-4 py-8 relative">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            onClick={() => navigate('/')}
            variant="ghost"
            size="lg"
            className="glass text-foreground hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Zurück zur Startseite
          </Button>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gradient">
              Training Modus
            </h1>
            <p className="text-muted-foreground">
              Frage {currentQuestion + 1} von {questions.length}
            </p>
            <p className="text-xs text-muted-foreground">
              {isStateSpecific ? `${states.find(s => s.id === selectedState)?.name || 'Bundesland'} Fragen` : 'Allgemeine Fragen'}
            </p>
          </div>

          <div className="w-32"></div>
        </motion.div>

        {/* Question Type Selection + Speed Toggle */}
        <motion.div
          className="max-w-4xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="card-3d p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
              {/* Left: Allgemeine / Bundesland + State Select */}
              <div className="flex items-center gap-3 md:gap-4 flex-wrap md:flex-nowrap min-w-0">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-foreground">Allgemeine Fragen</span>
                </div>
                <Switch
                  checked={isStateSpecific}
                  onCheckedChange={handleQuestionTypeChange}
                  className="data-[state=checked]:bg-gradient-primary"
                />
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  <span className="text-foreground">Bundesland Fragen</span>
                </div>

                {isStateSpecific && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Select value={selectedState} onValueChange={setSelectedState}>
                      <SelectTrigger className="w-56 md:w-64 glass border-white/20">
                        <SelectValue placeholder="Bundesland auswählen" />
                      </SelectTrigger>
                      {/* Use Portal/popover rendering to escape stacking context of the card */}
                      <SelectContent
                        position="popper"
                        side="bottom"
                        align="start"
                        sideOffset={8}
                        className="z-[9999] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl border border-border pointer-events-auto"
                      >
                        {states.map((state) => (
                          <SelectItem key={state.id} value={state.id}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </motion.div>
                )}
              </div>

              {/* Right: Speed Toggle (کوچکتر) */}
              <div className="ml-auto shrink-0">
                <SpeedToggle mode={speedMode} onToggle={setSpeedMode} />
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Language Selection (Dropdown rendered in Portal to avoid stacking issues) */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-8 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            <span className="text-foreground">Übersetzung:</span>
          </div>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-64 glass border-white/20">
              <SelectValue placeholder="Sprache auswählen" />
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="z-[9999] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl border border-border pointer-events-auto"
            >
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Question Card */}
        <div className="mb-24 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              className="w-full max-w-4xl mx-auto relative"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {/* بدون z-index بالا تا روی منوها قرار نگیرد */}
              <Card className="card-3d p-8 space-y-6 relative overflow-visible">
                {question.has_image && question.image_path && (
                  <div className="mb-6">
                    <img
                      src={
                        question.image_path.startsWith("http")
                        ? question.image_path
                        : `https://tnnjkbipydrhccwxofzm.supabase.co/storage/v1/object/public/question-images/${question.image_path}`
                      }
                      alt="Frage Illustration"
                      className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">
                    {question.question_text}
                  </h2>

                  {/* Translation block: do NOT intercept clicks */}
                  {showTranslation && selectedLanguage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-primary/10 rounded-lg border border-primary/20 relative z-0 pointer-events-none"
                      style={{ pointerEvents: 'none' }}
                    >
                      {translationLoading ? (
                        <div className="animate-pulse text-muted-foreground">
                          در حال بارگذاری ترجمه...
                        </div>
                      ) : translation ? (
                        <div className="space-y-3">
                          <h3 className="text-lg font-semibold text-primary">
                            {translation.question_text}
                          </h3>
                          <div className="grid grid-cols-1 gap-2">
                            <p className="text-primary/80"><strong>A:</strong> {translation.option_a ?? question.option_a}</p>
                            <p className="text-primary/80"><strong>B:</strong> {translation.option_b ?? question.option_b}</p>
                            <p className="text-primary/80"><strong>C:</strong> {translation.option_c ?? question.option_c}</p>
                            <p className="text-primary/80"><strong>D:</strong> {translation.option_d ?? question.option_d}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          برای این سؤال ترجمه‌ای پیدا نشد.
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Options */}
                  <div className="grid grid-cols-1 gap-4 relative pointer-events-auto">
                    {[
                      { key: "a", text: question.option_a },
                      { key: "b", text: question.option_b },
                      { key: "c", text: question.option_c },
                      { key: "d", text: question.option_d }
                    ].map((option) => {
                      const isSelected = selectedAnswer === option.key;
                      const isCorrect = correctKey ? option.key === correctKey : false;
                      const isWrong = showCorrectAnswer && isSelected && !isCorrect;
                      
                      let cardClass = "relative p-4 cursor-pointer transition-all duration-300 border-2 rounded-lg text-left w-full bg-background pointer-events-auto";
                      
                      if (showCorrectAnswer) {
                        if (isCorrect) {
                          cardClass += " border-green-500 bg-green-50 text-green-800 shadow-green-200 shadow-lg";
                        } else if (isWrong) {
                          cardClass += " border-red-500 bg-red-50 text-red-800 shadow-red-200 shadow-lg";
                        } else {
                          cardClass += " border-gray-200 bg-gray-50 text-gray-600";
                        }
                      } else {
                        if (isSelected) {
                          cardClass += " border-primary bg-primary/10 text-primary shadow-lg transform scale-[1.02]";
                        } else {
                          cardClass += " border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-md hover:transform hover:scale-[1.01]";
                        }
                      }

                      return (
                        <motion.div
                          key={option.key}
                          className="w-full relative pointer-events-auto"
                          whileHover={!showCorrectAnswer ? { y: -2 } : {}}
                          whileTap={!showCorrectAnswer ? { scale: 0.98 } : {}}
                          transition={{ duration: 0.2 }}
                        >
                          <button
                            type="button"
                            className={cardClass}
                            onClick={() => !showCorrectAnswer && handleAnswerSelect(option.key)}
                            disabled={showCorrectAnswer}
                            style={{ minHeight: '60px' }}
                          >
                            <div className="flex items-center space-x-4 w-full">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                showCorrectAnswer 
                                  ? (isCorrect ? 'bg-green-500 text-white' : (isWrong ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-600'))
                                  : (isSelected ? 'bg-primary text-white' : 'bg-primary/20 text-primary')
                              }`}>
                                {option.key.toUpperCase()}
                              </div>
                              <p className="text-current flex-1 font-medium leading-relaxed">{option.text}</p>
                              <div className="flex items-center">
                                {showCorrectAnswer && isCorrect && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: 180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                  >
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                  </motion.div>
                                )}
                                {showCorrectAnswer && isWrong && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: 180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                  >
                                    <XCircle className="h-6 w-6 text-red-600" />
                                  </motion.div>
                                )}
                              </div>
                            </div>
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {selectedLanguage && (
                    <Button
                      onClick={() => setShowTranslation(!showTranslation)}
                      variant="secondary"
                      className="bg-gradient-secondary hover:bg-gradient-secondary"
                    >
                      <Languages className="mr-2 h-4 w-4" />
                      {showTranslation ? "Übersetzung ausblenden" : "Übersetzung anzeigen"}
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="flex gap-4">
            <Button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              variant="outline"
              size="lg"
              className="glass border-white/20"
            >
              <ChevronLeft className="mr-2 h-5 w-5" />
              Vorherige
            </Button>

            <Button
              onClick={nextQuestion}
              disabled={currentQuestion === questions.length - 1}
              variant="outline"
              size="lg"
              className="glass border-white/20"
            >
              Nächste
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Frage Nr."
              value={jumpToQuestion}
              onChange={(e) => setJumpToQuestion(e.target.value)}
              className="w-24 glass border-white/20"
              type="number"
              min={1}
              max={questions.length}
            />
            <Button
              onClick={handleJumpToQuestion}
              variant="secondary"
              size="sm"
              disabled={!jumpToQuestion}
              className="bg-gradient-primary hover:bg-gradient-primary px-6"
            >
              Springe
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Training;

// import { useState, useEffect, useRef, useCallback, useMemo } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Switch } from "@/components/ui/switch";
// import { ArrowLeft, ChevronLeft, ChevronRight, Languages, Hash, BookOpen, MapPin, CheckCircle, XCircle } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { supabase } from "@/integrations/supabase/client";

// // Types
// type Question = {
//   id: string;
//   question_text: string;
//   option_a: string;
//   option_b: string;
//   option_c: string;
//   option_d: string;
//   correct_option: string;
//   category: string;
//   has_image: boolean;
//   image_path: string | null;
//   state_id?: string | null;
// };

// type State = {
//   id: string;
//   name: string;
// };

// type Translation = {
//   question_text: string;
//   option_a?: string | null;
//   option_b?: string | null;
//   option_c?: string | null;
//   option_d?: string | null;
// };

// type SpeedMode = "langsam" | "schnell";

// const languages = [
//   { value: "persisch", label: "Persisch (فارسی)" },
//   { value: "englisch", label: "English" },
//   { value: "russisch", label: "Русский" },
//   { value: "ukrainisch", label: "Українська" },
//   { value: "arabisch", label: "العربية" },
//   { value: "türkisch", label: "Türkçe" }
// ];

// // Normalize various forms of correct_option to 'a' | 'b' | 'c' | 'd'
// function normalizeCorrectOption(
//   value: any,
//   q?: { option_a: string; option_b: string; option_c: string; option_d: string }
// ): 'a' | 'b' | 'c' | 'd' | null {
//   if (value === undefined || value === null) return null;
//   let raw = String(value).trim().toLowerCase();
//   if (!raw) return null;

//   if (['a', 'b', 'c', 'd'].includes(raw)) return raw as any;

//   if (['1', '2', '3', '4'].includes(raw)) {
//     return (['a', 'b', 'c', 'd'][parseInt(raw, 10) - 1]) as any;
//   }

//   if (raw.startsWith('option_')) {
//     const last = raw.slice(-1);
//     if (['a', 'b', 'c', 'd'].includes(last)) return last as any;
//   }

//   const first = raw[0];
//   if (['a', 'b', 'c', 'd'].includes(first)) return first as any;

//   if (q) {
//     const mapText: Record<string, 'a' | 'b' | 'c' | 'd'> = {};
//     if (q.option_a) mapText[q.option_a.trim().toLowerCase()] = 'a';
//     if (q.option_b) mapText[q.option_b.trim().toLowerCase()] = 'b';
//     if (q.option_c) mapText[q.option_c.trim().toLowerCase()] = 'c';
//     if (q.option_d) mapText[q.option_d.trim().toLowerCase()] = 'd';
//     const byText = mapText[raw];
//     if (byText) return byText;
//   }

//   return null;
// }

// /**
//  * 3D Speed Toggle (Langsam/Schnell) - نسخه کوچک‌تر و خواناتر
//  * - Track: 180x40
//  * - Knob: 100px
//  * - متن فقط سبز/قرمز با درخشندگی، همراه با سایه تیره برای خوانایی بهتر
//  */
// const SpeedToggle = ({
//   mode,
//   onToggle,
// }: {
//   mode: SpeedMode;
//   onToggle: (m: SpeedMode) => void;
// }) => {
//   const isFast = mode === "schnell";

//   // اندازه‌ها
//   const TRACK_W = 180; // px
//   const KNOB_W = 100;  // px
//   const PADDING = 8;   // p-1 => 4px در هر طرف => جمعاً 8px
//   const travelX = TRACK_W - KNOB_W - PADDING; // 180 - 100 - 8 = 72px

//   return (
//     <button
//       type="button"
//       aria-label="Geschwindigkeit umschalten"
//       aria-pressed={isFast}
//       onClick={() => onToggle(isFast ? "langsam" : "schnell")}
//       className="
//         relative w-[180px] h-10 p-1 rounded-xl
//         bg-background/70 border border-white/10
//         shadow-inner
//         [box-shadow:inset_0_2px_10px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.06)]
//         backdrop-blur-sm overflow-hidden select-none
//         hover:brightness-110 transition
//       "
//     >
//       {/* نور ملایم بالا/پایین ترک */}
//       <div className="absolute inset-0 pointer-events-none rounded-xl">
//         <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/5 to-transparent rounded-t-xl" />
//         <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent rounded-b-xl" />
//       </div>

//       {/* دستگیره سه‌بعدی */}
//       <motion.div
//         className="
//           absolute top-1 left-1 bottom-1 w-[100px] rounded-lg
//           bg-gradient-to-b from-white/30 to-white/10
//           dark:from-white/10 dark:to-white/5
//           border border-white/30 ring-1 ring-black/10
//           shadow-[0_8px_18px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.25)]
//           flex items-center justify-center
//         "
//         animate={{ x: isFast ? travelX : 0 }}
//         transition={{ type: "spring", stiffness: 360, damping: 26 }}
//       >
//         <span
//           className={`text-[14px] md:text-[15px] font-bold tracking-wide ${
//             isFast ? "text-red-500" : "text-green-500"
//           }`}
//           style={{
//             // ترکیب درخشش رنگی + خط دور تیره برای خوانایی
//             textShadow: isFast
//               ? "0 0 8px rgba(239,68,68,0.75), 0 0 14px rgba(239,68,68,0.45), 0 1px 0 rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.7)"
//               : "0 0 8px rgba(34,197,94,0.75), 0 0 14px rgba(34,197,94,0.45), 0 1px 0 rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.7)",
//           }}
//         >
//           {isFast ? "Schnell" : "Langsam"}
//         </span>

//         {/* هایلایت براق روی دستگیره */}
//         <div className="pointer-events-none absolute inset-0 rounded-lg">
//           <div className="absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/35 to-transparent" />
//           <div className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-lg bg-gradient-to-t from-black/20 to-transparent" />
//         </div>
//       </motion.div>
//     </button>
//   );
// };

// const Training = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const [currentQuestion, setCurrentQuestion] = useState(0);

//   // Default language: persisch
//   const [selectedLanguage, setSelectedLanguage] = useState<string>("persisch");
//   const [showTranslation, setShowTranslation] = useState(false);
//   const [jumpToQuestion, setJumpToQuestion] = useState("");
  
//   // New state for question filtering
//   const [isStateSpecific, setIsStateSpecific] = useState(false);
//   const [selectedState, setSelectedState] = useState<string>("");
//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [states, setStates] = useState<State[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedAnswer, setSelectedAnswer] = useState<string>("");
//   const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
//   const [answerTimer, setAnswerTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

//   // Speed mode (Langsam/Schnell) + reveal delay based on it
//   const [speedMode, setSpeedMode] = useState<SpeedMode>("langsam");
//   // Schnell = 10s, Langsam = 30s
//   const revealDelay = useMemo(() => (speedMode === "schnell" ? 10000 : 30000), [speedMode]);

//   // Translation state and cache
//   const [translation, setTranslation] = useState<Translation | null>(null);
//   const [translationLoading, setTranslationLoading] = useState(false);
//   const translationsCache = useRef<Record<string, Translation>>({});

//   // Fetch states on component mount
//   useEffect(() => {
//     const fetchStates = async () => {
//       try {
//         const { data, error } = await supabase
//           .from('states')
//           .select('*')
//           .order('name');
        
//         if (error) throw error;
//         setStates(data || []);
//       } catch (error) {
//         console.error('Error fetching states:', error);
//         toast({
//           title: "Fehler beim Laden der Bundesländer",
//           description: "Die Bundesländer konnten nicht geladen werden.",
//           variant: "destructive",
//         });
//       }
//     };
    
//     fetchStates();
//   }, [toast]);

//   // Fetch questions based on selection
//   useEffect(() => {
//     const fetchQuestions = async () => {
//       setLoading(true);
//       try {
//         let query = supabase.from('questions').select('*');
        
//         if (isStateSpecific && selectedState) {
//           query = query.eq('state_id', selectedState);
//         } else if (!isStateSpecific) {
//           query = query.eq('category', 'general');
//         }
        
//         const { data, error } = await query;
        
//         if (error) throw error;
//         setQuestions(data || []);
//         setCurrentQuestion(0);
//         setShowTranslation(false);
//         setTranslation(null);
//         setSelectedAnswer("");
//         setShowCorrectAnswer(false);
//         if (answerTimer) {
//           clearTimeout(answerTimer);
//           setAnswerTimer(null);
//         }
//       } catch (error) {
//         console.error('Error fetching questions:', error);
//         toast({
//           title: "Fehler beim Laden der Fragen",
//           description: "Die Fragen konnten nicht geladen werden.",
//           variant: "destructive",
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (!isStateSpecific || (isStateSpecific && selectedState)) {
//       fetchQuestions();
//     }
//   }, [isStateSpecific, selectedState, toast]);

//   const nextQuestion = () => {
//     if (currentQuestion < questions.length - 1) {
//       setCurrentQuestion(currentQuestion + 1);
//       setShowTranslation(false);
//       setTranslation(null);
//       resetAnswerState();
//     }
//   };

//   const resetAnswerState = () => {
//     setSelectedAnswer("");
//     setShowCorrectAnswer(false);
//     if (answerTimer) {
//       clearTimeout(answerTimer);
//       setAnswerTimer(null);
//     }
//   };

//   const prevQuestion = () => {
//     if (currentQuestion > 0) {
//       setCurrentQuestion(currentQuestion - 1);
//       setShowTranslation(false);
//       setTranslation(null);
//       resetAnswerState();
//     }
//   };

//   const handleJumpToQuestion = () => {
//     const questionNum = parseInt(jumpToQuestion);
//     if (questionNum >= 1 && questionNum <= questions.length) {
//       setCurrentQuestion(questionNum - 1);
//       setShowTranslation(false);
//       setTranslation(null);
//       resetAnswerState();
//       setJumpToQuestion("");
//     }
//   };

//   const handleAnswerSelect = (answer: string) => {
//     if (selectedAnswer || showCorrectAnswer) return; // avoid multiple
//     setSelectedAnswer(answer);
//     setShowCorrectAnswer(true);
//     if (answerTimer) {
//       clearTimeout(answerTimer);
//       setAnswerTimer(null);
//     }
//   };

//   // Auto-reveal correct answer after delay based on speedMode
//   useEffect(() => {
//     const currentQuestionData = questions[currentQuestion];
//     if (!showCorrectAnswer && !selectedAnswer && currentQuestionData) {
//       const timer = setTimeout(() => {
//         setShowCorrectAnswer(true);
//       }, revealDelay);
//       setAnswerTimer(timer);
//       return () => clearTimeout(timer);
//     }
//     return () => {
//       if (answerTimer) clearTimeout(answerTimer);
//     };
//   }, [currentQuestion, showCorrectAnswer, selectedAnswer, questions, revealDelay]);

//   // Fetch translation from Supabase with cache
//   const fetchTranslation = useCallback(
//     async (questionId: string, language?: string) => {
//       if (!questionId) {
//         console.warn('fetchTranslation: questionId is missing');
//         return;
//       }

//       const lang = (language || selectedLanguage || "persisch").trim();
//       const cacheKey = `${questionId}:${lang}`;

//       if (translationsCache.current[cacheKey]) {
//         setTranslation(translationsCache.current[cacheKey]);
//         return;
//       }

//       setTranslationLoading(true);
//       try {
//         const { data, error } = await (supabase
//           .from('question_translations' as any)
//           .select('question_text, option_a, option_b, option_c, option_d')
//           .eq('question_id', questionId)
//           .eq('language', lang) as any);

//         if (error) throw error;

//         const row = Array.isArray(data) && data.length > 0 ? (data[0] as Translation) : null;

//         if (row) {
//           translationsCache.current[cacheKey] = row;
//           setTranslation(row);
//         } else {
//           setTranslation(null);
//         }
//       } catch (e: any) {
//         console.error('Error fetching translation:', {
//           message: e?.message,
//           details: e?.details,
//           hint: e?.hint,
//           code: e?.code,
//         });
//         toast({
//           title: 'خطا در بارگذاری ترجمه',
//           description: e?.message ?? 'ترجمه این سؤال قابل دریافت نیست.',
//           variant: 'destructive',
//         });
//         setTranslation(null);
//       } finally {
//         setTranslationLoading(false);
//       }
//     },
//     [selectedLanguage, toast]
//   );

//   // Load translation when toggled on / language changes / question changes
//   useEffect(() => {
//     const q = questions[currentQuestion];
//     if (showTranslation && q?.id) {
//       fetchTranslation(q.id, selectedLanguage || "persisch");
//     } else if (!showTranslation) {
//       setTranslation(null);
//     }
//   }, [showTranslation, selectedLanguage, currentQuestion, questions, fetchTranslation]);

//   const handleQuestionTypeChange = (checked: boolean) => {
//     setIsStateSpecific(checked);
//     setSelectedState("");
//     setCurrentQuestion(0);
//   };

//   const question = questions[currentQuestion];

//   // Normalize correct option once per question
//   const correctKey = useMemo(
//     () => normalizeCorrectOption(question?.correct_option, question),
//     [question]
//   );
  
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-hero relative flex items-center justify-center">
//         <Card className="card-3d p-8">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
//             <p className="text-foreground">Lade Fragen...</p>
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   if (questions.length === 0) {
//     return (
//       <div className="min-h-screen bg-gradient-hero relative flex items-center justify-center">
//         <Card className="card-3d p-8 text-center">
//           <p className="text-foreground mb-4">
//             {isStateSpecific && !selectedState 
//               ? "Bitte wählen Sie ein Bundesland aus." 
//               : "Keine Fragen verfügbar."}
//           </p>
//           <Button onClick={() => navigate('/')} variant="outline" className="glass">
//             <ArrowLeft className="mr-2 h-4 w-4" />
//             Zurück zur Startseite
//           </Button>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-hero relative">
//       <div className="container mx-auto px-4 py-8 relative">
//         {/* Header */}
//         <motion.div
//           className="flex items-center justify-between mb-8"
//           initial={{ opacity: 0, y: -30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//         >
//           <Button
//             onClick={() => navigate('/')}
//             variant="ghost"
//             size="lg"
//             className="glass text-foreground hover:bg-white/20"
//           >
//             <ArrowLeft className="mr-2 h-5 w-5" />
//             Zurück zur Startseite
//           </Button>

//           <div className="text-center">
//             <h1 className="text-3xl md:text-4xl font-bold text-gradient">
//               Training Modus
//             </h1>
//             <p className="text-muted-foreground">
//               Frage {currentQuestion + 1} von {questions.length}
//             </p>
//             <p className="text-xs text-muted-foreground">
//               {isStateSpecific ? `${states.find(s => s.id === selectedState)?.name || 'Bundesland'} Fragen` : 'Allgemeine Fragen'}
//             </p>
//           </div>

//           <div className="w-32"></div>
//         </motion.div>

//         {/* Question Type Selection + Speed Toggle */}
//         <motion.div
//           className="max-w-4xl mx-auto mb-8"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.2 }}
//         >
//           <Card className="card-3d p-6">
//             <div className="flex flex-col sm:flex-row gap-6 items-center justify-between w-full">
//               {/* Left: Allgemeine / Bundesland + State Select */}
//               <div className="flex items-center gap-4 flex-wrap">
//                 <div className="flex items-center gap-2">
//                   <BookOpen className="h-5 w-5 text-primary" />
//                   <span className="text-foreground">Allgemeine Fragen</span>
//                 </div>
//                 <Switch
//                   checked={isStateSpecific}
//                   onCheckedChange={handleQuestionTypeChange}
//                   className="data-[state=checked]:bg-gradient-primary"
//                 />
//                 <div className="flex items-center gap-2">
//                   <MapPin className="h-5 w-5 text-primary" />
//                   <span className="text-foreground">Bundesland Fragen</span>
//                 </div>

//                 {isStateSpecific && (
//                   <motion.div
//                     initial={{ opacity: 0, width: 0 }}
//                     animate={{ opacity: 1, width: "auto" }}
//                     exit={{ opacity: 0, width: 0 }}
//                     className="flex items-center gap-2"
//                   >
//                     <Select value={selectedState} onValueChange={setSelectedState}>
//                       <SelectTrigger className="w-64 glass border-white/20">
//                         <SelectValue placeholder="Bundesland auswählen" />
//                       </SelectTrigger>
//                       <SelectContent
//                         position="popper"
//                         side="bottom"
//                         align="start"
//                         sideOffset={8}
//                         className="z-[9999] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl border border-border"
//                       >
//                         {states.map((state) => (
//                           <SelectItem key={state.id} value={state.id}>
//                             {state.name}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </motion.div>
//                 )}
//               </div>

//               {/* Right: Speed Toggle */}
//               <div className="ml-auto">
//                 <SpeedToggle mode={speedMode} onToggle={setSpeedMode} />
//               </div>
//             </div>
//           </Card>
//         </motion.div>

//         {/* Language Selection */}
//         <motion.div
//           className="flex flex-col sm:flex-row gap-4 mb-8 justify-center items-center"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.3 }}
//         >
//           <div className="flex items-center gap-2">
//             <Languages className="h-5 w-5 text-primary" />
//             <span className="text-foreground">Übersetzung:</span>
//           </div>
//           <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
//             <SelectTrigger className="w-64 glass border-white/20">
//               <SelectValue placeholder="Sprache auswählen" />
//             </SelectTrigger>
//             <SelectContent
//               position="popper"
//               className="z-[9999] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl border border-border"
//             >
//               {languages.map((lang) => (
//                 <SelectItem key={lang.value} value={lang.value}>
//                   {lang.label}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </motion.div>

//         {/* Question Card */}
//         <div className="mb-24 relative">
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={currentQuestion}
//               className="w-full max-w-4xl mx-auto relative"
//               initial={{ x: 300, opacity: 0 }}
//               animate={{ x: 0, opacity: 1 }}
//               exit={{ x: -300, opacity: 0 }}
//               transition={{ duration: 0.5, ease: "easeInOut" }}
//             >
//               <Card className="card-3d p-8 space-y-6 relative z-[100] isolate overflow-visible">
//                 {question.has_image && question.image_path && (
//                   <div className="mb-6">
//                     <img
//                       src={
//                         question.image_path.startsWith("http")
//                         ? question.image_path
//                         : `https://tnnjkbipydrhccwxofzm.supabase.co/storage/v1/object/public/question-images/${question.image_path}`
//                       }
//                       alt="Frage Illustration"
//                       className="w-full max-w-md mx-auto rounded-lg shadow-lg"
//                     />
//                   </div>
//                 )}

//                 <div className="space-y-4">
//                   <h2 className="text-2xl font-semibold text-foreground">
//                     {question.question_text}
//                   </h2>

//                   {showTranslation && selectedLanguage && (
//                     <motion.div
//                       initial={{ opacity: 0, height: 0 }}
//                       animate={{ opacity: 1, height: "auto" }}
//                       exit={{ opacity: 0, height: 0 }}
//                       className="p-4 bg-primary/10 rounded-lg border border-primary/20 relative z-0 pointer-events-none"
//                       style={{ pointerEvents: 'none' }}
//                     >
//                       {translationLoading ? (
//                         <div className="animate-pulse text-muted-foreground">
//                           در حال بارگذاری ترجمه...
//                         </div>
//                       ) : translation ? (
//                         <div className="space-y-3">
//                           <h3 className="text-lg font-semibold text-primary">
//                             {translation.question_text}
//                           </h3>
//                           <div className="grid grid-cols-1 gap-2">
//                             <p className="text-primary/80"><strong>A:</strong> {translation.option_a ?? question.option_a}</p>
//                             <p className="text-primary/80"><strong>B:</strong> {translation.option_b ?? question.option_b}</p>
//                             <p className="text-primary/80"><strong>C:</strong> {translation.option_c ?? question.option_c}</p>
//                             <p className="text-primary/80"><strong>D:</strong> {translation.option_d ?? question.option_d}</p>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="text-sm text-muted-foreground">
//                           برای این سؤال ترجمه‌ای پیدا نشد.
//                         </div>
//                       )}
//                     </motion.div>
//                   )}

//                   <div className="grid grid-cols-1 gap-4 relative z-[200] pointer-events-auto">
//                     {[
//                       { key: "a", text: question.option_a },
//                       { key: "b", text: question.option_b },
//                       { key: "c", text: question.option_c },
//                       { key: "d", text: question.option_d }
//                     ].map((option) => {
//                       const isSelected = selectedAnswer === option.key;
//                       const isCorrect = correctKey ? option.key === correctKey : false;
//                       const isWrong = showCorrectAnswer && isSelected && !isCorrect;
                      
//                       let cardClass = "relative p-4 cursor-pointer transition-all duration-300 border-2 rounded-lg text-left w-full bg-background pointer-events-auto";
                      
//                       if (showCorrectAnswer) {
//                         if (isCorrect) {
//                           cardClass += " border-green-500 bg-green-50 text-green-800 shadow-green-200 shadow-lg";
//                         } else if (isWrong) {
//                           cardClass += " border-red-500 bg-red-50 text-red-800 shadow-red-200 shadow-lg";
//                         } else {
//                           cardClass += " border-gray-200 bg-gray-50 text-gray-600";
//                         }
//                       } else {
//                         if (isSelected) {
//                           cardClass += " border-primary bg-primary/10 text-primary shadow-lg transform scale-[1.02]";
//                         } else {
//                           cardClass += " border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-md hover:transform hover:scale-[1.01]";
//                         }
//                       }

//                       return (
//                         <motion.div
//                           key={option.key}
//                           className="w-full relative z-[200] pointer-events-auto"
//                           whileHover={!showCorrectAnswer ? { y: -2 } : {}}
//                           whileTap={!showCorrectAnswer ? { scale: 0.98 } : {}}
//                           transition={{ duration: 0.2 }}
//                         >
//                           <button
//                             type="button"
//                             className={cardClass}
//                             onClick={() => !showCorrectAnswer && handleAnswerSelect(option.key)}
//                             disabled={showCorrectAnswer}
//                             style={{ minHeight: '60px' }}
//                           >
//                             <div className="flex items-center space-x-4 w-full">
//                               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
//                                 showCorrectAnswer 
//                                   ? (isCorrect ? 'bg-green-500 text-white' : (isWrong ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-600'))
//                                   : (isSelected ? 'bg-primary text-white' : 'bg-primary/20 text-primary')
//                               }`}>
//                                 {option.key.toUpperCase()}
//                               </div>
//                               <p className="text-current flex-1 font-medium leading-relaxed">{option.text}</p>
//                               <div className="flex items-center">
//                                 {showCorrectAnswer && isCorrect && (
//                                   <motion.div
//                                     initial={{ scale: 0, rotate: 180 }}
//                                     animate={{ scale: 1, rotate: 0 }}
//                                     transition={{ duration: 0.3, delay: 0.1 }}
//                                   >
//                                     <CheckCircle className="h-6 w-6 text-green-600" />
//                                   </motion.div>
//                                 )}
//                                 {showCorrectAnswer && isWrong && (
//                                   <motion.div
//                                     initial={{ scale: 0, rotate: 180 }}
//                                     animate={{ scale: 1, rotate: 0 }}
//                                     transition={{ duration: 0.3, delay: 0.1 }}
//                                   >
//                                     <XCircle className="h-6 w-6 text-red-600" />
//                                   </motion.div>
//                                 )}
//                               </div>
//                             </div>
//                           </button>
//                         </motion.div>
//                       );
//                     })}
//                   </div>
//                 </div>

//                 <div className="flex flex-col sm:flex-row gap-4 justify-center">
//                   {selectedLanguage && (
//                     <Button
//                       onClick={() => setShowTranslation(!showTranslation)}
//                       variant="secondary"
//                       className="bg-gradient-secondary hover:bg-gradient-secondary"
//                     >
//                       <Languages className="mr-2 h-4 w-4" />
//                       {showTranslation ? "Übersetzung ausblenden" : "Übersetzung anzeigen"}
//                     </Button>
//                   )}
//                 </div>
//               </Card>
//             </motion.div>
//           </AnimatePresence>
//         </div>

//         {/* Navigation */}
//         <motion.div
//           className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-8 relative z-[10]"
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.6 }}
//         >
//           <div className="flex gap-4">
//             <Button
//               onClick={prevQuestion}
//               disabled={currentQuestion === 0}
//               variant="outline"
//               size="lg"
//               className="glass border-white/20"
//             >
//               <ChevronLeft className="mr-2 h-5 w-5" />
//               Vorherige
//             </Button>

//             <Button
//               onClick={nextQuestion}
//               disabled={currentQuestion === questions.length - 1}
//               variant="outline"
//               size="lg"
//               className="glass border-white/20"
//             >
//               Nächste
//               <ChevronRight className="ml-2 h-5 w-5" />
//             </Button>
//           </div>

//           <div className="flex items-center gap-2">
//             <Hash className="h-5 w-5 text-muted-foreground" />
//             <Input
//               placeholder="Frage Nr."
//               value={jumpToQuestion}
//               onChange={(e) => setJumpToQuestion(e.target.value)}
//               className="w-24 glass border-white/20"
//               type="number"
//               min={1}
//               max={questions.length}
//             />
//             <Button
//               onClick={handleJumpToQuestion}
//               variant="secondary"
//               size="sm"
//               disabled={!jumpToQuestion}
//               className="bg-gradient-primary hover:bg-gradient-primary px-6"
//             >
//               Springe
//             </Button>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default Training;


//************************************************************ */

// import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// import { motion, AnimatePresence } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import { Button } from "@/components/ui/button";
// import { Card } from "@/components/ui/card";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";
// import { Switch } from "@/components/ui/switch";
// import { ArrowLeft, ChevronLeft, ChevronRight, Languages, Hash, BookOpen, MapPin, CheckCircle, XCircle } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";
// import { supabase } from "@/integrations/supabase/client";

// // Types
// type Question = {
//   id: string;
//   question_text: string;
//   option_a: string;
//   option_b: string;
//   option_c: string;
//   option_d: string;
//   correct_option: string;
//   category: string;
//   has_image: boolean;
//   image_path: string | null;
//   state_id?: string | null;
// };

// type State = {
//   id: string;
//   name: string;
// };

// type Translation = {
//   question_text: string;
//   option_a?: string | null;
//   option_b?: string | null;
//   option_c?: string | null;
//   option_d?: string | null;
// };

// const languages = [
//   { value: "persisch", label: "Persisch (فارسی)" },
//   { value: "englisch", label: "English" },
//   { value: "russisch", label: "Русский" },
//   { value: "ukrainisch", label: "Українська" },
//   { value: "arabisch", label: "العربية" },
//   { value: "türkisch", label: "Türkçe" }
// ];

// // Normalize various forms of correct_option to 'a' | 'b' | 'c' | 'd'
// function normalizeCorrectOption(
//   value: any,
//   q?: { option_a: string; option_b: string; option_c: string; option_d: string }
// ): 'a' | 'b' | 'c' | 'd' | null {
//   if (value === undefined || value === null) return null;
//   let raw = String(value).trim().toLowerCase();
//   if (!raw) return null;

//   if (['a', 'b', 'c', 'd'].includes(raw)) return raw as any;

//   if (['1', '2', '3', '4'].includes(raw)) {
//     return (['a', 'b', 'c', 'd'][parseInt(raw, 10) - 1]) as any;
//   }

//   if (raw.startsWith('option_')) {
//     const last = raw.slice(-1);
//     if (['a', 'b', 'c', 'd'].includes(last)) return last as any;
//   }

//   const first = raw[0];
//   if (['a', 'b', 'c', 'd'].includes(first)) return first as any;

//   if (q) {
//     const mapText: Record<string, 'a' | 'b' | 'c' | 'd'> = {};
//     if (q.option_a) mapText[q.option_a.trim().toLowerCase()] = 'a';
//     if (q.option_b) mapText[q.option_b.trim().toLowerCase()] = 'b';
//     if (q.option_c) mapText[q.option_c.trim().toLowerCase()] = 'c';
//     if (q.option_d) mapText[q.option_d.trim().toLowerCase()] = 'd';
//     const byText = mapText[raw];
//     if (byText) return byText;
//   }

//   return null;
// }

// const Training = () => {
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const [currentQuestion, setCurrentQuestion] = useState(0);

//   // Default language: persisch
//   const [selectedLanguage, setSelectedLanguage] = useState<string>("persisch");
//   const [showTranslation, setShowTranslation] = useState(false);
//   const [jumpToQuestion, setJumpToQuestion] = useState("");
  
//   // New state for question filtering
//   const [isStateSpecific, setIsStateSpecific] = useState(false);
//   const [selectedState, setSelectedState] = useState<string>("");
//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [states, setStates] = useState<State[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedAnswer, setSelectedAnswer] = useState<string>("");
//   const [showCorrectAnswer, setShowCorrectAnswer] = useState(false);
//   const [answerTimer, setAnswerTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

//   // Translation state and cache
//   const [translation, setTranslation] = useState<Translation | null>(null);
//   const [translationLoading, setTranslationLoading] = useState(false);
//   const translationsCache = useRef<Record<string, Translation>>({});

//   // Fetch states on component mount
//   useEffect(() => {
//     const fetchStates = async () => {
//       try {
//         const { data, error } = await supabase
//           .from('states')
//           .select('*')
//           .order('name');
        
//         if (error) throw error;
//         setStates(data || []);
//       } catch (error) {
//         console.error('Error fetching states:', error);
//         toast({
//           title: "Fehler beim Laden der Bundesländer",
//           description: "Die Bundesländer konnten nicht geladen werden.",
//           variant: "destructive",
//         });
//       }
//     };
    
//     fetchStates();
//   }, [toast]);

//   // Fetch questions based on selection
//   useEffect(() => {
//     const fetchQuestions = async () => {
//       setLoading(true);
//       try {
//         let query = supabase.from('questions').select('*');
        
//         if (isStateSpecific && selectedState) {
//           query = query.eq('state_id', selectedState);
//         } else if (!isStateSpecific) {
//           query = query.eq('category', 'general');
//         }
        
//         const { data, error } = await query;
        
//         if (error) throw error;
//         setQuestions(data || []);
//         setCurrentQuestion(0);
//         setShowTranslation(false);
//         setTranslation(null);
//         setSelectedAnswer("");
//         setShowCorrectAnswer(false);
//         if (answerTimer) {
//           clearTimeout(answerTimer);
//           setAnswerTimer(null);
//         }
//       } catch (error) {
//         console.error('Error fetching questions:', error);
//         toast({
//           title: "Fehler beim Laden der Fragen",
//           description: "Die Fragen konnten nicht geladen werden.",
//           variant: "destructive",
//         });
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (!isStateSpecific || (isStateSpecific && selectedState)) {
//       fetchQuestions();
//     }
//   }, [isStateSpecific, selectedState, toast]);

//   const nextQuestion = () => {
//     if (currentQuestion < questions.length - 1) {
//       setCurrentQuestion(currentQuestion + 1);
//       setShowTranslation(false);
//       setTranslation(null);
//       resetAnswerState();
//     }
//   };

//   const resetAnswerState = () => {
//     setSelectedAnswer("");
//     setShowCorrectAnswer(false);
//     if (answerTimer) {
//       clearTimeout(answerTimer);
//       setAnswerTimer(null);
//     }
//   };

//   const prevQuestion = () => {
//     if (currentQuestion > 0) {
//       setCurrentQuestion(currentQuestion - 1);
//       setShowTranslation(false);
//       setTranslation(null);
//       resetAnswerState();
//     }
//   };

//   const handleJumpToQuestion = () => {
//     const questionNum = parseInt(jumpToQuestion);
//     if (questionNum >= 1 && questionNum <= questions.length) {
//       setCurrentQuestion(questionNum - 1);
//       setShowTranslation(false);
//       setTranslation(null);
//       resetAnswerState();
//       setJumpToQuestion("");
//     }
//   };

//   const handleAnswerSelect = (answer: string) => {
//     if (selectedAnswer || showCorrectAnswer) return; // avoid multiple
//     setSelectedAnswer(answer);
//     setShowCorrectAnswer(true);
//     if (answerTimer) {
//       clearTimeout(answerTimer);
//       setAnswerTimer(null);
//     }
//   };

//   // Auto-reveal correct answer after 10 seconds
//   useEffect(() => {
//     const currentQuestionData = questions[currentQuestion];
//     if (!showCorrectAnswer && !selectedAnswer && currentQuestionData) {
//       const timer = setTimeout(() => {
//         setShowCorrectAnswer(true);
//       }, 10000);
//       setAnswerTimer(timer);
//       return () => clearTimeout(timer);
//     }
//     return () => {
//       if (answerTimer) clearTimeout(answerTimer);
//     };
//   }, [currentQuestion, showCorrectAnswer, selectedAnswer, questions]);

//   // Fetch translation from Supabase with cache (array-style, like questions)
//   const fetchTranslation = useCallback(
//     async (questionId: string, language?: string) => {
//       if (!questionId) {
//         console.warn('fetchTranslation: questionId is missing');
//         return;
//       }

//       const lang = (language || selectedLanguage || "persisch").trim();
//       const cacheKey = `${questionId}:${lang}`;

//       if (translationsCache.current[cacheKey]) {
//         setTranslation(translationsCache.current[cacheKey]);
//         return;
//       }

//       setTranslationLoading(true);
//       try {
//         const { data, error } = await (supabase
//           .from('question_translations' as any)
//           .select('question_text, option_a, option_b, option_c, option_d')
//           .eq('question_id', questionId)
//           .eq('language', lang) as any);

//         if (error) throw error;

//         const row = Array.isArray(data) && data.length > 0 ? (data[0] as Translation) : null;

//         if (row) {
//           translationsCache.current[cacheKey] = row;
//           setTranslation(row);
//         } else {
//           setTranslation(null);
//         }
//       } catch (e: any) {
//         console.error('Error fetching translation:', {
//           message: e?.message,
//           details: e?.details,
//           hint: e?.hint,
//           code: e?.code,
//         });
//         toast({
//           title: 'خطا در بارگذاری ترجمه',
//           description: e?.message ?? 'ترجمه این سؤال قابل دریافت نیست.',
//           variant: 'destructive',
//         });
//         setTranslation(null);
//       } finally {
//         setTranslationLoading(false);
//       }
//     },
//     [selectedLanguage, toast]
//   );

//   // Load translation when toggled on / language changes / question changes
//   useEffect(() => {
//     const q = questions[currentQuestion];
//     if (showTranslation && q?.id) {
//       fetchTranslation(q.id, selectedLanguage || "persisch");
//     } else if (!showTranslation) {
//       setTranslation(null);
//     }
//   }, [showTranslation, selectedLanguage, currentQuestion, questions, fetchTranslation]);

//   const handleQuestionTypeChange = (checked: boolean) => {
//     setIsStateSpecific(checked);
//     setSelectedState("");
//     setCurrentQuestion(0);
//   };

//   const question = questions[currentQuestion];

//   // Normalize correct option once per question
//   const correctKey = useMemo(
//     () => normalizeCorrectOption(question?.correct_option, question),
//     [question]
//   );
  
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-hero relative flex items-center justify-center">
//         <Card className="card-3d p-8">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
//             <p className="text-foreground">Lade Fragen...</p>
//           </div>
//         </Card>
//       </div>
//     );
//   }

//   if (questions.length === 0) {
//     return (
//       <div className="min-h-screen bg-gradient-hero relative flex items-center justify-center">
//         <Card className="card-3d p-8 text-center">
//           <p className="text-foreground mb-4">
//             {isStateSpecific && !selectedState 
//               ? "Bitte wählen Sie ein Bundesland aus." 
//               : "Keine Fragen verfügbar."}
//           </p>
//           <Button onClick={() => navigate('/')} variant="outline" className="glass">
//             <ArrowLeft className="mr-2 h-4 w-4" />
//             Zurück zur Startseite
//           </Button>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gradient-hero relative">
//       <div className="container mx-auto px-4 py-8 relative">
//         {/* Header */}
//         <motion.div
//           className="flex items-center justify-between mb-8"
//           initial={{ opacity: 0, y: -30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6 }}
//         >
//           <Button
//             onClick={() => navigate('/')}
//             variant="ghost"
//             size="lg"
//             className="glass text-foreground hover:bg-white/20"
//           >
//             <ArrowLeft className="mr-2 h-5 w-5" />
//             Zurück zur Startseite
//           </Button>

//           <div className="text-center">
//             <h1 className="text-3xl md:text-4xl font-bold text-gradient">
//               Training Modus
//             </h1>
//             <p className="text-muted-foreground">
//               Frage {currentQuestion + 1} von {questions.length}
//             </p>
//             <p className="text-xs text-muted-foreground">
//               {isStateSpecific ? `${states.find(s => s.id === selectedState)?.name || 'Bundesland'} Fragen` : 'Allgemeine Fragen'}
//             </p>
//           </div>

//           <div className="w-32"></div>
//         </motion.div>

//         {/* Question Type Selection (State Select uses Portal to avoid z-index issues) */}
//         <motion.div
//           className="max-w-4xl mx-auto mb-8"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.2 }}
//         >
//           <Card className="card-3d p-6">
//             <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
//               <div className="flex items-center space-x-4">
//                 <div className="flex items-center gap-2">
//                   <BookOpen className="h-5 w-5 text-primary" />
//                   <span className="text-foreground">Allgemeine Fragen</span>
//                 </div>
//                 <Switch
//                   checked={isStateSpecific}
//                   onCheckedChange={handleQuestionTypeChange}
//                   className="data-[state=checked]:bg-gradient-primary"
//                 />
//                 <div className="flex items-center gap-2">
//                   <MapPin className="h-5 w-5 text-primary" />
//                   <span className="text-foreground">Bundesland Fragen</span>
//                 </div>
//               </div>

//               {isStateSpecific && (
//                 <motion.div
//                   initial={{ opacity: 0, width: 0 }}
//                   animate={{ opacity: 1, width: "auto" }}
//                   exit={{ opacity: 0, width: 0 }}
//                   className="flex items-center gap-2"
//                 >
//                   <Select value={selectedState} onValueChange={setSelectedState}>
//                     <SelectTrigger className="w-64 glass border-white/20">
//                       <SelectValue placeholder="Bundesland auswählen" />
//                     </SelectTrigger>
//                     {/* Use Portal/popover rendering to escape stacking context of the card */}
//                     <SelectContent
//                       position="popper"
//                       side="bottom"
//                       align="start"
//                       sideOffset={8}
//                       className="z-[9999] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl border border-border"
//                     >
//                       {states.map((state) => (
//                         <SelectItem key={state.id} value={state.id}>
//                           {state.name}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </motion.div>
//               )}
//             </div>
//           </Card>
//         </motion.div>

//         {/* Language Selection (Dropdown rendered in Portal to avoid stacking issues) */}
//         <motion.div
//           className="flex flex-col sm:flex-row gap-4 mb-8 justify-center items-center"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.3 }}
//         >
//           <div className="flex items-center gap-2">
//             <Languages className="h-5 w-5 text-primary" />
//             <span className="text-foreground">Übersetzung:</span>
//           </div>
//           <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
//             <SelectTrigger className="w-64 glass border-white/20">
//               <SelectValue placeholder="Sprache auswählen" />
//             </SelectTrigger>
//             {/* key fix: use Radix Portal via position="popper" so dropdown is outside card's stacking context */}
//             <SelectContent
//               position="popper"
//               className="z-[9999] bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-xl border border-border"
//             >
//               {languages.map((lang) => (
//                 <SelectItem key={lang.value} value={lang.value}>
//                   {lang.label}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//         </motion.div>

//         {/* Question Card */}
//         <div className="mb-24 relative">
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={currentQuestion}
//               className="w-full max-w-4xl mx-auto relative"
//               initial={{ x: 300, opacity: 0 }}
//               animate={{ x: 0, opacity: 1 }}
//               exit={{ x: -300, opacity: 0 }}
//               transition={{ duration: 0.5, ease: "easeInOut" }}
//             >
//               {/* isolate + high z-index to ensure card's children can stack above others */}
//               <Card className="card-3d p-8 space-y-6 relative z-[100] isolate overflow-visible">
//                 {question.has_image && question.image_path && (
//                   <div className="mb-6">
//                     <img
//                       // src={`https://tnnjkbipydrhccwxofzm.supabase.co/storage/v1/object/public/question-images/${question.image_path}`}
//                       src={
//                         question.image_path.startsWith("http")
//                         ? question.image_path
//                         : `https://tnnjkbipydrhccwxofzm.supabase.co/storage/v1/object/public/question-images/${question.image_path}`
//                       }
//                       alt="Frage Illustration"
//                       className="w-full max-w-md mx-auto rounded-lg shadow-lg"
//                     />
//                   </div>
//                 )}

//                 <div className="space-y-4">
//                   <h2 className="text-2xl font-semibold text-foreground">
//                     {question.question_text}
//                   </h2>

//                   {/* Translation block: do NOT intercept clicks; also lower z-index */}
//                   {showTranslation && selectedLanguage && (
//                     <motion.div
//                       initial={{ opacity: 0, height: 0 }}
//                       animate={{ opacity: 1, height: "auto" }}
//                       exit={{ opacity: 0, height: 0 }}
//                       className="p-4 bg-primary/10 rounded-lg border border-primary/20 relative z-0 pointer-events-none"
//                       style={{ pointerEvents: 'none' }}
//                     >
//                       {translationLoading ? (
//                         <div className="animate-pulse text-muted-foreground">
//                           در حال بارگذاری ترجمه...
//                         </div>
//                       ) : translation ? (
//                         <div className="space-y-3">
//                           <h3 className="text-lg font-semibold text-primary">
//                             {translation.question_text}
//                           </h3>
//                           <div className="grid grid-cols-1 gap-2">
//                             <p className="text-primary/80"><strong>A:</strong> {translation.option_a ?? question.option_a}</p>
//                             <p className="text-primary/80"><strong>B:</strong> {translation.option_b ?? question.option_b}</p>
//                             <p className="text-primary/80"><strong>C:</strong> {translation.option_c ?? question.option_c}</p>
//                             <p className="text-primary/80"><strong>D:</strong> {translation.option_d ?? question.option_d}</p>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="text-sm text-muted-foreground">
//                           برای این سؤال ترجمه‌ای پیدا نشد.
//                         </div>
//                       )}
//                     </motion.div>
//                   )}

//                   {/* Options: force highest priority in stacking and clicks */}
//                   <div className="grid grid-cols-1 gap-4 relative z-[200] pointer-events-auto">
//                     {[
//                       { key: "a", text: question.option_a },
//                       { key: "b", text: question.option_b },
//                       { key: "c", text: question.option_c },
//                       { key: "d", text: question.option_d }
//                     ].map((option) => {
//                       const isSelected = selectedAnswer === option.key;
//                       const isCorrect = correctKey ? option.key === correctKey : false;
//                       const isWrong = showCorrectAnswer && isSelected && !isCorrect;
                      
//                       let cardClass = "relative p-4 cursor-pointer transition-all duration-300 border-2 rounded-lg text-left w-full bg-background pointer-events-auto";
                      
//                       if (showCorrectAnswer) {
//                         if (isCorrect) {
//                           cardClass += " border-green-500 bg-green-50 text-green-800 shadow-green-200 shadow-lg";
//                         } else if (isWrong) {
//                           cardClass += " border-red-500 bg-red-50 text-red-800 shadow-red-200 shadow-lg";
//                         } else {
//                           cardClass += " border-gray-200 bg-gray-50 text-gray-600";
//                         }
//                       } else {
//                         if (isSelected) {
//                           cardClass += " border-primary bg-primary/10 text-primary shadow-lg transform scale-[1.02]";
//                         } else {
//                           cardClass += " border-border hover:border-primary/50 hover:bg-primary/5 hover:shadow-md hover:transform hover:scale-[1.01]";
//                         }
//                       }

//                       return (
//                         <motion.div
//                           key={option.key}
//                           className="w-full relative z-[200] pointer-events-auto"
//                           whileHover={!showCorrectAnswer ? { y: -2 } : {}}
//                           whileTap={!showCorrectAnswer ? { scale: 0.98 } : {}}
//                           transition={{ duration: 0.2 }}
//                         >
//                           <button
//                             type="button"
//                             className={cardClass}
//                             onClick={() => !showCorrectAnswer && handleAnswerSelect(option.key)}
//                             disabled={showCorrectAnswer}
//                             style={{ minHeight: '60px' }}
//                           >
//                             <div className="flex items-center space-x-4 w-full">
//                               <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
//                                 showCorrectAnswer 
//                                   ? (isCorrect ? 'bg-green-500 text-white' : (isWrong ? 'bg-red-500 text-white' : 'bg-gray-300 text-gray-600'))
//                                   : (isSelected ? 'bg-primary text-white' : 'bg-primary/20 text-primary')
//                               }`}>
//                                 {option.key.toUpperCase()}
//                               </div>
//                               <p className="text-current flex-1 font-medium leading-relaxed">{option.text}</p>
//                               <div className="flex items-center">
//                                 {showCorrectAnswer && isCorrect && (
//                                   <motion.div
//                                     initial={{ scale: 0, rotate: 180 }}
//                                     animate={{ scale: 1, rotate: 0 }}
//                                     transition={{ duration: 0.3, delay: 0.1 }}
//                                   >
//                                     <CheckCircle className="h-6 w-6 text-green-600" />
//                                   </motion.div>
//                                 )}
//                                 {showCorrectAnswer && isWrong && (
//                                   <motion.div
//                                     initial={{ scale: 0, rotate: 180 }}
//                                     animate={{ scale: 1, rotate: 0 }}
//                                     transition={{ duration: 0.3, delay: 0.1 }}
//                                   >
//                                     <XCircle className="h-6 w-6 text-red-600" />
//                                   </motion.div>
//                                 )}
//                               </div>
//                             </div>
//                           </button>
//                         </motion.div>
//                       );
//                     })}
//                   </div>
//                 </div>

//                 <div className="flex flex-col sm:flex-row gap-4 justify-center">
//                   {selectedLanguage && (
//                     <Button
//                       onClick={() => setShowTranslation(!showTranslation)}
//                       variant="secondary"
//                       className="bg-gradient-secondary hover:bg-gradient-secondary"
//                     >
//                       <Languages className="mr-2 h-4 w-4" />
//                       {showTranslation ? "Übersetzung ausblenden" : "Übersetzung anzeigen"}
//                     </Button>
//                   )}
//                 </div>
//               </Card>
//             </motion.div>
//           </AnimatePresence>
//         </div>

//         {/* Navigation - keep it below card in stacking */}
//         <motion.div
//           className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-8 relative z-[10]"
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.6, delay: 0.6 }}
//         >
//           <div className="flex gap-4">
//             <Button
//               onClick={prevQuestion}
//               disabled={currentQuestion === 0}
//               variant="outline"
//               size="lg"
//               className="glass border-white/20"
//             >
//               <ChevronLeft className="mr-2 h-5 w-5" />
//               Vorherige
//             </Button>

//             <Button
//               onClick={nextQuestion}
//               disabled={currentQuestion === questions.length - 1}
//               variant="outline"
//               size="lg"
//               className="glass border-white/20"
//             >
//               Nächste
//               <ChevronRight className="ml-2 h-5 w-5" />
//             </Button>
//           </div>

//           <div className="flex items-center gap-2">
//             <Hash className="h-5 w-5 text-muted-foreground" />
//             <Input
//               placeholder="Frage Nr."
//               value={jumpToQuestion}
//               onChange={(e) => setJumpToQuestion(e.target.value)}
//               className="w-24 glass border-white/20"
//               type="number"
//               min={1}
//               max={questions.length}
//             />
//             <Button
//               onClick={handleJumpToQuestion}
//               variant="secondary"
//               size="sm"
//               disabled={!jumpToQuestion}
//               className="bg-gradient-primary hover:bg-gradient-primary px-6"
//             >
//               Springe
//             </Button>
//           </div>
//         </motion.div>
//       </div>
//     </div>
//   );
// };

// export default Training;