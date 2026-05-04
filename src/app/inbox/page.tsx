"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Phone,
  FileText,
  Shield,
  Tag,
  CheckCircle2,
  Circle,
  Clock,
  ChevronLeft,
  AlertTriangle,
  ArrowDown,
  Filter,
  Send,
} from "lucide-react";
import {
  getConversations,
  getConversationStats,
} from "@/lib/conversations-data";
import type {
  Conversation,
  ConversationStatus,
  ConversationTag,
  ConversationPriority,
  CONVERSATION_STATUS_LABELS,
  CONVERSATION_TAG_LABELS,
  CONVERSATION_TAG_COLORS,
} from "@/types";

const STATUS_LABELS: Record<ConversationStatus, string> = {
  open: "פתוחה",
  in_progress: "בטיפול",
  closed: "סגורה",
};

const STATUS_ICONS: Record<ConversationStatus, React.ElementType> = {
  open: Circle,
  in_progress: Clock,
  closed: CheckCircle2,
};

const STATUS_COLORS: Record<ConversationStatus, string> = {
  open: "text-red-500",
  in_progress: "text-blue-500",
  closed: "text-gray-400",
};

const TAG_LABELS: Record<ConversationTag, string> = {
  claim: "תביעה",
  retention: "שימור",
  sales: "מכירה",
  general: "כללי",
};

const TAG_COLORS: Record<ConversationTag, string> = {
  claim: "bg-purple-100 text-purple-700",
  retention: "bg-amber-100 text-amber-700",
  sales: "bg-green-100 text-green-700",
  general: "bg-slate-100 text-slate-700",
};

const PRIORITY_COLORS: Record<ConversationPriority, string> = {
  high: "border-r-red-500",
  medium: "border-r-amber-400",
  low: "border-r-gray-300",
};

const PRIORITY_DOT: Record<ConversationPriority, string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-gray-300",
};

type FilterStatus = "all" | ConversationStatus;
type FilterTag = "all" | ConversationTag;

