import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BookOpen,
  Brain,
  Globe,
  Instagram,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { Hero3D } from "@/components/Hero3D";

const Index = () => {
  const navigate = useNavigate();

  // Contact data
  const INSTAGRAM_USERNAME = "Joseph.khezri";
  const INSTAGRAM_URL = `https://www.instagram.com/${INSTAGRAM_USERNAME}`;
  const EMAIL = "Khezri.yousef@outlook.com";
  const PHONE = "00491626128090";
  const CITY = "Köln, Deutschland";
  const BENEDIKT_URL =
    "https://web2.cylex.de/firma-home/benedict-school-2733338.html";

  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const copyText = async (text: string, setState: (v: boolean) => void) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        ta.style.top = "0";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setState(true);
      setTimeout(() => setState(false), 1400);
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  const handleCopyPhone = () => copyText(PHONE, setCopiedPhone);
  const handleCopyEmail = () => copyText(EMAIL, setCopiedEmail);

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden flex flex-col">
      {/* Background 3D Elements */}
      <div className="absolute inset-0 z-0">
        <Hero3D />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
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
            Bereiten Sie sich mit modernster 3D-Technologie auf den deutschen
            Einbürgerungstest vor. Interaktives Lernen für Ihren Erfolg.
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
              onClick={() => navigate("/training")}
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
              onClick={() => navigate("/exam")}
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
              description: "KI-gestützte Frageauswahl für optimalen Lernerfolg",
            },
            {
              icon: Globe,
              title: "Mehrsprachig",
              description: "Übersetzungen in 6 Sprachen verfügbar",
            },
            {
              icon: GraduationCap,
              title: "Prüfungssimulation",
              description: "Realistische Testbedingungen für alle Bundesländer",
            },
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

      {/* Footer - Professional Contact (centered) */}
      <footer className="relative z-10 border-t border-white/10 bg-black/20 backdrop-blur supports-[backdrop-filter]:bg-black/10 mt-16 flex items-center justify-center">
        <div className="container mx-auto px-6 pt-8 pb-10">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            {/* Left: Branding / Location / Institute */}
            <div className="text-center md:text-left">
              <motion.h4
                className="text-lg font-semibold text-foreground mb-2"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                Kontakt & Info
              </motion.h4>

              <motion.div
                className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-sm">{CITY}</span>
              </motion.div>

              <motion.a
                href={BENEDIKT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-3 text-xs text-secondary hover:text-secondary/80 transition-colors underline underline-offset-4 decoration-secondary/40"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
                title="Benedict School Köln - Webseite öffnen"
              >
                <ExternalLink className="h-4 w-4" />
                Bénédict Bildungsinstitut Köln
              </motion.a>
            </div>

            {/* Right: Contact Actions - EXACT CENTER (both axes) */}
            <div className="w-full flex flex-col items-center justify-center min-h-[220px]">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                {/* Instagram (link) */}
                <motion.a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="group glass card-3d px-4 py-3 rounded-xl border border-white/15 hover:border-primary/50 transition-all shadow-md min-w-[220px] flex items-center gap-3"
                  title="Instagram öffnen"
                  aria-label="Instagram öffnen"
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-md bg-gradient-to-br from-pink-500/40 to-purple-500/40 opacity-0 group-hover:opacity-100 transition" />
                    <Instagram className="relative h-5 w-5 text-pink-400 group-hover:text-pink-300 transition" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm text-foreground font-medium">
                      @{INSTAGRAM_USERNAME}
                    </div>
                    {/* <div className="text-[11px] text-muted-foreground">
                      Folgen • صفحه اینستاگرام
                    </div> */}
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition" />
                </motion.a>

                {/* Email (copy, not mailto) */}
                <motion.button
                  onClick={handleCopyEmail}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="group glass card-3d px-4 py-3 rounded-xl border border-white/15 hover:border-primary/50 transition-all shadow-md min-w-[220px] flex items-center gap-3"
                  title="E-Mail kopieren"
                  aria-label="E-Mail kopieren"
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-md bg-gradient-to-br from-sky-500/40 to-cyan-500/40 opacity-0 group-hover:opacity-100 transition" />
                    <Mail className="relative h-5 w-5 text-sky-400 group-hover:text-sky-300 transition" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm text-foreground font-medium">
                      {EMAIL}
                    </div>
                    {/* <div className="text-[11px] text-muted-foreground">
                      E-Mail • کلیک = کپی
                    </div> */}
                  </div>
                  <div className="relative w-5 h-5">
                    <AnimatePresence mode="wait" initial={false}>
                      {copiedEmail ? (
                        <motion.div
                          key="check-email"
                          initial={{ scale: 0, rotate: -45, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="text-sky-400"
                          aria-hidden="true"
                        >
                          <Check className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy-email"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-muted-foreground group-hover:text-foreground transition"
                          aria-hidden="true"
                        >
                          <Copy className="h-5 w-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>

                {/* Phone (copy) */}
                <motion.button
                  onClick={handleCopyPhone}
                  whileHover={{ y: -3, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="group glass card-3d px-4 py-3 rounded-xl border border-white/15 hover:border-primary/50 transition-all shadow-md min-w-[220px] flex items-center gap-3"
                  title="Telefonnummer kopieren"
                  aria-label="Telefonnummer kopieren"
                >
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-md bg-gradient-to-br from-emerald-500/40 to-teal-500/40 opacity-0 group-hover:opacity-100 transition" />
                    <Phone className="relative h-5 w-5 text-emerald-400 group-hover:text-emerald-300 transition" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm text-foreground font-medium">
                      {PHONE}
                    </div>
                    {/* <div className="text-[11px] text-muted-foreground">
                      Telefon • کلیک = کپی
                    </div> */}
                  </div>
                  <div className="relative w-5 h-5">
                    <AnimatePresence mode="wait" initial={false}>
                      {copiedPhone ? (
                        <motion.div
                          key="check-phone"
                          initial={{ scale: 0, rotate: -45, opacity: 0 }}
                          animate={{ scale: 1, rotate: 0, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="text-emerald-400"
                          aria-hidden="true"
                        >
                          <Check className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="copy-phone"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="text-muted-foreground group-hover:text-foreground transition"
                          aria-hidden="true"
                        >
                          <Copy className="h-5 w-5" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <motion.p
              className="text-xs text-muted-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              © 2025 Joseph Khezri. Alle Rechte vorbehalten.
            </motion.p>

            <motion.div
              className="text-[11px] text-muted-foreground"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Entwickelt mit Liebe für Bildung und Integration.
            </motion.div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;