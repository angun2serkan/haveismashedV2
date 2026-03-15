import { useEffect, useState } from "react";
import { StatsCards } from "@/components/Stats/StatsCards";
import { Card } from "@/components/ui/Card";
import { useLogStore } from "@/stores/logStore";
import { api } from "@/services/api";
import { MapPin, Star, Calendar, Loader2, Smile, Dumbbell, MessageCircle } from "lucide-react";
import { loadTags, getTagById } from "@/data/tags";
import { getCountryName } from "@/utils/countryName";

/** Color mapping for tag categories */
function getTagColor(category: string): string {
  if (category === "meeting") return "bg-accent-cyan/15 text-accent-cyan border-accent-cyan/30";
  if (category === "venue") return "bg-neon-500/15 text-neon-400 border-neon-500/30";
  if (category === "activity") return "bg-accent-purple/15 text-accent-purple border-accent-purple/30";
  return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30";
}

export function DashboardPage() {
  const dates = useLogStore((s) => s.dates);
  const setDates = useLogStore((s) => s.setDates);
  const setStats = useLogStore((s) => s.setStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const [datesRes, statsRes] = await Promise.all([
          api.getDates(),
          api.getStats(),
          loadTags(),
        ]);
        if (!cancelled) {
          setDates(datesRes.dates);
          setStats(statsRes);
        }
      } catch {
        // silently fail — user sees empty state
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [setDates, setStats]);

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20 md:pb-8">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <StatsCards />

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3">
          All Dates
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={32} className="text-neon-500 animate-spin" />
          </div>
        ) : dates.length === 0 ? (
          <Card className="text-center py-12">
            <MapPin size={40} className="mx-auto text-dark-500 mb-3" />
            <p className="text-dark-400">No dates yet</p>
            <p className="text-dark-500 text-sm mt-1">
              Go to the globe and tap a country to start logging
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {dates.map((date) => (
              <Card key={date.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-neon-500/10 flex items-center justify-center shrink-0">
                    <MapPin size={18} className="text-neon-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-white">
                        {date.personNickname ? `${date.personNickname} — ` : ""}{date.cityName}, {getCountryName(date.countryCode)}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star size={14} className="text-neon-500" />
                        <span className="text-sm font-bold text-neon-500">
                          {date.rating}/10
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-dark-400 mb-2">
                      <span className="capitalize">{date.gender}</span>
                      <span>{date.ageRange}</span>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {date.dateAt}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {date.faceRating !== null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-pink-500/15 text-pink-400 border border-pink-500/30">
                          <Smile size={10} /> Face: {date.faceRating}
                        </span>
                      )}
                      {date.bodyRating !== null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30">
                          <Dumbbell size={10} /> Body: {date.bodyRating}
                        </span>
                      )}
                      {date.chatRating !== null && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
                          <MessageCircle size={10} /> Chat: {date.chatRating}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/30">
                        <Star size={10} /> Overall: {date.rating}
                      </span>
                    </div>

                    {date.description && (
                      <p className="text-xs text-dark-300 mb-2 line-clamp-2">
                        {date.description}
                      </p>
                    )}

                    {date.tagIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {date.tagIds.map((tagId) => {
                          const tag = getTagById(tagId);
                          if (!tag) return null;
                          return (
                            <span
                              key={tagId}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getTagColor(tag.category)}`}
                            >
                              {tag.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
