"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { LogOut, ArrowLeft, Camera, Image as ImageIcon, Loader2, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type View = "dashboard" | "records" | "entry";

interface GatePass {
  id: string;
  name: string;
  age: number;
  gender: string;
  class: string;
  section: string;
  house: string;
  reason: string;
  image_url: string;
  created_at: string;
}

export default function WardenDashboard() {
  const [view, setView] = useState<View>("dashboard");
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
        
      if (profile?.role !== "warden") {
        router.replace("/");
      } else {
        setIsAuthorized(true);
      }
    };
    checkAuth();
  }, [router]);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    gender: "",
    class: "",
    section: "",
    house: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image Capture State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const fetchRecords = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("gate_passes")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (!error && data) {
      setRecords(data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (view === "records") {
      fetchRecords();
    }
  }, [view]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImageFile(null);
    setImagePreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      let uploadedImageUrl = null;

      // Handle Image Upload if exists
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `gate-passes/${fileName}`;

        // Note: Assuming a storage bucket named 'images' exists. 
        // If it fails, we fall back to null.
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, imageFile, { upsert: true });

        if (!uploadError) {
          const { data } = supabase.storage.from('images').getPublicUrl(filePath);
          uploadedImageUrl = data.publicUrl;
        } else {
          console.warn("Storage upload failed, proceeding without image:", uploadError);
        }
      }

      const { error } = await supabase.from("gate_passes").insert({
        name: formData.name,
        age: parseInt(formData.age),
        gender: formData.gender,
        class: formData.class,
        section: formData.section,
        house: formData.house,
        reason: formData.reason,
        image_url: uploadedImageUrl,
        created_by: userData.user?.id,
      });

      if (error) throw error;

      alert("Gate pass entry created successfully!");
      setFormData({ name: "", age: "", gender: "", class: "", section: "", house: "", reason: "" });
      removeImage();
      setView("dashboard");
    } catch (err: any) {
      alert("Error creating entry: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // -----------------------------------------------------
  // VIEW: DASHBOARD
  // -----------------------------------------------------
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-6 max-w-[430px] mx-auto flex items-center justify-center w-full shadow-2xl shadow-slate-200/50 sm:rounded-[2.5rem] sm:my-8 sm:h-[90vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (view === "dashboard") {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-6 max-w-[430px] mx-auto relative font-sans w-full shadow-2xl shadow-slate-200/50 sm:rounded-[2.5rem] sm:my-8 sm:h-[90vh] sm:overflow-y-auto sm:border-[8px] sm:border-slate-800 scrollbar-hide">
        <header className="flex justify-between items-center mt-6 mb-10 px-2">
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Warden Dashboard</h1>
          <button onClick={handleLogout} className="text-red-500 font-semibold text-sm active:opacity-70 transition-opacity">
            Logout
          </button>
        </header>

        <div className="flex gap-3 px-2">
          <button 
            onClick={() => setView("entry")}
            className="flex-1 bg-white p-5 rounded-3xl shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] active:scale-95 transition-all flex flex-col items-center justify-center min-h-[160px] border border-slate-100"
          >
            <h2 className="font-bold text-slate-800 mb-1.5 text-center leading-tight">Gate Pass<br/>Entry</h2>
            <p className="text-[11px] text-slate-500 text-center font-medium">Create new passes</p>
          </button>

          <button 
            onClick={() => setView("records")}
            className="flex-1 bg-white p-5 rounded-3xl shadow-[0_4px_14px_0_rgba(0,0,0,0.05)] active:scale-95 transition-all flex flex-col items-center justify-center min-h-[160px] border border-slate-100"
          >
            <h2 className="font-bold text-slate-800 mb-1.5 text-center leading-tight">Gate Pass<br/>Records</h2>
            <p className="text-[11px] text-slate-500 text-center font-medium">View all history</p>
          </button>
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // VIEW: RECORDS
  // -----------------------------------------------------
  if (view === "records") {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-4 sm:p-6 max-w-[430px] mx-auto font-sans pb-20 w-full shadow-2xl shadow-slate-200/50 sm:rounded-[2.5rem] sm:my-8 sm:h-[90vh] sm:overflow-y-auto sm:border-[8px] sm:border-slate-800 scrollbar-hide">
        <header className="flex items-center gap-3 mt-6 mb-6 px-2 sticky top-0 bg-[#F8F9FA]/90 backdrop-blur-md py-2 z-10">
          <button onClick={() => setView("dashboard")} className="p-2 -ml-2 text-slate-800 active:bg-slate-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Gate Pass Records</h1>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-3.5 px-2">
            {records.map((record) => {
              const date = new Date(record.created_at);
              const formattedDate = `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
              
              return (
                <div key={record.id} className="bg-white p-4 rounded-3xl shadow-[0_4px_14px_0_rgba(0,0,0,0.04)] flex gap-4 items-center border border-slate-100">
                  <div className="w-[52px] h-[52px] rounded-full bg-slate-100 shrink-0 overflow-hidden shadow-inner border border-slate-200/50">
                    {record.image_url ? (
                      <img src={record.image_url} alt={record.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-lg">
                        {record.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-[15px] text-slate-900 truncate leading-tight">{record.name}</h3>
                    <p className="text-[11px] text-slate-500 mb-1 mt-0.5 font-medium">{formattedDate}</p>
                    <p className="text-[13px] text-slate-600 truncate">
                      Class {record.class}{record.section ? `-${record.section}` : ''} • {record.house}
                    </p>
                    <p className="text-[13px] text-slate-500 italic truncate mt-0.5">{record.reason}</p>
                  </div>
                </div>
              );
            })}
            
            {records.length === 0 && (
              <div className="text-center py-10 text-slate-500 font-medium bg-white rounded-3xl border border-slate-100 mx-2">
                No gate passes found.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // -----------------------------------------------------
  // VIEW: ENTRY FORM
  // -----------------------------------------------------
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 max-w-[430px] mx-auto font-sans pb-10 w-full shadow-2xl shadow-slate-200/50 sm:rounded-[2.5rem] sm:my-8 sm:h-[90vh] sm:overflow-y-auto sm:border-[8px] sm:border-slate-800 scrollbar-hide">
      <header className="flex items-center gap-3 mt-6 mb-6 px-2 sticky top-0 bg-white/90 backdrop-blur-md py-2 z-10">
        <button onClick={() => setView("dashboard")} className="p-2 -ml-2 text-slate-800 active:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-[22px] font-bold text-slate-900 tracking-tight flex-1 pr-8 text-center">Gate Pass Entry</h1>
      </header>

      <form onSubmit={handleFormSubmit} className="space-y-4.5 px-2">
        {/* Hidden File Inputs for Native OS Permissions */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={cameraInputRef}
          onChange={handleImageChange}
          className="hidden"
        />
        <input
          type="file"
          accept="image/*"
          ref={galleryInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        {/* Image Upload Area */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-36 h-36 rounded-full border-2 border-dashed border-slate-200 bg-[#FAFAFA] flex flex-col items-center justify-center text-slate-500 mb-5 overflow-hidden shadow-sm">
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={removeImage}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white active:scale-95 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <span className="text-[13px] font-medium w-20 text-center leading-tight">Select or capture image</span>
            )}
          </div>
          <div className="flex gap-5">
            <button 
              type="button" 
              onClick={() => cameraInputRef.current?.click()}
              className="w-[52px] h-[52px] rounded-full bg-white shadow-[0_4px_14px_0_rgba(0,0,0,0.06)] border border-slate-100 flex items-center justify-center text-slate-700 active:scale-90 transition-transform active:bg-slate-50"
            >
              <Camera className="w-6 h-6" />
            </button>
            <button 
              type="button" 
              onClick={() => galleryInputRef.current?.click()}
              className="w-[52px] h-[52px] rounded-full bg-white shadow-[0_4px_14px_0_rgba(0,0,0,0.06)] border border-slate-100 flex items-center justify-center text-orange-500 active:scale-90 transition-transform active:bg-slate-50"
            >
              <ImageIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-slate-800 mb-1.5 ml-1">Name *</label>
          <input
            type="text"
            required
            placeholder="Student Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-[#F4F6F9] border border-transparent focus:border-blue-400 focus:bg-white px-4 py-3.5 rounded-2xl outline-none transition-colors text-slate-800 text-[15px]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-slate-800 mb-1.5 ml-1">Age *</label>
          <input
            type="number"
            required
            placeholder="Student Age"
            value={formData.age}
            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            className="w-full bg-[#F4F6F9] border border-transparent focus:border-blue-400 focus:bg-white px-4 py-3.5 rounded-2xl outline-none transition-colors text-slate-800 text-[15px]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-slate-800 mb-1.5 ml-1">Gender</label>
          <input
            type="text"
            placeholder="Male / Female"
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            className="w-full bg-[#F4F6F9] border border-transparent focus:border-blue-400 focus:bg-white px-4 py-3.5 rounded-2xl outline-none transition-colors text-slate-800 text-[15px]"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-[13px] font-bold text-slate-800 mb-1.5 ml-1">Class *</label>
            <input
              type="text"
              required
              placeholder="e.g. 10"
              value={formData.class}
              onChange={(e) => setFormData({ ...formData, class: e.target.value })}
              className="w-full bg-[#F4F6F9] border border-transparent focus:border-blue-400 focus:bg-white px-4 py-3.5 rounded-2xl outline-none transition-colors text-slate-800 text-[15px]"
            />
          </div>
          <div className="flex-1">
            <label className="block text-[13px] font-bold text-slate-800 mb-1.5 ml-1">Section</label>
            <input
              type="text"
              placeholder="e.g. A"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              className="w-full bg-[#F4F6F9] border border-transparent focus:border-blue-400 focus:bg-white px-4 py-3.5 rounded-2xl outline-none transition-colors text-slate-800 text-[15px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold text-slate-800 mb-1.5 ml-1">House</label>
          <input
            type="text"
            placeholder="e.g. Red House"
            value={formData.house}
            onChange={(e) => setFormData({ ...formData, house: e.target.value })}
            className="w-full bg-[#F4F6F9] border border-transparent focus:border-blue-400 focus:bg-white px-4 py-3.5 rounded-2xl outline-none transition-colors text-slate-800 text-[15px]"
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold text-slate-800 mb-1.5 ml-1">Reason *</label>
          <textarea
            required
            placeholder="Reason for pass"
            rows={3}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full bg-[#F4F6F9] border border-transparent focus:border-blue-400 focus:bg-white px-4 py-3.5 rounded-2xl outline-none transition-colors text-slate-800 text-[15px] resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#2563EB] active:bg-blue-700 hover:bg-[#1D4ED8] text-white font-bold py-4 rounded-2xl mt-6 transition-colors flex justify-center items-center shadow-[0_8px_20px_-6px_rgba(37,99,235,0.4)] active:scale-[0.98]"
        >
          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : "Submit Gate Pass"}
        </button>
      </form>
    </div>
  );
}
