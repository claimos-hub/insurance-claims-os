"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Send,
  Paperclip,
  Bot,
  User,
  Image,
  FileText,
  CheckCircle2,
  Circle,
  AlertCircle,
  Gauge,
} from "lucide-react";
import type { IntakeMessage, IntakeStep, CarAccidentIntakeData } from "@/types";
import {
  BOT_QUESTIONS,
  getNextStep,
  calculateReadiness,
  createEmptyIntakeData,
  generateAISummary,
  generateInspectorMessage,
} from "@/lib/intake-data";

export default function NewIntakePage() {
  const [messages, setMessages] = useState<IntakeMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentStep, setCurrentStep] = useState<IntakeStep>("greeting");
  const [intakeData, setIntakeData] = useState<CarAccidentIntakeData>(
    createEmptyIntakeData()
  );
  const [isTyping, setIsTyping] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const addBotMessage = useCallback(
    (text: string, type: IntakeMessage["type"] = "text", options?: string[]) => {
      const msg: IntakeMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        sender: "bot",
        text,
        timestamp: new Date().toISOString(),
        type,
        options,
      };
      setMessages((prev) => [...prev, msg]);
    },
    []
  );

  // Start the conversation
  useEffect(() => {
    if (messages.length === 0) {
      setIsTyping(true);
      const t1 = setTimeout(() => {
        addBotMessage(BOT_QUESTIONS.greeting.text);
        setIsTyping(false);
      }, 800);
      const t2 = setTimeout(() => {
        setIsTyping(true);
      }, 1200);
      const t3 = setTimeout(() => {
        const nextStep = getNextStep("greeting", intakeData);
        setCurrentStep(nextStep);
        const q = BOT_QUESTIONS[nextStep];
        addBotMessage(q.text, q.type, q.options);
        setIsTyping(false);
        inputRef.current?.focus();
      }, 2000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const processAnswer = useCallback(
    (answer: string) => {
      const step = currentStep;
      const updatedData = { ...intakeData };

      switch (step) {
        case "event_date":
          updatedData.event_date = answer;
          break;
        case "event_time":
          updatedData.event_time = answer;
          break;
        case "event_location":
          updatedData.event_location = answer;
          break;
        case "description":
          updatedData.description = answer;
          break;
        case "plate_number":
          updatedData.plate_number = answer;
          break;
        case "policy_number":
          updatedData.policy_number = answer;
          break;
        case "injuries":
          updatedData.has_injuries = answer === "כן";
          break;
        case "injury_details":
          updatedData.injury_details = answer;
          break;
        case "other_vehicle":
          updatedData.other_vehicle_involved = answer === "כן";
          break;
        case "third_party_name":
          updatedData.third_party_name = answer;
          break;
        case "third_party_phone":
          updatedData.third_party_phone = answer;
          break;
        case "third_party_plate":
          updatedData.third_party_plate = answer;
          break;
        case "third_party_insurance":
          updatedData.third_party_insurance = answer;
          break;
        case "police_report_ask":
          updatedData.police_report_needed = answer === "כן";
          break;
      }

      setIntakeData(updatedData);

      // Next step
      setIsTyping(true);
      setTimeout(() => {
        const nextStep = getNextStep(step, updatedData);
        setCurrentStep(nextStep);

        if (nextStep === "summary") {
          addBotMessage(BOT_QUESTIONS.summary.text);
          setIsTyping(false);
          setTimeout(() => {
            setIsTyping(true);
            setTimeout(() => {
              const summary = generateAISummary(updatedData);
              addBotMessage(`סיכום התביעה:\n\n${summary}`);
              setIsTyping(false);
              setTimeout(() => {
                setIsTyping(true);
                setTimeout(() => {
                  addBotMessage(BOT_QUESTIONS.complete.text);
                  setIsTyping(false);
                  setIsComplete(true);
                  setCurrentStep("complete");
                }, 1000);
              }, 500);
            }, 1500);
          }, 500);
        } else if (nextStep === "complete") {
          addBotMessage(BOT_QUESTIONS.complete.text);
          setIsTyping(false);
          setIsComplete(true);
        } else {
          const q = BOT_QUESTIONS[nextStep];
          addBotMessage(q.text, q.type, q.options);
          setIsTyping(false);
          inputRef.current?.focus();
        }
      }, 800);
    },
    [currentStep, intakeData, addBotMessage]
  );

  const handleSend = useCallback(() => {
    if (!inputText.trim() || isComplete) return;

    const customerMsg: IntakeMessage = {
      id: `msg-${Date.now()}`,
      sender: "customer",
      text: inputText.trim(),
      timestamp: new Date().toISOString(),
      type: "text",
    };
    setMessages((prev) => [...prev, customerMsg]);
    const answer = inputText.trim();
    setInputText("");
    processAnswer(answer);
  }, [inputText, isComplete, processAnswer]);

  const handleOptionClick = useCallback(
    (option: string) => {
      if (isComplete) return;
      const customerMsg: IntakeMessage = {
        id: `msg-${Date.now()}`,
        sender: "customer",
        text: option,
        timestamp: new Date().toISOString(),
        type: "text",
      };
      setMessages((prev) => [...prev, customerMsg]);
      processAnswer(option);
    },
    [isComplete, processAnswer]
  );

  const handleFileUpload = useCallback(() => {
    if (isComplete) return;
    const fileNames: Record<string, string> = {
      photos: "damage_photo.jpg",
      driver_license: "driver_license.jpg",
      vehicle_license: "vehicle_license.jpg",
      police_report_upload: "police_report.pdf",
    };
    const fileName = fileNames[currentStep] || "document.pdf";

    const fileMsg: IntakeMessage = {
      id: `msg-${Date.now()}`,
      sender: "customer",
      text: "",
      timestamp: new Date().toISOString(),
      type: "file_upload",
      file_name: fileName,
    };
    setMessages((prev) => [...prev, fileMsg]);

    const updatedData = { ...intakeData };
    switch (currentStep) {
      case "photos":
        updatedData.photos_uploaded = [
          ...updatedData.photos_uploaded,
          fileName,
        ];
        break;
      case "driver_license":
        updatedData.driver_license_uploaded = true;
        break;
      case "vehicle_license":
        updatedData.vehicle_license_uploaded = true;
        break;
      case "police_report_upload":
        updatedData.police_report_uploaded = true;
        break;
    }
    setIntakeData(updatedData);

    // For photos, allow multiple uploads before moving on
    if (currentStep === "photos" && updatedData.photos_uploaded.length < 2) {
      setIsTyping(true);
      setTimeout(() => {
        addBotMessage("קיבלתי. אפשר לשלוח עוד תמונות, או כתוב 'סיימתי' כדי להמשיך.");
        setIsTyping(false);
      }, 600);
      return;
    }

    if (currentStep === "photos") {
      setIsTyping(true);
      setTimeout(() => {
        addBotMessage(
          `קיבלתי ${updatedData.photos_uploaded.length} תמונות. תודה!`
        );
        setIsTyping(false);
        processAnswer("done_photos");
      }, 600);
      return;
    }

    processAnswer("file_uploaded");
  }, [isComplete, currentStep, intakeData, addBotMessage, processAnswer]);

  // Handle "סיימתי" for photos
  const handleSendWithPhotoCheck = useCallback(() => {
    if (currentStep === "photos" && inputText.trim() === "סיימתי") {
      const customerMsg: IntakeMessage = {
        id: `msg-${Date.now()}`,
        sender: "customer",
        text: "סיימתי",
        timestamp: new Date().toISOString(),
        type: "text",
      };
      setMessages((prev) => [...prev, customerMsg]);
      setInputText("");
      setIsTyping(true);
      setTimeout(() => {
        addBotMessage(
          `קיבלתי ${intakeData.photos_uploaded.length} תמונות. תודה!`
        );
        setIsTyping(false);
        processAnswer("done_photos");
      }, 600);
      return;
    }
    handleSend();
  }, [currentStep, inputText, intakeData, addBotMessage, processAnswer, handleSend]);

  const readiness = calculateReadiness(intakeData);
  const isFileStep = ["photos", "driver_license", "vehicle_license", "police_report_upload"].includes(currentStep);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/intake"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            שיחת קליטה חדשה
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            סימולציית שיחת WhatsApp - תביעת ביטוח רכב
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Window */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col" style={{ height: "calc(100vh - 200px)" }}>
            {/* Chat Header - WhatsApp style */}
            <div className="bg-[#075e54] text-white px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium text-sm">ClaimPilot Bot</p>
                <p className="text-xs text-white/70">
                  {isTyping ? "מקליד..." : "מקוון"}
                </p>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-3"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5ddd5' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", backgroundColor: "#ece5dd" }}
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "customer" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3 py-2 shadow-sm ${
                      msg.sender === "customer"
                        ? "bg-white text-gray-900 rounded-tr-none"
                        : "bg-[#dcf8c6] text-gray-900 rounded-tl-none"
                    }`}
                  >
                    {msg.type === "file_upload" ? (
                      <div className="flex items-center gap-2 py-1">
                        {msg.file_name?.match(/\.(jpg|jpeg|png)$/i) ? (
                          <Image className="w-4 h-4 text-blue-600" />
                        ) : (
                          <FileText className="w-4 h-4 text-red-600" />
                        )}
                        <span className="text-sm font-medium">
                          {msg.file_name}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-line leading-relaxed">
                        {msg.text}
                      </p>
                    )}
                    <p
                      className={`text-[10px] mt-1 ${
                        msg.sender === "customer"
                          ? "text-gray-400"
                          : "text-green-800/50"
                      } text-left`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString("he-IL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Option buttons */}
              {messages.length > 0 &&
                messages[messages.length - 1].sender === "bot" &&
                messages[messages.length - 1].options &&
                !isTyping && (
                  <div className="flex justify-end gap-2">
                    {messages[messages.length - 1].options!.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => handleOptionClick(opt)}
                        className="bg-white border border-[#075e54] text-[#075e54] px-4 py-1.5 rounded-full text-sm font-medium hover:bg-[#075e54] hover:text-white transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-end">
                  <div className="bg-[#dcf8c6] rounded-lg rounded-tl-none px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="bg-[#f0f0f0] px-3 py-2 flex items-center gap-2 border-t">
              {isFileStep && !isComplete && (
                <button
                  onClick={handleFileUpload}
                  className="p-2 text-gray-500 hover:text-[#075e54] transition-colors"
                  title="העלאת קובץ"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              )}
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendWithPhotoCheck();
                }}
                placeholder={
                  isComplete
                    ? "השיחה הסתיימה"
                    : isFileStep
                    ? "לחץ על הסיכה כדי לצרף קובץ..."
                    : "הקלד הודעה..."
                }
                disabled={isComplete || isTyping}
                className="flex-1 bg-white rounded-full px-4 py-2 text-sm outline-none border border-gray-300 focus:border-[#075e54] disabled:opacity-50"
              />
              <button
                onClick={handleSendWithPhotoCheck}
                disabled={(!inputText.trim() && !isFileStep) || isComplete || isTyping}
                className="p-2 bg-[#075e54] text-white rounded-full hover:bg-[#064e46] transition-colors disabled:opacity-40"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Readiness Panel */}
        <div className="space-y-4">
          {/* Score Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-5 h-5 text-blue-600" />
              <h3 className="text-base font-semibold text-gray-900">
                מוכנות התביעה
              </h3>
            </div>

            {/* Score Circle */}
            <div className="flex justify-center mb-4">
              <div className="relative w-28 h-28">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke={
                      readiness.score === 100
                        ? "#22c55e"
                        : readiness.score >= 70
                        ? "#f59e0b"
                        : "#ef4444"
                    }
                    strokeWidth="10"
                    strokeDasharray={`${(readiness.score / 100) * 314} 314`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {readiness.score}%
                  </span>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-500">
              {readiness.score === 100
                ? "כל הפרטים נאספו - מוכן לבדיקה!"
                : readiness.score >= 70
                ? "כמעט שם - חסרים מספר פרטים"
                : "בתהליך איסוף פרטים..."}
            </p>
          </div>

          {/* Missing Fields */}
          {readiness.missingFields.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <h4 className="text-sm font-semibold text-gray-900">
                  פרטים חסרים
                </h4>
              </div>
              <div className="space-y-2">
                {readiness.missingFields.map((field) => (
                  <div
                    key={field}
                    className="flex items-center gap-2 text-sm text-amber-700"
                  >
                    <Circle className="w-3.5 h-3.5 shrink-0" />
                    {field}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing Documents */}
          {readiness.missingDocuments.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Paperclip className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-semibold text-gray-900">
                  מסמכים חסרים
                </h4>
              </div>
              <div className="space-y-2">
                {readiness.missingDocuments.map((doc) => (
                  <div
                    key={doc}
                    className="flex items-center gap-2 text-sm text-red-700"
                  >
                    <Circle className="w-3.5 h-3.5 shrink-0" />
                    {doc}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collected Data */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              פרטים שנאספו
            </h4>
            <div className="space-y-2 text-sm">
              {intakeData.event_date && (
                <DataRow label="תאריך" value={intakeData.event_date} done />
              )}
              {intakeData.event_time && (
                <DataRow label="שעה" value={intakeData.event_time} done />
              )}
              {intakeData.event_location && (
                <DataRow label="מיקום" value={intakeData.event_location} done />
              )}
              {intakeData.plate_number && (
                <DataRow label="לוחית רכב" value={intakeData.plate_number} done />
              )}
              {intakeData.policy_number && (
                <DataRow label="פוליסה" value={intakeData.policy_number} done />
              )}
              {intakeData.has_injuries !== null && (
                <DataRow
                  label="פציעות"
                  value={intakeData.has_injuries ? "כן" : "לא"}
                  done
                />
              )}
              {intakeData.other_vehicle_involved !== null && (
                <DataRow
                  label="רכב נוסף"
                  value={intakeData.other_vehicle_involved ? "כן" : "לא"}
                  done
                />
              )}
              {intakeData.photos_uploaded.length > 0 && (
                <DataRow
                  label="תמונות"
                  value={`${intakeData.photos_uploaded.length} קבצים`}
                  done
                />
              )}
              {intakeData.driver_license_uploaded && (
                <DataRow label="רישיון נהיגה" value="הועלה" done />
              )}
              {intakeData.vehicle_license_uploaded && (
                <DataRow label="רישיון רכב" value="הועלה" done />
              )}
              {intakeData.police_report_uploaded && (
                <DataRow label="דוח משטרה" value="הועלה" done />
              )}
            </div>
          </div>

          {/* Complete CTA */}
          {isComplete && (
            <Link
              href="/intake/ic1"
              className="block w-full text-center bg-blue-600 text-white px-4 py-3 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              צפה בתביעה שנוצרה
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function DataRow({
  label,
  value,
  done,
}: {
  label: string;
  value: string;
  done: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
      <span className="text-gray-500 min-w-[70px]">{label}:</span>
      <span className="text-gray-900 font-medium truncate">{value}</span>
    </div>
  );
}
