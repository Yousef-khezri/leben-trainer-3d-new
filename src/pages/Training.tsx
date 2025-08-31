import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ChevronLeft, ChevronRight, Languages, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock questions data - in real app this would come from Supabase
const mockQuestions = [
  {
    id: 1,
    question_text: "Wann ist die Bundesrepublik Deutschland entstanden?",
    option_a: "1947",
    option_b: "1949",
    option_c: "1951",
    option_d: "1955",
    correct_option: "b",
    category: "general",
    has_image: false,
    image_url: null,
    translations: {
      persisch: "کی جمهوری فدرال آلمان تشکیل شد؟",
      englisch: "When was the Federal Republic of Germany founded?",
      russisch: "Когда была основана Федеративная Республика Германия?",
      ukrainisch: "Коли була заснована Федеративна Республіка Німеччина?",
      arabisch: "متى تأسست جمهورية ألمانيا الاتحادية؟",
      türkisch: "Almanya Federal Cumhuriyeti ne zaman kuruldu?"
    }
  },
  {
    id: 2,
    question_text: "Welche Farben hat die deutsche Flagge?",
    option_a: "schwarz-rot-gold",
    option_b: "rot-weiß-schwarz",
    option_c: "schwarz-gelb-rot",
    option_d: "blau-weiß-rot",
    correct_option: "a",
    category: "general",
    has_image: false,
    image_url: null,
    translations: {
      persisch: "پرچم آلمان چه رنگ‌هایی دارد؟",
      englisch: "What colors does the German flag have?",
      russisch: "Какие цвета у немецкого флага?",
      ukrainisch: "Які кольори має німецький прапор?",
      arabisch: "ما هي ألوان العلم الألماني؟",
      türkisch: "Alman bayrağının renkleri nelerdir?"
    }
  }
];

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

  useEffect(() => {
    toast({
      title: "Supabase Integration erforderlich",
      description: "Verbinden Sie Ihr Projekt mit Supabase, um Fragen aus der Datenbank zu laden.",
      duration: 5000,
    });
  }, [toast]);

  const nextQuestion = () => {
    if (currentQuestion < mockQuestions.length - 1) {
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
    if (questionNum >= 1 && questionNum <= mockQuestions.length) {
      setCurrentQuestion(questionNum - 1);
      setShowTranslation(false);
      setJumpToQuestion("");
    }
  };

  const question = mockQuestions[currentQuestion];

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
              Frage {currentQuestion + 1} von {mockQuestions.length}
            </p>
          </div>

          <div className="w-32"></div> {/* Spacer for centering */}
        </motion.div>

        {/* Language Selection */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 mb-8 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            <span className="text-foreground">Übersetzung:</span>
          </div>
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-64 glass border-white/20">
              <SelectValue placeholder="Sprache auswählen" />
            </SelectTrigger>
            <SelectContent>
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
          transition={{ duration: 0.6, delay: 0.4 }}
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
                {question.has_image && question.image_url && (
                  <div className="mb-6">
                    <img
                      src={question.image_url}
                      alt="Frage Illustration"
                      className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <h2 className="text-2xl font-semibold text-foreground">
                    {question.question_text}
                  </h2>

                  {showTranslation && selectedLanguage && question.translations[selectedLanguage as keyof typeof question.translations] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-4 bg-primary/10 rounded-lg border border-primary/20"
                    >
                      <p className="text-lg text-primary">
                        {question.translations[selectedLanguage as keyof typeof question.translations]}
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
              disabled={currentQuestion === mockQuestions.length - 1}
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
              max={mockQuestions.length}
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