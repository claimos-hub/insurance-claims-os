"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Bot,
  User,
  RotateCcw,
  Phone,
  CheckCircle2,
  Circle,
  Loader2,
  MessageCircle,
  Database,
  Zap,
} from "lucide-react";

interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: string;
}

interface SessionState {
  session_id: string;
  phone: string;
  current_step: string;
  collected_data: Record<string, string>;
  messages: Message[];
}

const STEPS_ORDER = [
  "START",
  "ASK_EVENT_DATE",
  "ASK_LOCATION",
  "ASK_DESCRIPTION",
  "ASK_VEHICLE",
  "ASK_POLICY",
  "ASK_INJURIES",
  "ASK_DOCUMENTS",
  "DONE",
];

const STEP_LABELS: Record<string, string> = {
  START: "התחלה",
  ASK_EVENT_DATE: "תאריך אירוע",
  ASK_LOCATION: "מיקום",
  ASK_DESCRIPTION: "תיאור",
  ASK_VEHICLE: "מספר רכב",
  ASK_POLICY: "פוליסה",
  ASK_INJURIES: "פציעות",
  ASK_INJURY_DETAILS: "פרטי פציעות",
  ASK_OTHER_VEHICLE: "רכב נוסף",
  ASK_THIRD_PARTY: "צד שלישי",
  ASK_DOCUMENTS: "מסמכים",
  DONE: "הושלם",
};

const FIELD_LABELS: Record<string, string> = {
  event_date: "תאריך אירוע",
  event_location: "מיקום",
  description: "תיאור",
  plate_number: "מספר רכב",
  policy_number: "מספר פוליסה",
  has_injuries: "פציעות",
  injury_details: "פרטי פציעות",
  other_vehicle: "רכב נוסף",
  third_party_info: "צד שלישי",
  documents_status: "מסמכים",
  claim_number: "מספר תביעה",
  status: "סטטוס",
};

