import { useState } from "react";
import { Link2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function InviteLink() {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateInvite = async () => {
    setLoading(true);
    try {
      // In production, call api.createInvite()
      const fakeId = crypto.randomUUID();
      setInviteUrl(`${window.location.origin}/invite/${fakeId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2">
        <Link2 size={18} className="text-neon-500" />
        <h3 className="text-sm font-semibold text-white">Invite a Friend</h3>
      </div>

      <p className="text-xs text-dark-400">
        Generate a single-use invite link. Your friend will need it to register.
      </p>

      {inviteUrl ? (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteUrl}
            className="flex-1 bg-dark-900 border border-dark-600 rounded-lg px-3 py-2 text-xs font-mono text-dark-200 truncate"
          />
          <Button size="sm" variant="secondary" onClick={handleCopy}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </Button>
        </div>
      ) : (
        <Button
          onClick={generateInvite}
          disabled={loading}
          variant="secondary"
          className="w-full"
        >
          {loading ? "Generating..." : "Generate Invite Link"}
        </Button>
      )}
    </Card>
  );
}