export default function InboxPage() {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [tagFilter, setTagFilter] = useState<FilterTag>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [stats, setStats] = useState(getConversationStats());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const filters: { status?: ConversationStatus; tag?: ConversationTag } = {};
    if (statusFilter !== "all") filters.status = statusFilter;
    if (tagFilter !== "all") filters.tag = tagFilter;
    setConversations(getConversations(filters));
    setStats(getConversationStats());
  }, [statusFilter, tagFilter]);

  const selected = conversations.find((c) => c.id === selectedId) || null;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selected]);

  function handleMarkHandled() {
    if (!selected) return;
    // In real app this would update DB — here we just toggle status
    selected.status = selected.status === "closed" ? "open" : "closed";
    selected.unreadCount = 0;
    setConversations([...getConversations(
      statusFilter !== "all" || tagFilter !== "all"
        ? {
            status: statusFilter !== "all" ? statusFilter : undefined,
            tag: tagFilter !== "all" ? tagFilter : undefined,
          }
        : undefined
    )]);
    setStats(getConversationStats());
  }

  function handleSetPriority(priority: ConversationPriority) {
    if (!selected) return;
    selected.priority = priority;
    setConversations([...conversations]);
  }

  function formatTime(isoStr: string): string {
    const d = new Date(isoStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) {
      return d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return "אתמול";
    }
    return d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
  }

  function formatMessageTime(isoStr: string): string {
    return new Date(isoStr).toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="flex h-screen">
      {/* Right side — Conversation list */}
      <div className="w-96 border-l border-gray-200 bg-white flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              תיבת WhatsApp
            </h1>
            <div className="flex items-center gap-2 text-xs">
              <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                {stats.open} פתוחות
              </span>
              <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {stats.unread} לא נקראו
              </span>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="all">כל הסטטוסים</option>
              <option value="open">פתוחה</option>
              <option value="in_progress">בטיפול</option>
              <option value="closed">סגורה</option>
            </select>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value as FilterTag)}
              className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
            >
              <option value="all">כל התגיות</option>
              <option value="claim">תביעה</option>
              <option value="retention">שימור</option>
              <option value="sales">מכירה</option>
              <option value="general">כללי</option>
            </select>
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              <Filter className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              אין שיחות לפי הסינון
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = selectedId === conv.id;
              const StatusIcon = STATUS_ICONS[conv.status];
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={`w-full text-right p-4 border-b border-gray-100 border-r-4 transition-colors ${
                    PRIORITY_COLORS[conv.priority]
                  } ${
                    isSelected
                      ? "bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[conv.priority]}`} />
                      <span className="text-sm font-semibold text-gray-900">
                        {conv.customerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {conv.unreadCount > 0 && (
                        <span className="bg-green-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {formatTime(conv.lastMessageTime)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Phone className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-500 font-mono">
                      {conv.customerPhone}
                    </span>
                    <StatusIcon className={`w-3 h-3 mr-1 ${STATUS_COLORS[conv.status]}`} />
                    <span className="text-xs text-gray-500">{STATUS_LABELS[conv.status]}</span>
                  </div>

                  <p className="text-sm text-gray-600 truncate mb-2">
                    {conv.lastMessage}
                  </p>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {conv.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${TAG_COLORS[tag]}`}
                      >
                        {TAG_LABELS[tag]}
                      </span>
                    ))}
                    {conv.linkedClaimNumber && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-mono">
                        {conv.linkedClaimNumber}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Left side — Conversation view */}
      <div className="flex-1 flex flex-col bg-gray-50 h-full">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">בחר שיחה כדי לצפות בה</p>
              <p className="text-sm mt-1">
                {stats.total} שיחות | {stats.unread} לא נקראו
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-700 font-bold text-sm">
                      {selected.customerName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {selected.customerName}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-mono">{selected.customerPhone}</span>
                      {selected.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`px-1.5 py-0.5 rounded-full font-medium ${TAG_COLORS[tag]}`}
                        >
                          {TAG_LABELS[tag]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Priority selector */}
                  <select
                    value={selected.priority}
                    onChange={(e) =>
                      handleSetPriority(e.target.value as ConversationPriority)
                    }
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-gray-700 bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="high">דחוף</option>
                    <option value="medium">רגיל</option>
                    <option value="low">נמוך</option>
                  </select>

                  {/* Mark handled button */}
                  <button
                    onClick={handleMarkHandled}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      selected.status === "closed"
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {selected.status === "closed" ? "פתח מחדש" : "סמן כטופל"}
                  </button>
                </div>
              </div>

              {/* Linked items bar */}
              {(selected.linkedClaimNumber || selected.linkedPolicyNumber) && (
                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
                  {selected.linkedClaimNumber && selected.linkedClaimId && (
                    <Link
                      href={`/claims/${selected.linkedClaimId}`}
                      className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      תביעה {selected.linkedClaimNumber}
                    </Link>
                  )}
                  {selected.linkedPolicyNumber && (
                    <span className="flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                      <Shield className="w-3.5 h-3.5" />
                      פוליסה {selected.linkedPolicyNumber}
                    </span>
                  )}
                  <Link
                    href={`/customers/${selected.customerId}`}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg"
                  >
                    לקוח: {selected.customerName}
                  </Link>
                </div>
              )}
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {selected.messages.map((msg) => {
                const isInbound = msg.direction === "inbound";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isInbound ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        isInbound
                          ? "bg-green-100 text-gray-900 rounded-tr-sm"
                          : "bg-white text-gray-900 border border-gray-200 rounded-tl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.message}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isInbound ? "text-green-600" : "text-gray-400"
                        }`}
                      >
                        {formatMessageTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Status bar */}
            <div className="bg-white border-t border-gray-200 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{selected.messages.length} הודעות</span>
                  <span className="text-gray-300">|</span>
                  <span>
                    נוצר{" "}
                    {new Date(selected.createdAt).toLocaleDateString("he-IL")}
                  </span>
                  {selected.status !== "closed" && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-amber-600">
                        תשובות נשלחות דרך WhatsApp בלבד
                      </span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {selected.status === "closed" && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      שיחה סגורה
                    </span>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
