import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { UserPlus, AlertCircle, Link2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/services/api";

type InviteState = "loading" | "valid" | "invalid";

export function InvitePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<InviteState>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setState("invalid");
      setError("Invalid invite link");
      return;
    }

    api
      .getInvite(id)
      .then((data) => {
        if (!data.valid || data.invite_type !== "platform") {
          setState("invalid");
          setError("This invite has expired");
        } else {
          setState("valid");
        }
      })
      .catch(() => {
        setState("invalid");
        setError("This invite has expired");
      });
  }, [id]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neon-500 text-glow mb-1">
            havesmashed
          </h1>
        </div>

        <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
          {state === "loading" && (
            <div className="text-center py-8">
              <Link2 className="w-8 h-8 text-neon-500 animate-pulse mx-auto mb-3" />
              <p className="text-dark-300 text-sm">Validating invite...</p>
            </div>
          )}

          {state === "invalid" && (
            <div className="text-center py-8 space-y-4">
              <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {state === "valid" && (
            <div className="text-center space-y-6">
              <UserPlus className="w-10 h-10 text-neon-500 mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  You've been invited to havesmashed!
                </h2>
                <p className="text-sm text-dark-300">
                  Create an anonymous account and start tracking your adventures.
                </p>
              </div>
              <Button
                onClick={() => navigate(`/register?invite_token=${id}`)}
                className="w-full"
                size="lg"
              >
                Create Account
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
