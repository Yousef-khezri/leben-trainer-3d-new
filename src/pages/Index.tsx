import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Brain, Globe } from "lucide-react";
import { Hero3D } from "@/components/Hero3D";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Background 3D Elements */}
      <div className="absolute inset-0 z-0">
        <Hero3D />
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6 text-gradient text-glow"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            Leben in Deutschland
          </motion.h1>
          
          <motion.div
            className="text-2xl md:text-3xl font-light text-foreground/90 mb-4 flex items-center justify-center gap-3"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Globe className="h-8 w-8 text-secondary animate-pulse-glow" />
            <span>Trainer</span>
          </motion.div>
          
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            Bereiten Sie sich mit modernster 3D-Technologie auf den deutschen Einbürgerungstest vor. 
            Interaktives Lernen für Ihren Erfolg.
          </motion.p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <motion.div
            whileHover={{ scale: 1.05, rotateY: 5 }}
            whileTap={{ scale: 0.95 }}
            className="perspective-1000"
          >
            <Button
              onClick={() => navigate('/training')}
              size="lg"
              className="bg-gradient-primary hover:bg-gradient-primary glow-hover text-xl px-12 py-6 rounded-2xl border-0 shadow-elevated"
            >
              <BookOpen className="mr-3 h-6 w-6" />
              Training
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05, rotateY: -5 }}
            whileTap={{ scale: 0.95 }}
            className="perspective-1000"
          >
            <Button
              onClick={() => navigate('/exam')}
              size="lg"
              variant="secondary"
              className="bg-gradient-secondary hover:bg-gradient-secondary glow-hover text-xl px-12 py-6 rounded-2xl border-0 shadow-elevated"
            >
              <GraduationCap className="mr-3 h-6 w-6" />
              Prüfung
            </Button>
          </motion.div>
        </motion.div>

        {/* Features */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.1 }}
        >
          {[
            {
              icon: Brain,
              title: "Intelligentes Lernen",
              description: "KI-gestützte Frageauswahl für optimalen Lernerfolg"
            },
            {
              icon: Globe,
              title: "Mehrsprachig",
              description: "Übersetzungen in 6 Sprachen verfügbar"
            },
            {
              icon: GraduationCap,
              title: "Prüfungssimulation",
              description: "Realistische Testbedingungen für alle Bundesländer"
            }
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              className="glass card-3d p-6 rounded-2xl text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 1.3 + index * 0.1 }}
              whileHover={{ y: -5 }}
            >
              <feature.icon className="h-12 w-12 text-primary mb-4 mx-auto animate-float" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Index;