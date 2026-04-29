"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, User, Phone, Mail } from "lucide-react";
import { mockCustomers, getCustomerClaims } from "@/lib/mock-data";

export default function CustomersPage() {
  const [search, setSearch] = useState("");

  const filtered = mockCustomers.filter(
    (c) =>
      search === "" ||
      c.full_name.includes(search) ||
      c.id_number.includes(search) ||
      c.phone.includes(search)
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">לקוחות</h1>
        <p className="text-gray-500 mt-1">{mockCustomers.length} לקוחות רשומים</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם, ת.ז או טלפון..."
            className="w-full pr-10 pl-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer) => {
          const claims = getCustomerClaims(customer.id);
          return (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {customer.full_name}
                  </p>
                  <p className="text-xs text-gray-500">ת.ז: {customer.id_number}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {customer.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {customer.email}
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  {claims.length} תביעות
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
