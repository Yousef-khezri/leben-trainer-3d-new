import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, XCircle, Award, RefreshCw, Languages } from "lucide-react";
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

type ExamState = "setup" | "running" | "finished";

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
  const raw = String(value).trim().toLowerCase();
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

const Exam = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [examState, setExamState] = useState<ExamState>("setup");
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch states on component mount
  useEffect(() => {
    const fetchStates = async () => {
      setLoading(true);
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
      } finally {
        setLoading(false);
      }
    };
    
    fetchStates();
  }, [toast]);

  // Helper function to shuffle array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const generateExamQuestions = async (stateId: string): Promise<Question[]> => {
    try {
      // Fetch general questions (30 random) - assumes DB categories are clean; otherwise use .is('state_id', null)
      const { data: generalQuestions, error: generalError } = await supabase
        .from('questions')
        .select('*')
        .eq('category', 'general');
      
      if (generalError) throw generalError;

      // Fetch state-specific questions (3 random)
      const { data: stateQuestions, error: stateError } = await supabase
        .from('questions')
        .select('*')
        .eq('state_id', stateId);
      
      if (stateError) throw stateError;

      if (!generalQuestions || generalQuestions.length < 30) {
        throw new Error('Nicht genügend allgemeine Fragen verfügbar');
      }

      if (!stateQuestions || stateQuestions.length < 3) {
        throw new Error('Nicht genügend bundeslandspezifische Fragen verfügbar');
      }

      // Randomly select questions
      const selectedGeneral = shuffleArray(generalQuestions).slice(0, 30);
      const selectedState = shuffleArray(stateQuestions).slice(0, 3);

      // Combine and shuffle final exam questions
      return shuffleArray([...selectedGeneral, ...selectedState]);
    } catch (error) {
      console.error('Error generating exam questions:', error);
      throw error;
    }
  };

  const getTranslatedText = (originalText: string, language: string): string => {
    // Simplified translation mapping - in a real app, this would use a translation API
    const translations: Record<string, Record<string, string>> = {
      persisch: {
        "Wann ist die Bundesrepublik Deutschland entstanden?": "جمهوری فدرال آلمان چه زمانی تأسیس شد؟",
        "Welche Farben hat die deutsche Flagge?": "پرچم آلمان چه رنگ‌هایی دارد؟",
        "Was ist die Hauptstadt von Deutschland?": "پایتخت آلمان کجاست؟"
      },
      englisch: {
        "Wann ist die Bundesrepublik Deutschland entstanden?": "When was the Federal Republic of Germany established?",
        "Welche Farben hat die deutsche Flagge?": "What colors does the German flag have?",
        "Was ist die Hauptstadt von Deutschland?": "What is the capital of Germany?"
      },
      russisch: {
        "Wann ist die Bundesrepublik Deutschland entstanden?": "Когда была создана Федеративная Республика Германия?",
        "Welche Farben hat die deutsche Flagge?": "Какие цвета у немецкого флага?",
        "Was ist die Hauptstadt von Deutschland?": "Какая столица Германии?"
      },
      ukrainisch: {
        "Wann ist die Bundesrepublik Deutschland entstanden?": "Коли була створена Федеративна Республіка Німеччина?",
        "Welche Farben hat die deutsche Flagge?": "Які кольори має німецький прапор?",
        "Was ist die Hauptstadt von Deutschland?": "Яка столиця Німеччини?"
      },
      arabisch: {
        "Wann ist die Bundesrepublik Deutschland entstanden?": "متى تأسست جمهورية ألمانيا الاتحادية؟",
        "Welche Farben hat die deutsche Flagge؟": "ما هي ألوان العلم الألماني؟",
        "Was ist die Hauptstadt von Deutschland?": "ما هي عاصمة ألمانيا؟"
      },
      türkisch: {
        "Wann ist die Bundesrepublik Deutschland entstanden?": "Almanya Federal Cumhuriyeti ne zaman kuruldu?",
        "Welche Farben hat die deutsche Flagge?": "Alman bayrağının renkleri nelerdir?",
        "Was ist die Hauptstadt von Deutschland?": "Almanya'nın başkenti nedir?"
      }
    };
    
    return translations[language]?.[originalText] || `[${language} translation for: ${originalText}]`;
  };

  const startExam = async () => {
    if (!selectedState) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie ein Bundesland aus.",
        variant: "destructive",
      });
      return;
    }

    try {
      const questions = await generateExamQuestions(selectedState);
      setExamQuestions(questions);
      setExamState("running");
      setCurrentQuestionIndex(0);
      setSelectedAnswer("");
      setShowResult(false);
      setCorrectAnswers(0);
      setUserAnswers([]);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Prüfungsfragen konnten nicht geladen werden.",
        variant: "destructive",
      });
    }
  };

  // helper to compare answers robustly
  const isAnswerCorrect = (answer: string, q: Question | undefined) => {
    if (!q) return false;
    const normalized = normalizeCorrectOption(q.correct_option, q);
    if (!normalized) return false;
    return answer === normalized;
  };

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer || showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);

    const q = examQuestions[currentQuestionIndex];
    const correct = isAnswerCorrect(answer, q);
    if (correct) {
      setCorrectAnswers(prev => prev + 1);
    }

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setUserAnswers(newAnswers);

    // Auto-advance after showing result
    setTimeout(() => {
      if (currentQuestionIndex < examQuestions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer("");
        setShowResult(false);
        setShowTranslation(false);
      } else {
        setExamState("finished");
      }
    }, 2000);
  };

  const resetExam = () => {
    setExamState("setup");
    setSelectedState("");
    setSelectedLanguage("");
    setShowTranslation(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer("");
    setShowResult(false);
    setCorrectAnswers(0);
    setUserAnswers([]);
    setExamQuestions([]);
  };

  const progress = examState === "running" && examQuestions.length > 0 ? ((currentQuestionIndex + 1) / examQuestions.length) * 100 : 0;
  const passed = correctAnswers >= 17; // Need 17+ correct answers to pass
  const currentQuestion = examQuestions[currentQuestionIndex];

  // normalized correct key for UI highlighting
  const normalizedCorrectKey = useMemo(
    () => normalizeCorrectOption(currentQuestion?.correct_option, currentQuestion),
    [currentQuestion]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="card-3d p-8 space-y-6" style={{ pointerEvents: 'none' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-foreground">Lade Prüfungsdaten...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (examState === "setup") {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="lg"
              className="glass text-foreground hover:bg-white/20 mb-8"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Zurück zur Startseite
            </Button>

            <Card className="card-3d p-8 text-center space-y-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Award className="h-16 w-16 text-primary mx-auto mb-4 animate-pulse-glow" />
                <h1 className="text-4xl font-bold text-gradient mb-4">
                  Prüfungsmodus
                </h1>
                <p className="text-lg text-muted-foreground mb-8">
                  Simulieren Sie den echten Einbürgerungstest mit 33 Fragen
                </p>
              </motion.div>

              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Wählen Sie Ihr Bundesland:
                  </label>
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="glass border-white/20">
                      <SelectValue placeholder="Bundesland auswählen" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                      {states.map((state) => (
                        <SelectItem key={state.id} value={state.id}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Übersetzungssprache (optional):
                  </label>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="glass border-white/20">
                      <SelectValue placeholder="Sprache auswählen (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}

                <div className="bg-muted/20 p-4 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Prüfungsablauf:</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• 30 Fragen aus dem allgemeinen Teil</li>
                    <li>• 3 Fragen zu Ihrem Bundesland</li>
                    <li>• Mindestens 17 richtige Antworten zum Bestehen</li>
                    <li>• Eine Frage nach der anderen</li>
                  </ul>
                </div>

                <Button
                  onClick={startExam}
                  size="lg"
                  className="bg-gradient-primary hover:bg-gradient-primary w-full py-6 text-xl cursor-pointer"
                >
                  <Award className="mr-3 h-6 w-6" />
                  Prüfung starten
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (examState === "finished") {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="card-3d p-8 text-center space-y-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.5 }}
              >
                {passed ? (
                  <CheckCircle className="h-24 w-24 text-success mx-auto animate-bounce-in" />
                ) : (
                  <XCircle className="h-24 w-24 text-destructive mx-auto animate-bounce-in" />
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <h1 className={`text-4xl font-bold mb-4 ${passed ? 'text-success' : 'text-destructive'}`}>
                  {passed ? "Bestanden!" : "Nicht bestanden"}
                </h1>
                <p className="text-2xl text-foreground mb-2">
                  {correctAnswers} von {examQuestions.length} Fragen richtig
                </p>
                <p className="text-muted-foreground mb-8">
                  {passed 
                    ? "Herzlichen Glückwunsch! Sie haben die Prüfung bestanden."
                    : "Leider haben Sie die Prüfung nicht bestanden. Sie benötigen mindestens 17 richtige Antworten."
                  }
                </p>
              </motion.div>

              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <Button
                  onClick={resetExam}
                  size="lg"
                  //className="bg-gradient-primary hover:bg-gradient-primary glow-hover"
                  className="bg-gradient-primary hover:bg-gradient-primary"
                >
                  <RefreshCw className="mr-2 h-5 w-5" />
                  Erneut versuchen
                </Button>
                <Button
                  onClick={() => navigate('/training')}
                  size="lg"
                  variant="secondary"
                  className="bg-gradient-secondary hover:bg-gradient-secondary"
                >
                  Training fortsetzen
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  size="lg"
                  variant="outline"
                  className="glass border-white/20"
                >
                  Zur Startseite
                </Button>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Button
            onClick={() => setExamState("setup")}
            variant="ghost"
            size="lg"
            className="glass text-foreground hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Zurück
          </Button>

          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gradient">
              Prüfung
            </h1>
            <p className="text-muted-foreground">
              Frage {currentQuestionIndex + 1} von {examQuestions.length}
            </p>
          </div>

          <div className="w-32"></div>
        </motion.div>

        {/* Progress */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Progress value={progress} className="h-3 bg-muted/20" />
        </motion.div>

        {/* Question */}
        <motion.div
          className="max-w-4xl mx-auto relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              className="w-full max-w-4xl mx-auto relative"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              {/* Isolated stacking context to avoid invisible overlays; ensure clicks on options */}
              <Card className="card-3d p-8 space-y-6 relative z-[100] isolate overflow-visible">
                {currentQuestion?.has_image && currentQuestion?.image_path && (
                  <div className="mb-6">
                    <img
                      src={
                        currentQuestion.image_path.startsWith("http")
                          ? currentQuestion.image_path
                          : `https://tnnjkbipydrhccwxofzm.supabase.co/storage/v1/object/public/question-images/${currentQuestion.image_path}`
                      }
                      alt="Frage Illustration"
                      className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                      loading="lazy"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground mb-6">
                    {currentQuestion?.question_text}
                  </h2>

                  {/* Options: ensure they are above any overlays and clickable */}
                  <div className="grid grid-cols-1 gap-4 relative z-[200] pointer-events-auto">
                    {currentQuestion && [
                      { key: "a", text: currentQuestion.option_a },
                      { key: "b", text: currentQuestion.option_b },
                      { key: "c", text: currentQuestion.option_c },
                      { key: "d", text: currentQuestion.option_d }
                    ].map((option) => {
                      const isSelected = selectedAnswer === option.key;
                      const isCorrect = normalizedCorrectKey ? option.key === normalizedCorrectKey : false;
                      const isWrong = showResult && isSelected && !isCorrect;
                      
                      let cardClass =
                        "relative p-4 w-full text-left cursor-pointer transition-all duration-300 border-2 rounded-lg bg-background";

                      if (showResult) {
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
                          className="w-full relative z-[200] pointer-events-auto"
                          whileHover={!showResult ? { y: -2 } : {}}
                          whileTap={!showResult ? { scale: 0.98 } : {}}
                          transition={{ duration: 0.2 }}
                        >
                          <button
                            type="button"
                            className={cardClass}
                            onClick={() => !showResult && handleAnswerSelect(option.key)}
                            disabled={showResult}
                            style={{ minHeight: '60px' }}
                          >
                            <div className="flex items-center space-x-4 w-full">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                                  showResult
                                    ? isCorrect
                                      ? "bg-green-500 text-white"
                                      : isWrong
                                      ? "bg-red-500 text-white"
                                      : "bg-gray-300 text-gray-600"
                                    : isSelected
                                    ? "bg-primary text-white"
                                    : "bg-primary/20 text-primary"
                                }`}
                              >
                                {option.key.toUpperCase()}
                              </div>
                              <p className="text-current flex-1 font-medium leading-relaxed">
                                {option.text}
                              </p>
                              <div className="flex items-center">
                                {showResult && isCorrect && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: 180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                  >
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                  </motion.div>
                                )}
                                {showResult && isWrong && (
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

                {/* Translation toggle kept commented to avoid overlay issues:
                {selectedLanguage && (
                  <div className="flex justify-center">
                    <Button
                      onClick={() => setShowTranslation(!showTranslation)}
                      variant="secondary"
                      size="sm"
                      className="bg-gradient-secondary hover:bg-gradient-secondary"
                    >
                      <Languages className="mr-2 h-4 w-4" />
                      {showTranslation ? "Übersetzung ausblenden" : "Übersetzung anzeigen"}
                    </Button>
                  </div>
                )} */}
              </Card>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Exam;