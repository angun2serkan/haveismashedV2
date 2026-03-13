import { useState } from "react";
import { Calendar, Star, Tag, FileText, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useLogStore } from "@/stores/logStore";
import { PREDEFINED_TAGS } from "@/types";

export function LogEntryForm() {
  const isOpen = useLogStore((s) => s.isLogFormOpen);
  const selectedCity = useLogStore((s) => s.selectedCity);
  const closeLogForm = useLogStore((s) => s.closeLogForm);
  const addEntry = useLogStore((s) => s.addEntry);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]!);
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [notes, setNotes] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
      setCustomTag("");
    }
  };

  const handleSubmit = () => {
    if (!selectedCity) return;

    // In production, encrypt and send to API
    addEntry({
      id: crypto.randomUUID(),
      userId: "",
      countryCode: "",
      cityId: selectedCity.id,
      cityName: selectedCity.name,
      countryName: "",
      entryDate: date,
      latitude: selectedCity.lat,
      longitude: selectedCity.lng,
      tags: selectedTags,
      rating,
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: null,
    });

    // Reset form
    setDate(new Date().toISOString().split("T")[0]!);
    setRating(5);
    setSelectedTags([]);
    setNotes("");
    closeLogForm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeLogForm}
      title={selectedCity ? `Log — ${selectedCity.name}` : "New Log Entry"}
    >
      <div className="space-y-5">
        {/* Date */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-dark-200 mb-2">
            <Calendar size={14} />
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-500 transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Rating 1-10 */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-dark-200 mb-2">
            <Star size={14} />
            Rating: <span className="text-neon-500 font-bold">{rating}</span>/10
          </label>
          <input
            type="range"
            min={1}
            max={10}
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full accent-neon-500 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-dark-500 mt-1">
            <span>1</span>
            <span>5</span>
            <span>10</span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-dark-200 mb-2">
            <Tag size={14} />
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {PREDEFINED_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  selectedTags.includes(tag)
                    ? "bg-neon-500/20 text-neon-400 border border-neon-500/50"
                    : "bg-dark-700 text-dark-300 border border-dark-600 hover:border-dark-500"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          {/* Custom tag selected */}
          {selectedTags
            .filter((t) => !PREDEFINED_TAGS.includes(t as typeof PREDEFINED_TAGS[number]))
            .map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-accent-purple/20 text-accent-purple border border-accent-purple/50 mr-2 mb-2"
              >
                {tag}
                <button onClick={() => toggleTag(tag)} className="cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            ))}
          <div className="flex gap-2">
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
              placeholder="Add custom tag..."
              className="flex-1 bg-dark-900 border border-dark-600 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-dark-500 focus:outline-none focus:border-neon-500"
            />
            <Button size="sm" variant="secondary" onClick={addCustomTag}>
              Add
            </Button>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="flex items-center justify-between text-sm font-medium text-dark-200 mb-2">
            <span className="flex items-center gap-2">
              <FileText size={14} />
              Notes
            </span>
            <span
              className={`text-xs ${notes.length > 260 ? "text-red-400" : "text-dark-500"}`}
            >
              {notes.length}/280
            </span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => {
              if (e.target.value.length <= 280) setNotes(e.target.value);
            }}
            placeholder="Optional notes..."
            rows={3}
            className="w-full bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-neon-500 resize-none"
          />
        </div>

        {/* Submit */}
        <Button onClick={handleSubmit} className="w-full" size="lg">
          Save Entry
        </Button>
      </div>
    </Modal>
  );
}
