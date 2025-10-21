'use client';

import { useState } from 'react';
// Import motion and AnimatePresence for animations
import { motion, AnimatePresence } from 'framer-motion';
// Import Lucide icons
import {
  ShieldCheck,
  Link,
  Phone,
  AlertTriangle, // Yellow warning
  Loader2,
  MoveRight,
  AlertCircle,   // Red danger
  CheckCircle,   // Green OK
  Unlink,        // For broken links
  SendHorizontal, // For submit button
  Info,          // <-- Import Info icon
} from 'lucide-react';
// Import Google Logo component
import GoogleLogo from '@/components/GoogleLogo';

// 1. Define the API response interface (Same)
interface AnalysisResult {
  verdict: string;
  explanation: string;
  confidence: number;
  url_analysis: {
    [key: string]: {
      original_url: string;
      unfurl_report: string;
      safe_browsing: string;
      whois: string; // This corresponds to WHOIS Check
    };
  };
  phone_analysis: { [key: string]: string };
}

// 2. Icon & Text Styling Helper (Checks for "WHOIS Check:" label)
const ReportItem = ({ text, label }: { text: string; label?: string }) => {
  let IconComponent: React.ElementType | null = null;
  let textColor = 'text-zinc-300'; // Default text color
  let iconSize = 'w-5 h-5';

  // --- Determine Status based on backend text ---
  const isBrokenLink = text.includes('Link is broken or invalid') || text.includes('Link Redirect: Link is broken');
  const isDanger = text.includes('🚨 DANGER') || text.includes('🚨 DANGEROUS');
  const isSuspicious = text.includes('⚠️ SUSPICIOUS') || text.includes('⚠️ Warning');
  const isOkStatus = !(isDanger || isSuspicious || isBrokenLink);

  // --- Determine Icon and Color using switch based on Label ---
  switch (label) {
      // UPDATED LABEL CHECK
      case 'WHOIS Check:':
          IconComponent = Info; // Always Info icon for this label
          if (isDanger) textColor = 'text-red-400';
          else if (isSuspicious) textColor = 'text-yellow-400';
          else textColor = 'text-blue-400'; // OK is blue
          break;
      case 'Google Check:':
      case 'Google Search:':
          if (isDanger) { IconComponent = AlertCircle; textColor = 'text-red-400'; }
          else if (isSuspicious) { IconComponent = AlertTriangle; textColor = 'text-yellow-400'; }
          else { // Google OK
              IconComponent = GoogleLogo;
              textColor = 'text-zinc-400';
              iconSize = 'w-4 h-4';
          }
          break;
      case 'Link Redirect:':
          if (isBrokenLink) { IconComponent = Unlink; textColor = 'text-zinc-500'; }
          else if (isDanger) { IconComponent = AlertCircle; textColor = 'text-red-400';}
          else { IconComponent = CheckCircle; textColor = 'text-emerald-400'; } // OK Redirect is Green Check
          break;
      default: // Fallback
          if (isDanger) { IconComponent = AlertCircle; textColor = 'text-red-400'; }
          else if (isSuspicious) { IconComponent = AlertTriangle; textColor = 'text-yellow-400'; }
          else if (isBrokenLink) { IconComponent = Unlink; textColor = 'text-zinc-500'; }
          else { IconComponent = CheckCircle; textColor = 'text-emerald-400'; }
          break;
  }


  // --- Clean Text ---
  let cleanText = text
    .replace(/^[🚨⚠️✅]\s*/, '')
    // Remove backend prefixes before displaying
    .replace(/^(Google Check:|Google Search:|WHOIS Check:|Link Redirect:|ScamShieldAI Lookup:)\s*/, ''); // Keep WHOIS Check here for cleaning old backend responses if needed

  const displayLabel = label || '';

  // --- Render ---
  return (
    <div className={`flex items-start gap-2 ${textColor}`}>
      {IconComponent && <IconComponent className={`${iconSize} flex-shrink-0 mt-[3px]`} />}
      {/* Label Styling */}
      <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex-shrink-0 mt-[1px]">
        {displayLabel}
      </span>
      {/* Main Text Styling */}
      <p
        className={`text-sm ${
          // Adjust based on the FINAL textColor set above
          textColor === 'text-zinc-500' ? 'text-zinc-400' // Broken link
          : textColor === 'text-zinc-400' ? 'text-zinc-300' // Google OK
          : textColor === 'text-blue-400' ? 'text-zinc-300' // WHOIS OK
          : textColor === 'text-emerald-400' ? 'text-zinc-300' // Other OK (like Redirect)
          : 'text-zinc-300' // Default
        }`}
        dangerouslySetInnerHTML={{
          __html: cleanText
            .replace(
              /\*\*(.*?)\*\*/g,
              '<strong class="font-semibold text-zinc-100">$1</strong>'
            )
            .replace(
              /`(.*?)`/g,
              '<code class="text-xs bg-zinc-700 text-amber-300 px-1 py-0.5 rounded">$1</code>'
            ),
        }}
      />
    </div>
  );
};


