import { useState } from "react";
import { Shield, Trash2, Key } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div className="min-h-screen p-4 md:p-8 pb-20 md:pb-8">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <div className="space-y-4 max-w-lg">
        {/* Account Info */}
        <Card>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <Key size={16} className="text-neon-500" />
            Account
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-dark-400">Public Key</span>
              <span className="text-dark-200 font-mono text-xs truncate max-w-[200px]">
                {user?.publicKey}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-400">Member Since</span>
              <span className="text-dark-200">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"}
              </span>
            </div>
          </div>
        </Card>

        {/* Privacy */}
        <Card>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
            <Shield size={16} className="text-accent-cyan" />
            Default Privacy
          </h3>
          <div className="space-y-3">
            {[
              { label: "Share Countries", defaultChecked: true },
              { label: "Share Cities", defaultChecked: false },
              { label: "Share Dates", defaultChecked: false },
              { label: "Share Stats", defaultChecked: true },
            ].map(({ label, defaultChecked }) => (
              <label
                key={label}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-sm text-dark-200">{label}</span>
                <input
                  type="checkbox"
                  defaultChecked={defaultChecked}
                  className="accent-neon-500"
                />
              </label>
            ))}
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-900/50">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-red-400 mb-3">
            <Trash2 size={16} />
            Danger Zone
          </h3>

          {showDeleteConfirm ? (
            <div className="space-y-3">
              <p className="text-sm text-dark-300">
                Your account will be deactivated and permanently deleted after
                30 days. This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-500 shadow-none"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-dark-400">Delete your account</p>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-400 hover:text-red-300"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Delete
              </Button>
            </div>
          )}
        </Card>

        <Button
          variant="secondary"
          className="w-full"
          onClick={logout}
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
