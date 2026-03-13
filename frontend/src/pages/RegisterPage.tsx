import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SeedPhraseDisplay } from "@/components/Auth/SeedPhraseDisplay";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/stores/authStore";
import {
  generateSeedPhrase,
  deriveMasterSeed,
  deriveSigningKeyPair,
  deriveEncryptionKey,
  uint8ToBase64,
} from "@/services/crypto";

type Step = "generate" | "display" | "done";

export function RegisterPage() {
  const navigate = useNavigate();
  const { setUser, setToken, setEncryptionKey } = useAuthStore();
  const [step, setStep] = useState<Step>("generate");
  const [seedPhrase, setSeedPhrase] = useState("");
  const [error, setError] = useState("");

  const handleGenerate = () => {
    const phrase = generateSeedPhrase();
    setSeedPhrase(phrase);
    setStep("display");
  };

  const handleConfirm = async () => {
    try {
      const masterSeed = deriveMasterSeed(seedPhrase);
      const { publicKey } = deriveSigningKeyPair(masterSeed);
      const encKey = await deriveEncryptionKey(masterSeed);
      const publicKeyB64 = uint8ToBase64(publicKey);

      // In production: api.register(publicKeyB64)
      // Then auto-login via challenge-response

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
      setError("Registration failed. Please try again.");
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
            Create your anonymous account
          </p>
        </div>

        <div className="bg-dark-800 border border-dark-600 rounded-xl p-6">
          {step === "generate" && (
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Anonymous Registration
                </h2>
                <p className="text-sm text-dark-300">
                  No email, no password. We'll generate a 12-word recovery
                  phrase that acts as your identity.
                </p>
              </div>
              <Button onClick={handleGenerate} className="w-full" size="lg">
                Generate Recovery Phrase
              </Button>
            </div>
          )}

          {step === "display" && (
            <SeedPhraseDisplay
              seedPhrase={seedPhrase}
              onConfirm={handleConfirm}
            />
          )}

          {error && (
            <p className="text-red-400 text-sm mt-3 text-center">{error}</p>
          )}
        </div>

        <p className="text-center text-dark-400 text-sm mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-neon-500 hover:text-neon-400 transition-colors"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