// 3. Helper for Verdict Icon & Text Color + Icon Glow (Same status colors)
const getVerdictStyles = (verdict: string) => {
  if (verdict.includes('High Risk')) {
    return {
      IconComponent: AlertCircle,
      textColor: 'text-red-400',
      iconGlow: 'shadow-[0_0_15px_rgba(248,113,113,0.5)]',
    };
  }
  if (verdict.includes('Be Cautious')) {
    return {
      IconComponent: AlertTriangle,
      textColor: 'text-yellow-400',
      iconGlow: 'shadow-[0_0_15px_rgba(250,204,21,0.5)]',
    };
  }
  return {
    IconComponent: CheckCircle,
    textColor: 'text-emerald-400',
    iconGlow: 'shadow-[0_0_15px_rgba(52,211,153,0.5)]',
  };
};

// --- MAIN COMPONENT ---
export default function Home() {
  // 4. Component state (Same)
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 5. Form submission (Same)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setIsLoading(true);
    setResult(null);
    setError(null);
    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: message }),
      });
      if (!response.ok) throw new Error('Network response was not ok');
      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch {
      setError(
        'Could not connect to the analysis service. Is the backend running and CORS configured?'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 6. The TSX (HTML) with minimal colors & single border input & URL fix
  return (
    <main className="flex flex-col items-center px-4 py-16 sm:px-6 lg:px-8 bg-zinc-950 text-zinc-100 relative overflow-hidden min-h-screen">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(161,161,170,0.03),transparent_70%)] opacity-50" />

      <motion.div
        className="w-full max-w-2xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header (Same minimal Zinc) */}
        <div className="text-center mb-10">
          <motion.div
            className="flex justify-center items-center mb-4"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <ShieldCheck className="w-12 h-12 text-zinc-400 drop-shadow-[0_0_10px_rgba(212,212,216,0.1)]" />
          </motion.div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-100 mb-2">
            ScamShield AI
          </h1>
          <p className="text-zinc-400 text-base sm:text-lg">Intelligent scam detection for messages</p>
        </div>

        {/* --- Input Form (Single Border) --- */}
        <form
          onSubmit={handleSubmit}
          className="w-full flex items-end gap-2 bg-zinc-900 border border-zinc-700 rounded-xl p-3 sm:p-4 shadow-lg focus-within:border-zinc-500 transition-colors duration-200"
        >
          <textarea
            id="message"
            rows={1}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            className="flex-grow p-2 text-base bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none overflow-y-auto max-h-40 focus:ring-0 rounded"
            placeholder="Paste suspicious message here..."
            style={{ height: '40px' }}
          />
          <motion.button
            type="submit"
            disabled={isLoading || !message.trim()}
            whileHover={{ scale: message.trim() ? 1.05 : 1 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed"
            aria-label="Analyze Message"
          >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-zinc-400" />
            ) : (
                <SendHorizontal className="w-5 h-5 text-zinc-200" />
            )}
          </motion.button>
        </form>

        {/* Error Card (Same) */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mt-6 p-4 flex items-center gap-3 border border-red-600/50 bg-red-900/40 rounded-lg text-red-300"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-300">Analysis Error</h3>
                <p className="text-sm text-red-300/80">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- RESULT CARD DESIGN (Minimal Colors) --- */}
        <AnimatePresence>
          {result && (
            <motion.div
              key="result"
              className={`mt-8 p-6 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl`}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {/* Verdict Section (Same) */}
              <div className="flex items-center gap-3 mb-4">
                {(() => {
                  const { IconComponent, textColor, iconGlow } = getVerdictStyles(result.verdict);
                  return (
                    <>
                      <IconComponent className={`w-7 h-7 flex-shrink-0 ${textColor} ${iconGlow} rounded-full`} />
                      <h3 className={`text-xl font-semibold ${textColor}`}>
                        {result.verdict.replace(/^[🚨⚠️✅]\s*/, '')}
                      </h3>
                    </>
                  );
                })()}
              </div>

              {/* Explanation Text (Same) */}
              <p
                className="text-base text-zinc-300 mb-4"
                dangerouslySetInnerHTML={{
                  __html: result.explanation.replace(
                    /\*\*(.*?)\*\*/g,
                    '<strong class="font-medium text-zinc-100">$1</strong>'
                  ),
                }}
              />
              <p className="text-xs text-zinc-500 mb-5">
                ML Confidence Score:{' '}
                <strong className="text-zinc-400">
                  {Math.round(result.confidence * 100)}%
                </strong>
              </p>

              {/* Divider (Same) */}
              {(Object.keys(result.url_analysis).length > 0 ||
                Object.keys(result.phone_analysis).length > 0) && (
                <hr className="mb-5 border-zinc-700" />
              )}

              {/* URL Analysis Section (Passing "WHOIS Check:" Label) */}
              {Object.keys(result.url_analysis).length > 0 && (
                <div className="mb-6">
                  <h4 className="flex items-center gap-2 text-sm font-semibold mb-3 text-zinc-400 uppercase tracking-wider">
                    <Link className="w-4 h-4 text-zinc-500" />
                    URL Details
                  </h4>
                  {Object.entries(result.url_analysis).map(([finalUrl, report]) => {
                     const isHighRiskVerdict = result.verdict.includes('High Risk');
                     const showUnfurl = !isHighRiskVerdict || report.unfurl_report.includes('🚨') || report.unfurl_report.includes('⚠️');
                     const showSafeBrowsing = !isHighRiskVerdict || report.safe_browsing.includes('🚨') || report.safe_browsing.includes('⚠️');
                     const showWhois = !isHighRiskVerdict || report.whois.includes('🚨') || report.whois.includes('⚠️');
                     if (isHighRiskVerdict && !showUnfurl && !showSafeBrowsing && !showWhois) return null;

                    return(
                      <div
                        key={finalUrl}
                        className="mb-3 p-4 bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden"
                      >
                        {/* URL Display (Same fix) */}
                        {finalUrl !== report.original_url ? (
                          <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-400 mb-3 min-w-0">
                            <span className="truncate min-w-0">{report.original_url}</span>
                            <MoveRight className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                            <span className="font-semibold text-zinc-200 break-all min-w-0">{finalUrl}</span>
                          </div>
                        ) : (
                          <p className="font-mono text-xs text-zinc-400 break-all mb-3 min-w-0">
                            {finalUrl}
                          </p>
                        )}
                        {/* Reports (Passing "WHOIS Check:" Label) */}
                        <div className="space-y-2">
                          {showUnfurl && <ReportItem text={report.unfurl_report} label="Link Redirect:" />}
                          {showSafeBrowsing && <ReportItem text={report.safe_browsing} label="Google Check:" />}
                          {/* UPDATED LABEL PASSED HERE */}
                          {showWhois && <ReportItem text={report.whois} label="WHOIS Check:" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Phone Analysis Section (Passing Label) */}
              {Object.keys(result.phone_analysis).length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-semibold mb-3 text-zinc-400 uppercase tracking-wider">
                    <Phone className="w-4 h-4 text-emerald-500" />
                    Phone Details
                  </h4>
                  {Object.entries(result.phone_analysis).map(([phone, report]) => (
                    <div
                      key={phone}
                      className="mb-3 p-4 bg-zinc-800 border border-zinc-700 rounded-lg"
                    >
                      <p className="font-mono text-base text-zinc-300 mb-2">
                        {phone}
                      </p>
                      <ReportItem text={report} label="Google Search:" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}