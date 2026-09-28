import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Bot,
  User,
  ArrowRight,
  Search,
  MapPin,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Layers,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import { assistantService } from '../../services/itemService';
import { Badge } from '../../components/UIComponents';

const SAMPLE_PROMPTS = [
  "I lost my black Dell laptop in Central Library yesterday",
  "Lost my blue water bottle near the Cafeteria this afternoon",
  "Mera black wallet library ke paas kho gaya",
  "Found a set of motorcycle keys near the Sports Arena",
];

export const RecoveryAssistantPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      id: 'initial',
      sender: 'assistant',
      text: "Hello! I am your AI Campus Recovery Assistant. What item did you lose or find? Tell me in natural English or Hinglish (e.g. 'I lost my black wallet in the library yesterday'). I will instantly extract characteristics and search the database.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryToSend) => {
    const text = (queryToSend || inputQuery).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await assistantService.chatAssistant(text);
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.response_text || 'Here is what I found for your description:',
        parsed: res.parsed_attributes,
        matches: res.matches || [],
        matchesCount: res.matches_count || 0,
        recommendedAction: res.recommended_action,
        guidanceSteps: res.guidance_steps || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'assistant',
          text: "I encountered a hiccup connecting to the matching engine. Please verify your connection or try again shortly.",
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in flex flex-col h-[calc(100vh-8rem)]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <span>AI Personal Recovery Assistant</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                Autonomous NLP
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Conversational recovery engine powered by semantic intent extraction and real-time database matching.
            </p>
          </div>
        </div>

        <Link
          to="/report-lost"
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span>Manual Report</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Chat Conversation Box */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 rounded-3xl border border-slate-800/80 bg-slate-900/50 backdrop-blur-xl p-4 sm:p-6 shadow-2xl">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] sm:max-w-[75%] space-y-3`}>
                <div
                  className={`p-4 rounded-3xl text-xs leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : msg.isError
                      ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-tl-none'
                      : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`block mt-2 text-[10px] ${
                      isUser ? 'text-blue-200 text-right' : 'text-slate-500'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {/* Structured Extracted Metadata Pills */}
                {msg.parsed && (
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Search className="w-3 h-3 text-blue-400" />
                      Extracted Item Attributes
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.parsed.category && (
                        <Badge variant="primary" className="text-[10px]">
                          Category: {msg.parsed.category}
                        </Badge>
                      )}
                      {msg.parsed.brand && (
                        <Badge variant="default" className="text-[10px]">
                          Brand: {msg.parsed.brand}
                        </Badge>
                      )}
                      {msg.parsed.color && (
                        <Badge variant="purple" className="text-[10px]">
                          Color: {msg.parsed.color}
                        </Badge>
                      )}
                      {msg.parsed.location && (
                        <Badge variant="success" className="text-[10px]">
                          Location: {msg.parsed.location}
                        </Badge>
                      )}
                      {msg.parsed.date && (
                        <Badge variant="warning" className="text-[10px]">
                          Date: {msg.parsed.date}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Candidate Matches Carousel / Cards */}
                {msg.matches && msg.matches.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-slate-200 flex items-center justify-between">
                      <span>Live Campus Matches ({msg.matches.length})</span>
                      <span className="text-[10px] text-emerald-400 font-semibold">
                        Ranked by AI Confidence
                      </span>
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {msg.matches.map((item) => (
                        <div
                          key={item._id}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-500/40 transition group flex flex-col justify-between space-y-2"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {item.similarity_score}% Match
                              </span>
                              <span className="text-[10px] text-slate-500 truncate">
                                {item.category}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-slate-200 group-hover:text-blue-400 transition truncate">
                              {item.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span className="truncate">{item.location}</span>
                            </p>
                          </div>

                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500">
                              {item.storage_locker ? item.storage_locker : 'Security Desk'}
                            </span>
                            <Link
                              to={`/items/${item._id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300"
                            >
                              <span>THIS IS MY ITEM</span>
                              <ArrowRight className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Guidance and Action Steps */}
                {msg.guidanceSteps && msg.guidanceSteps.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-2">
                    <span className="text-[11px] font-bold text-blue-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Recommended Action Steps
                    </span>
                    <ul className="space-y-1 text-[11px] text-slate-300">
                      {msg.guidanceSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                    {msg.recommendedAction === 'create_report' && (
                      <div className="pt-2">
                        <Link
                          to="/report-lost"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold transition shadow-md shadow-rose-600/20"
                        >
                          <span>Publish Lost Report Now</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 border border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex gap-3 justify-start animate-fade-in">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-3xl bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>Analyzing description, extracting entities, and searching database...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Query Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 text-xs">
        <span className="text-[10px] text-slate-500 shrink-0 uppercase tracking-wider font-semibold">
          Try Asking:
        </span>
        {SAMPLE_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-white text-[11px] whitespace-nowrap transition shrink-0"
          >
            "{prompt}"
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 p-2 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl shadow-xl"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder="Describe what you lost or found (English or Hinglish)..."
          disabled={loading}
          className="flex-1 bg-transparent px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!inputQuery.trim() || loading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-lg shadow-blue-600/25 disabled:opacity-40"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

export default RecoveryAssistantPage;
