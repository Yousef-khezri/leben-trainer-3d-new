import { useState, useEffect } from "react";
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
      // Fetch general questions (30 random)
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
        "Welche Farben hat die deutsche Flagge?": "ما هي ألوان العلم الألماني؟",
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

  const handleAnswerSelect = (answer: string) => {
    if (selectedAnswer || showResult) return;
    
    setSelectedAnswer(answer);
    setShowResult(true);

    const isCorrect = answer === examQuestions[currentQuestionIndex].correct_option;
    if (isCorrect) {
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

  const progress = examState === "running" ? ((currentQuestionIndex + 1) / examQuestions.length) * 100 : 0;
  const passed = correctAnswers >= 17; // Need 17+ correct answers to pass
  const currentQuestion = examQuestions[currentQuestionIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Card className="card-3d p-8">
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

                <div>
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
                </div>

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
                  className="bg-gradient-primary hover:bg-gradient-primary glow-hover w-full py-6 text-xl"
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
                  className="bg-gradient-primary hover:bg-gradient-primary glow-hover"
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
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Card className="card-3d p-8 space-y-6">
                {currentQuestion.has_image && currentQuestion.image_path && (
                  <div className="mb-6">
                    <img
                      src={`https://tnnjkbipydrhccwxofzm.supabase.co/storage/v1/object/public/question-images/${currentQuestion.image_path}`}
                      alt="Frage Illustration"
                      className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground mb-6">
                    {currentQuestion.question_text}
                  </h2>

                  {showTranslation && selectedLanguage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-primary/10 rounded-lg border border-primary/20 mb-4"
                    >
                      <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-primary">
                          {getTranslatedText(currentQuestion.question_text, selectedLanguage)}
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                          <p className="text-primary/80"><strong>A:</strong> {getTranslatedText(currentQuestion.option_a, selectedLanguage)}</p>
                          <p className="text-primary/80"><strong>B:</strong> {getTranslatedText(currentQuestion.option_b, selectedLanguage)}</p>
                          <p className="text-primary/80"><strong>C:</strong> {getTranslatedText(currentQuestion.option_c, selectedLanguage)}</p>
                          <p className="text-primary/80"><strong>D:</strong> {getTranslatedText(currentQuestion.option_d, selectedLanguage)}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "a", text: currentQuestion.option_a },
                      { key: "b", text: currentQuestion.option_b },
                      { key: "c", text: currentQuestion.option_c },
                      { key: "d", text: currentQuestion.option_d }
                    ].map((option) => {
                      let buttonClass = "p-4 cursor-pointer transition-all duration-300 border-border";
                      
                      if (showResult) {
                        if (option.key === currentQuestion.correct_option) {
                          buttonClass += " border-success bg-success/20 text-success";
                        } else if (option.key === selectedAnswer && option.key !== currentQuestion.correct_option) {
                          buttonClass += " border-destructive bg-destructive/20 text-destructive";
                        }
                      } else {
                        buttonClass += " hover:bg-primary/10 hover:border-primary/30";
                      }

                      return (
                        <motion.div
                          key={option.key}
                          whileHover={!showResult ? { scale: 1.02 } : {}}
                          whileTap={!showResult ? { scale: 0.98 } : {}}
                        >
                          <Card
                            className={buttonClass}
                            onClick={() => !showResult && handleAnswerSelect(option.key)}
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                                {option.key.toUpperCase()}
                              </div>
                              <p className="flex-1 text-foreground">{option.text}</p>
                              {showResult && option.key === currentQuestion.correct_option && (
                                <CheckCircle className="h-5 w-5 text-success" />
                              )}
                              {showResult && option.key === selectedAnswer && option.key !== currentQuestion.correct_option && (
                                <XCircle className="h-5 w-5 text-destructive" />
                              )}
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

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
                )}
              </Card>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Exam;