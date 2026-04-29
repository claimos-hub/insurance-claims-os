"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Save } from "lucide-react";
import Link from "next/link";
import { CLAIM_TYPE_LABELS, ClaimType } from "@/types";
import { mockCustomers } from "@/lib/mock-data";

export default function NewClaimPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_id: "",
    type: "car" as ClaimType,
    title: "",
    description: "",
    insurance_company: "",
    policy_number: "",
    incident_date: "",
    claim_amount: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Mock save
    setTimeout(() => {
      router.push("/claims");
    }, 600);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/claims"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowRight className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">תביעה חדשה</h1>
          <p className="text-gray-500 mt-1">מלא את פרטי התביעה</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl">
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            פרטי תביעה
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                כותרת התביעה *
              </label>
              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                placeholder="לדוגמה: תאונת דרכים - נזק לרכב"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                לקוח *
              </label>
              <select
                name="customer_id"
                value={form.customer_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">בחר לקוח</option>
                {mockCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} - {c.id_number}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                סוג ביטוח *
              </label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                {Object.entries(CLAIM_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                חברת ביטוח *
              </label>
              <input
                type="text"
                name="insurance_company"
                value={form.insurance_company}
                onChange={handleChange}
                required
                placeholder="לדוגמה: הראל ביטוח"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                מספר פוליסה
              </label>
              <input
                type="text"
                name="policy_number"
                value={form.policy_number}
                onChange={handleChange}
                placeholder="POL-XXX-XXXX"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                תאריך אירוע *
              </label>
              <input
                type="date"
                name="incident_date"
                value={form.incident_date}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                סכום תביעה (₪)
              </label>
              <input
                type="number"
                name="claim_amount"
                value={form.claim_amount}
                onChange={handleChange}
                placeholder="0"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                תיאור האירוע *
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="תאר את האירוע בפירוט..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {loading ? "שומר..." : "צור תביעה"}
          </button>
          <Link
            href="/claims"
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium"
          >
            ביטול
          </Link>
        </div>
      </form>
    </div>
  );
}
