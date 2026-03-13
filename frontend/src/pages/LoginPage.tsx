import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SeedPhraseInput } from "@/components/Auth/SeedPhraseInput";
import { useAuthStore } from "@/stores/authStore";
import {
  deriveMasterSeed,
  deriveSigningKeyPair,
  deriveEncryptionKey,
  uint8ToBase64,
} from "@/services/crypto";

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser, setToken, setEncryptionKey } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (seedPhrase: string) => {
    setLoading(true);
    setError("");

    try {
      const masterSeed = deriveMasterSeed(seedPhrase);
      const { publicKey } = deriveSigningKeyPair(masterSeed);
      const encKey = await deriveEncryptionKey(masterSeed);
      const publicKeyB64 = uint8ToBase64(publicKey);

      // In production:
      // 1. api.getChallenge(publicKeyB64)
      // 2. signChallenge(challenge, timestamp, privateKey)
      // 3. api.verify({ publicKey, challenge, timestamp, signature })

      // Demo: simulate successful login
      setUser({
        id: crypto.randomUUID(),
        publicKey: publicKeyB64,
        createdAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        inviteCount: 0,
      });
      setToken("demo-jwt-token");
      setEncryptionKey(encKey);
      navigate("/");
    } catch {
      setError("Failed to sign in. Please check your seed phrase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-neon-500 text-glow mb-1">
            havesmashed
          </h1>
          <p className="text-dark-400 text-sm">
            Your anonymous travel map
          </p>
        </div>

        <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
          <SeedPhraseInput onSubmit={handleLogin} loading={loading} />
          {error && (
            <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
          )}
        </div>

        <p className="text-center text-dark-400 text-sm mt-6">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="text-neon-500 hover:text-neon-400 transition-colors"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