export default function AutomationPage() {
  const [phone, setPhone] = useState("050-1111111");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [session, setSession] = useState<SessionState | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [claimCreated, setClaimCreated] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const startConversation = async () => {
    setIsStarted(true);
    setClaimCreated(false);

    const res = await fetch("/api/automation/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, action: "init" }),
    });

    const data = await res.json();
    setSession(data.session);
    setMessages(data.session.messages);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const resetConversation = async () => {
    setClaimCreated(false);

    const res = await fetch("/api/automation/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, action: "reset" }),
    });

    const data = await res.json();
    setSession(data.session);
    setMessages(data.session.messages);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    const text = inputText.trim();
    setInputText("");
    setIsTyping(true);

    // Simulate typing delay
    await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));

    const res = await fetch("/api/automation/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message: text }),
    });

    const data = await res.json();
    setSession(data.session);
    setIsTyping(false);

    if (data.claim_created) {
      setClaimCreated(true);
    }

    // Add bot reply from the response
    const botMsg: Message = {
      id: `bot-${Date.now()}`,
      sender: "bot",
      text: data.reply,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, botMsg]);

    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Phone entry screen
  if (!isStarted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            סימולטור תביעות אוטומטי
          </h1>
          <p className="text-gray-500 mb-8">
            סימולציה של שיחת WhatsApp לקליטת תביעת ביטוח רכב
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              מספר טלפון (לסימולציה)
            </label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-right"
                placeholder="050-1234567"
              />
            </div>
          </div>

          <button
            onClick={startConversation}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            התחל שיחה
          </button>
        </div>
      </div>
    );
  }

  const currentStepIndex = STEPS_ORDER.indexOf(
    session?.current_step || "START"
  );

  return (
    <div className="flex h-screen">
      {/* Chat Panel */}
      <div className="flex-1 flex flex-col max-w-2xl">
        {/* WhatsApp Header */}
        <div className="bg-[#075E54] text-white px-6 py-3 flex items-center gap-4 shadow-md">
          <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-base">ClaimPilot Bot</h2>
            <p className="text-xs text-green-200">
              {isTyping ? "מקליד..." : "מחובר"}
            </p>
          </div>
          <button
            onClick={resetConversation}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="שיחה חדשה"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-2"
          style={{
            backgroundColor: "#ECE5DD",
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d4cfc6' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender === "user" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 shadow-sm ${
                  msg.sender === "user"
                    ? "bg-white text-gray-900 rounded-tl-none"
                    : "bg-[#DCF8C6] text-gray-900 rounded-tr-none"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {msg.sender === "bot" ? (
                    <Bot className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-blue-600" />
                  )}
                  <span className="text-[10px] font-medium text-gray-500">
                    {msg.sender === "bot" ? "ClaimPilot" : "לקוח"}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-line leading-relaxed">
                  {msg.text}
                </p>
                <p className="text-[10px] text-gray-400 text-left mt-1">
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-end">
              <div className="bg-[#DCF8C6] rounded-lg rounded-tr-none px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.15s" }}
                  />
                  <span
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.3s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Claim Created Banner */}
        {claimCreated && (
          <div className="bg-green-50 border-t border-green-200 px-4 py-3 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              תביעה נוצרה בהצלחה! מספר:{" "}
              {session?.collected_data.claim_number}
            </span>
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-[#F0F0F0] px-4 py-3 flex items-center gap-3 border-t">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              session?.current_step === "DONE"
                ? "השיחה הסתיימה"
                : "הקלד הודעה..."
            }
            disabled={session?.current_step === "DONE"}
            className="flex-1 bg-white rounded-full px-5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={sendMessage}
            disabled={
              !inputText.trim() ||
              isTyping ||
              session?.current_step === "DONE"
            }
            className="w-10 h-10 bg-[#075E54] text-white rounded-full flex items-center justify-center hover:bg-[#064E46] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Debug Panel */}
      <div className="w-96 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-6">
          {/* Session Info */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Database className="w-4 h-4" />
              Session Debug
            </h3>
            <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Phone:</span>
                <span className="font-mono">{session?.phone || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Session ID:</span>
                <span className="font-mono text-[10px]">
                  {session?.session_id?.slice(0, 12) || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Current Step:</span>
                <span className="font-bold text-blue-600">
                  {session?.current_step || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Messages:</span>
                <span>{messages.length}</span>
              </div>
            </div>
          </div>

          {/* Step Progress */}
          <div className="mb-6">
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              שלבי השיחה
            </h3>
            <div className="space-y-1">
              {STEPS_ORDER.map((step, i) => {
                const isComplete = i < currentStepIndex;
                const isCurrent = step === session?.current_step;
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs ${
                      isCurrent
                        ? "bg-blue-50 text-blue-700 font-bold"
                        : isComplete
                          ? "text-green-700"
                          : "text-gray-400"
                    }`}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                    ) : (
                      <Circle className="w-3.5 h-3.5" />
                    )}
                    {STEP_LABELS[step] || step}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Collected Data */}
          <div>
            <h3 className="text-sm font-bold text-gray-900 mb-3">
              נתונים שנאספו
            </h3>
            {session?.collected_data &&
            Object.keys(session.collected_data).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(session.collected_data)
                  .filter(([key]) => key !== "missing_documents")
                  .map(([key, value]) => (
                    <div
                      key={key}
                      className="bg-gray-50 rounded-lg p-3 text-xs"
                    >
                      <div className="text-gray-500 mb-1">
                        {FIELD_LABELS[key] || key}
                      </div>
                      <div className="font-medium text-gray-900 break-words">
                        {value}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">טרם נאספו נתונים</p>
            )}
          </div>

          {/* Missing Documents (after DONE) */}
          {session?.collected_data.missing_documents && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">
                מסמכים חסרים
              </h3>
              <div className="bg-red-50 rounded-lg p-3">
                {JSON.parse(session.collected_data.missing_documents).map(
                  (doc: string) => (
                    <div
                      key={doc}
                      className="text-xs text-red-700 flex items-center gap-2 py-1"
                    >
                      <Circle className="w-3 h-3" />
                      {doc}
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
