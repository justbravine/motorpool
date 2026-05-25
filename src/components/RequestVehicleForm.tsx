"use client";

import { useEffect, useMemo, useState } from "react";
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
  start_date: z.string().min(1, "Departure date is required"),
  end_date: z.string().min(1, "Return date is required"),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, {
  message: "Return must be after departure",
  path: ["end_date"],
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

type RequestVehicleFormProps = {
  onSubmitted?: () => void;
};

export default function RequestVehicleForm({ onSubmitted }: RequestVehicleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationSuggestions, setDestinationSuggestions] = useState<Array<{ id: string; label: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState<"start_date" | "end_date" | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());

  // 2. Initialize React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema) as any,
  });

  const destinationRegister = useMemo(() => register("destination"), [register]);
  const showSuggestions = destinationQuery.trim().length >= 3 && (isSearching || destinationSuggestions.length > 0);
  const startDateValue = watch("start_date");
  const endDateValue = watch("end_date");

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const toIsoDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateLabel = (value?: string) => {
    if (!value) return "Select date";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "Select date";
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const buildCalendarCells = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const lastOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastOfMonth.getDate();
    const startIndex = (firstOfMonth.getDay() + 6) % 7;
    const cells: Array<{ date: Date | null; key: string }> = [];

    for (let i = 0; i < startIndex; i += 1) {
      cells.push({ date: null, key: `empty-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      cells.push({ date: new Date(year, month, day), key: `day-${day}` });
    }

    return cells;
  };

  const openCalendar = (field: "start_date" | "end_date") => {
    const currentValue = field === "start_date" ? startDateValue : endDateValue;
    const initialDate = currentValue ? new Date(currentValue) : new Date();
    setCalendarMonth(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
    setCalendarOpen(field);
  };

  const handleSelectDate = (field: "start_date" | "end_date", date: Date) => {
    setValue(field, toIsoDate(date), { shouldValidate: true });
    setCalendarOpen(null);
  };

  useEffect(() => {
    const query = destinationQuery.trim();
    if (query.length < 3) {
      setDestinationSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&countrycode=ke`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          setDestinationSuggestions([]);
          return;
        }

        const data = await response.json();
        const suggestions = (data?.features ?? []).map((feature: any) => {
          const props = feature?.properties ?? {};
          const parts = [props.name, props.city, props.state, props.country].filter(Boolean);
          const label = parts.join(", ");
          const id = `${props.osm_type || ""}-${props.osm_id || ""}-${label}`;
          return { id, label };
        });

        setDestinationSuggestions(suggestions.filter((item: { id: string; label: string }) => item.label));
      } catch {
        setDestinationSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destinationQuery]);

  // 3. Handle the Submission
  const onSubmit = async (data: RequestFormValues) => {
    setIsSubmitting(true);
    setMessage(null);
    
    try {
      const requesterId = await getAuthedUserId();

      const startTime = new Date(data.start_date);
      const endTime = new Date(data.end_date);

      await createTripRequest({
        requester_id: requesterId,
        destination: data.destination,
        purpose: data.purpose,
        start_time: startTime,
        end_time: endTime,
      });

      setMessage({ type: "success", text: "Vehicle request submitted successfully!" });
      reset(); // Clear the form on success
      setDestinationQuery("");
      setDestinationSuggestions([]);
      setCalendarOpen(null);
      onSubmitted?.();
    } catch (error) {
      setMessage({ type: "error", text: "Failed to submit request. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] p-6 md:p-8 space-y-6 relative transition-colors duration-300"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-emerald-600"></div>
      
      <div className="border-b border-[color:var(--panel-edge)] pb-4 mb-2">
        <h2 className="text-xl font-bold text-[color:var(--foreground)]">Trip Details</h2>
        <p className="text-sm text-[color:var(--muted)] mt-1">Please ensure all fields match your approved travel mandate.</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-semibold text-[color:var(--muted)] flex items-center gap-2">
            <CalendarClock size={16} className="text-emerald-700" /> Departure Date
          </label>
          <input type="hidden" {...register("start_date")} value={startDateValue || ""} />
          <div className="relative">
            <button
              type="button"
              onClick={() => openCalendar("start_date")}
              className="w-full border border-[color:var(--panel-edge)] rounded-lg px-3 py-2.5 bg-[color:var(--panel-strong)] hover:bg-[color:var(--panel)] focus:bg-[color:var(--panel)] focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none transition-all text-[color:var(--foreground)] text-left"
            >
              {formatDateLabel(startDateValue)}
            </button>
            {calendarOpen === "start_date" && (
              <div className="absolute z-30 mt-3 w-[280px] rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--panel-edge)]">
                  <div className="text-sm font-semibold text-[color:var(--foreground)]">
                    {calendarMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                      }
                      className="rounded-full border border-[color:var(--panel-edge)] px-2.5 py-1 text-xs text-[color:var(--foreground)] hover:border-emerald-400"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                      }
                      className="rounded-full border border-[color:var(--panel-edge)] px-2.5 py-1 text-xs text-[color:var(--foreground)] hover:border-emerald-400"
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 px-5 pt-4 text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 px-5 pb-5 pt-3">
                  {buildCalendarCells(calendarMonth).map((cell) => (
                    (() => {
                      const isSelected = cell.date && toIsoDate(cell.date) === startDateValue;
                      return (
                    <button
                      key={cell.key}
                      type="button"
                      disabled={!cell.date}
                      onClick={() => cell.date && handleSelectDate("start_date", cell.date)}
                      className={`h-10 rounded-xl text-sm font-semibold transition-all ${
                        cell.date
                          ? isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-[color:var(--panel-strong)] text-[color:var(--foreground)] hover:bg-emerald-600/15"
                          : "text-transparent"
                      }`}
                    >
                      {cell.date ? cell.date.getDate() : "0"}
                    </button>
                      );
                    })()
                  ))}
                </div>
              </div>
            )}
          </div>
          {errors.start_date && (
            <span className="text-xs text-rose-600 font-medium">{errors.start_date.message}</span>
          )}
        </div>
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-semibold text-[color:var(--muted)] flex items-center gap-2">
            <CalendarClock size={16} className="text-emerald-700" /> Return Date
          </label>
          <input type="hidden" {...register("end_date")} value={endDateValue || ""} />
          <div className="relative">
            <button
              type="button"
              onClick={() => openCalendar("end_date")}
              className="w-full border border-[color:var(--panel-edge)] rounded-lg px-3 py-2.5 bg-[color:var(--panel-strong)] hover:bg-[color:var(--panel)] focus:bg-[color:var(--panel)] focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none transition-all text-[color:var(--foreground)] text-left"
            >
              {formatDateLabel(endDateValue)}
            </button>
            {calendarOpen === "end_date" && (
              <div className="absolute z-30 mt-3 w-[280px] rounded-2xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--panel-edge)]">
                  <div className="text-sm font-semibold text-[color:var(--foreground)]">
                    {calendarMonth.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                      }
                      className="rounded-full border border-[color:var(--panel-edge)] px-2.5 py-1 text-xs text-[color:var(--foreground)] hover:border-emerald-400"
                    >
                      Prev
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                      }
                      className="rounded-full border border-[color:var(--panel-edge)] px-2.5 py-1 text-xs text-[color:var(--foreground)] hover:border-emerald-400"
                    >
                      Next
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 px-5 pt-4 text-[10px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                  {weekDays.map((day) => (
                    <div key={day} className="text-center">
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 px-5 pb-5 pt-3">
                  {buildCalendarCells(calendarMonth).map((cell) => (
                    (() => {
                      const isSelected = cell.date && toIsoDate(cell.date) === endDateValue;
                      return (
                    <button
                      key={cell.key}
                      type="button"
                      disabled={!cell.date}
                      onClick={() => cell.date && handleSelectDate("end_date", cell.date)}
                      className={`h-10 rounded-xl text-sm font-semibold transition-all ${
                        cell.date
                          ? isSelected
                            ? "bg-emerald-600 text-white"
                            : "bg-[color:var(--panel-strong)] text-[color:var(--foreground)] hover:bg-emerald-600/15"
                          : "text-transparent"
                      }`}
                    >
                      {cell.date ? cell.date.getDate() : "0"}
                    </button>
                      );
                    })()
                  ))}
                </div>
              </div>
            )}
          </div>
          {errors.end_date && (
            <span className="text-xs text-rose-600 font-medium">{errors.end_date.message}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-2 pt-2">
        <label className="text-sm font-semibold text-[color:var(--muted)] flex items-center gap-2">
          <MapPin size={16} className="text-emerald-700" /> Destination
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g., Ministry Headquarters, Block B"
            autoComplete="off"
            {...destinationRegister}
            value={destinationQuery}
            onChange={(event) => {
              destinationRegister.onChange(event);
              setDestinationQuery(event.target.value);
            }}
            onBlur={() => {
              setTimeout(() => setDestinationSuggestions([]), 120);
            }}
            className="border border-[color:var(--panel-edge)] rounded-lg px-4 py-2.5 bg-[color:var(--panel-strong)] hover:bg-[color:var(--panel)] focus:bg-[color:var(--panel)] focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none transition-all text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] w-full"
          />
          {showSuggestions && (
            <div className="absolute z-20 mt-2 w-full rounded-xl border border-[color:var(--panel-edge)] bg-[color:var(--panel)] shadow-lg overflow-hidden">
              {isSearching && (
                <div className="px-3 py-2 text-xs text-[color:var(--muted)]">Searching...</div>
              )}
              {destinationSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onMouseDown={() => {
                    setValue("destination", suggestion.label, { shouldValidate: true });
                    setDestinationQuery(suggestion.label);
                    setDestinationSuggestions([]);
                  }}
                  className="w-full text-left px-3 py-2 text-sm text-[color:var(--foreground)] hover:bg-[color:var(--panel-strong)]"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {errors.destination && <span className="text-xs text-rose-600 font-medium">{errors.destination.message}</span>}
      </div>

      <div className="flex flex-col space-y-2">
        <label className="text-sm font-semibold text-[color:var(--muted)] flex items-center gap-2">
          <Text size={16} className="text-emerald-700" /> Purpose of Travel
        </label>
        <textarea
          placeholder="Detailed reason for travel..."
          rows={4}
          {...register("purpose")}
          className="border border-[color:var(--panel-edge)] rounded-lg px-4 py-3 bg-[color:var(--panel-strong)] hover:bg-[color:var(--panel)] focus:bg-[color:var(--panel)] focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600 outline-none transition-all text-[color:var(--foreground)] placeholder:text-[color:var(--muted)] resize-none"
        />
        {errors.purpose && <span className="text-xs text-rose-600 font-medium">{errors.purpose.message}</span>}
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-700 text-white font-semibold py-3 sm:py-4 px-4 rounded-xl hover:bg-emerald-800 focus:ring-4 focus:ring-emerald-600/20 active:scale-[0.99] disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Send size={18} /> {isSubmitting ? "Submitting Request..." : "Submit Travel Request"}
        </button>
      </div>
    </form>
  );
}