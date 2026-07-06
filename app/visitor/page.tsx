"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, Users } from "lucide-react";
import { useRouter } from "next/navigation";

interface GatePass {
  id: string;
  name: string;
  class: string;
  section: string;
  house: string;
  image_url: string;
}

export default function VisitorDashboard() {
  const [records, setRecords] = useState<GatePass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace("/");
        return;
      }
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();
        
      if (profile?.role !== "visitor") {
        router.replace("/");
      } else {
        setIsAuthorized(true);
      }
    };
    checkAuth();
  }, [router]);

  const fetchRecords = async () => {
    setIsLoading(true);
    // Fetch students from gate_passes table to display as student records
    const { data, error } = await supabase
      .from("gate_passes")
      .select("id, name, class, section, house, image_url")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setRecords(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-6 max-w-[430px] mx-auto flex items-center justify-center w-full shadow-2xl shadow-slate-200/50 sm:rounded-[2.5rem] sm:my-8 sm:h-[90vh]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-6 max-w-[430px] mx-auto font-sans pb-20 w-full shadow-2xl shadow-slate-200/50 sm:rounded-[2.5rem] sm:my-8 sm:h-[90vh] sm:overflow-y-auto sm:border-[8px] sm:border-slate-800 scrollbar-hide">
      
      {/* Header */}
      <header className="flex items-center justify-between gap-3 mt-6 mb-6 px-2 sticky top-0 bg-[#F8F9FA]/90 backdrop-blur-md py-2 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-orange-500" />
          </div>
          <h1 className="text-[20px] font-bold text-slate-900 tracking-tight">Student Records</h1>
        </div>
        <button onClick={handleLogout} className="text-red-500 font-semibold text-sm active:opacity-70 transition-opacity">
          Logout
        </button>
      </header>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
          <p className="text-sm font-medium text-slate-500">Loading records...</p>
        </div>
      ) : (
        <div className="space-y-3.5 px-2">
          {records.map((record) => (
            <div key={record.id} className="bg-white p-4 rounded-3xl shadow-[0_4px_14px_0_rgba(0,0,0,0.04)] flex gap-4 items-center border border-slate-100 transition-transform active:scale-[0.98]">
              
              {/* Avatar */}
              <div className="w-[52px] h-[52px] rounded-full bg-slate-100 shrink-0 overflow-hidden shadow-inner border border-slate-200/50">
                {record.image_url ? (
                  <img src={record.image_url} alt={record.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-600 font-bold text-lg">
                    {record.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              {/* Student Details */}
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-[16px] text-slate-900 truncate leading-tight">{record.name}</h3>
                <div className="mt-1 flex items-center gap-2 text-[13px] text-slate-500">
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md font-medium text-slate-600">
                    Class {record.class}{record.section ? `-${record.section}` : ''}
                  </span>
                  <span className="truncate flex-1">
                    • {record.house}
                  </span>
                </div>
              </div>
            </div>
          ))}
          
          {records.length === 0 && (
            <div className="text-center py-16 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-100 mx-2 shadow-sm">
              <Users className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="font-bold text-slate-700 text-lg mb-1">No Students Found</h3>
              <p className="text-slate-500 font-medium text-sm">There are currently no listed records.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
