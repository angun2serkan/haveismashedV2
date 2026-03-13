import { UserCheck, UserX, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useFriendStore } from "@/stores/friendStore";

export function FriendList() {
  const connections = useFriendStore((s) => s.connections);
  const pendingRequests = useFriendStore((s) => s.pendingRequests);
  const updateConnectionStatus = useFriendStore((s) => s.updateConnectionStatus);
  const removeConnection = useFriendStore((s) => s.removeConnection);

  return (
    <div className="space-y-4">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3">
            Pending Requests
          </h3>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <Card key={req.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-yellow-400" />
                  <span className="text-sm text-white font-mono">
                    {req.requesterId.slice(0, 8)}...
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateConnectionStatus(req.id, "accepted")}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updateConnectionStatus(req.id, "rejected")}
                  >
                    Decline
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Friends */}
      <div>
        <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wider mb-3">
          Friends ({connections.filter((c) => c.status === "accepted").length})
        </h3>
        {connections.filter((c) => c.status === "accepted").length === 0 ? (
          <Card className="text-center py-8">
            <UserCheck size={32} className="mx-auto text-dark-500 mb-3" />
            <p className="text-dark-400 text-sm">No friends yet</p>
            <p className="text-dark-500 text-xs mt-1">
              Share an invite link to connect with friends
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {connections
              .filter((c) => c.status === "accepted")
              .map((conn) => (
                <Card
                  key={conn.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <UserCheck size={18} className="text-accent-green" />
                    <span className="text-sm text-white font-mono">
                      {conn.responderId.slice(0, 8)}...
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeConnection(conn.id)}
                    className="text-dark-400 hover:text-red-400"
                  >
                    <UserX size={16} />
                  </Button>
                </Card>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
