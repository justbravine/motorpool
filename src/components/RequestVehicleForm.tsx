"use client";

import { useState } from "react";
import { CalendarClock, MapPin, Send, Text } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createTripRequest, getAuthedUserId } from "@/lib/mockDb";

// 1. Define a form-specific schema
// We don't need the full TripSchema here because the user doesn't set ID, status, or driver.
const requestFormSchema = z.object({
  destination: z.string().min(2, "Destination is required"),
  purpose: z.string().min(5, "Please provide a detailed purpose (min 5 chars)"),
  start_time: z.coerce.date({ message: "Start time is required" }),
  end_time: z.coerce.date({ message: "End time is required" }),
}).refine((data) => data.end_time > data.start_time, {
  message: "End time must be strictly after the start time",
  path: ["end_time"], // This assigns the error message to the end_time field
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

export default function RequestVehicleForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2. Initialize React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema) as any,
  });

  // 3. Handle the Submission
  const onSubmit = async (data: RequestFormValues) => {
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      const requesterId = await getAuthedUserId();

      await createTripRequest({
        requester_id: requesterId,
        destination: data.destination,
        purpose: data.purpose,
        start_time: data.start_time,
        end_time: data.end_time,
      });

      setMessage({ type: "success", text: "Vehicle request submitted successfully!" });
      reset(); // Clear the form on success
    } catch (error) {
      setMessage({ type: "error", text: "Failed to submit request. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 space-y-6 relative overflow-hidden transition-colors duration-300"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
      
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 mb-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Trip Details</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please ensure all fields match your approved travel mandate.</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            message.type === "success" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20" : "bg-rose-50 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <CalendarClock size={16} className="text-blue-600" /> Departure Time
          </label>
          <input
            type="datetime-local"
            {...register("start_time")}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-slate-900 dark:text-slate-100"
          />
          {errors.start_time && <span className="text-xs text-rose-500 font-medium">{errors.start_time.message}</span>}
        </div>
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <CalendarClock size={16} className="text-blue-600" /> Return Time
          </label>
          <input
            type="datetime-local"
            {...register("end_time")}
            className="border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-slate-900 dark:text-slate-100"
          />
          {errors.end_time && <span className="text-xs text-rose-500 font-medium">{errors.end_time.message}</span>}
        </div>
      </div>

      <div className="flex flex-col space-y-2 pt-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <MapPin size={16} className="text-blue-600" /> Destination
        </label>
        <input
          type="text"
          placeholder="e.g., Ministry Headquarters, Block B"
          {...register("destination")}
          className="border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        {errors.destination && <span className="text-xs text-rose-500 font-medium">{errors.destination.message}</span>}
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
          <Text size={16} className="text-blue-600" /> Purpose of Travel
        </label>
        <textarea
          placeholder="Detailed reason for travel..."
          rows={4}
          {...register("purpose")}
          className="border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 bg-slate-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none"
        />
        {errors.purpose && <span className="text-xs text-rose-500 font-medium">{errors.purpose.message}</span>}
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white font-semibold py-3 sm:py-4 px-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-600/20 active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Send size={18} /> {isSubmitting ? "Submitting Request..." : "Submit Travel Request"}
        </button>
      </div>
    </form>
  );
}