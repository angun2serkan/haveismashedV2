import { StatsCards } from "@/components/Stats/StatsCards";
import { Card } from "@/components/ui/Card";
import { useLogStore } from "@/stores/logStore";
import { MapPin } from "lucide-react";

export function DashboardPage() {
  const entries = useLogStore((s) => s.entries);

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20 md:pb-8">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      <StatsCards />

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3">
          All Entries
        </h2>

        {entries.length === 0 ? (
          <Card className="text-center py-12">
            <MapPin size={40} className="mx-auto text-dark-500 mb-3" />
            <p className="text-dark-400">No entries yet</p>
            <p className="text-dark-500 text-sm mt-1">
              Go to the globe and tap a country to start logging
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <Card key={entry.id} className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg bg-neon-500/10 flex items-center justify-center shrink-0"
                >
                  <MapPin size={18} className="text-neon-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {entry.cityName}
                  </p>
                  <p className="text-xs text-dark-400">{entry.entryDate}</p>
                </div>
                <div className="text-right shrink-0">
                  {entry.rating && (
                    <span className="text-sm font-bold text-neon-500">
                      {entry.rating}/10
                    </span>
                  )}
                  {entry.tags.length > 0 && (
                    <p className="text-xs text-dark-500 mt-0.5">
                      {entry.tags[0]}{entry.tags.length > 1 ? ` +${entry.tags.length - 1}` : ""}
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
