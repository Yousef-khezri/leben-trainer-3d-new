import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, ChevronLeft, ChevronRight, Languages, Hash, BookOpen, MapPin } from "lucide-react";
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

const languages = [
  { value: "persisch", label: "Persisch (فارسی)" },
  { value: "englisch", label: "English" },
  { value: "russisch", label: "Русский" },
  { value: "ukrainisch", label: "Українська" },
  { value: "arabisch", label: "العربية" },
  { value: "türkisch", label: "Türkçe" }
];

const Training = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [showTranslation, setShowTranslation] = useState(false);
  const [jumpToQuestion, setJumpToQuestion] = useState("");
  
  // New state for question filtering
  const [isStateSpecific, setIsStateSpecific] = useState(false);
  const [selectedState, setSelectedState] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);

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
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowTranslation(false);
    }
  };

  const handleJumpToQuestion = () => {
    const questionNum = parseInt(jumpToQuestion);
    if (questionNum >= 1 && questionNum <= questions.length) {
      setCurrentQuestion(questionNum - 1);
      setShowTranslation(false);
      setJumpToQuestion("");
    }
  };

  const handleQuestionTypeChange = (checked: boolean) => {
    setIsStateSpecific(checked);
    setSelectedState("");
    setCurrentQuestion(0);
  };

  const question = questions[currentQuestion];
  
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
      <div className="container mx-auto px-4 py-8">
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

          <div className="w-32"></div> {/* Spacer for centering */}
        </motion.div>

        {/* Question Type Selection */}
        <motion.div
          className="max-w-4xl mx-auto mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="card-3d p-6">
            <div className="flex flex-col sm:flex-row gap-6 items-center justify-center">
              {/* Question Type Toggle */}
              <div className="flex items-center space-x-4">
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
              </div>

              {/* State Selection */}
              {isStateSpecific && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex items-center gap-2"
                >
                  <Select value={selectedState} onValueChange={setSelectedState}>
                    <SelectTrigger className="w-64 glass border-white/20">
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
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Language Selection */}
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
            <SelectContent className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Question Card */}
        <motion.div
          className="max-w-4xl mx-auto mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            >
              <Card className="card-3d p-8 space-y-6">
                {question.has_image && question.image_path && (
                  <div className="mb-6">
                    <img
                      src={`https://tnnjkbipydrhccwxofzm.supabase.co/storage/v1/object/public/question-images/${question.image_path}`}
                      alt="Frage Illustration"
                      className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">
                    {question.question_text}
                  </h2>

                  {showTranslation && selectedLanguage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-primary/10 rounded-lg border border-primary/20"
                    >
                      <p className="text-lg text-primary">
                        {/* Note: Translation integration would go here */}
                        Übersetzung für {selectedLanguage} wird geladen...
                      </p>
                    </motion.div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: "a", text: question.option_a },
                      { key: "b", text: question.option_b },
                      { key: "c", text: question.option_c },
                      { key: "d", text: question.option_d }
                    ].map((option) => (
                      <motion.div
                        key={option.key}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={`p-4 cursor-pointer transition-all duration-300 hover:bg-primary/10 hover:border-primary/30 ${
                            question.correct_option === option.key
                              ? "border-success bg-success/10"
                              : "border-border hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                              {option.key.toUpperCase()}
                            </div>
                            <p className="text-foreground">{option.text}</p>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
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
        </motion.div>

        {/* Navigation */}
        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {/* Previous/Next Buttons */}
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

          {/* Jump to Question */}
          <div className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Frage Nr."
              value={jumpToQuestion}
              onChange={(e) => setJumpToQuestion(e.target.value)}
              className="w-24 glass border-white/20"
              type="number"
              min="1"
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