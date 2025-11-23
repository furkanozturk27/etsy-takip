"use client";

import { useState, useEffect, useRef } from "react";
import { Lock, Unlock } from "lucide-react";

const CORRECT_PIN = "1923"; // ŞİFRE BURADA

export default function PinGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const auth = sessionStorage.getItem("is_authenticated");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleInput = (index: number, value: string) => {
    if (value.length > 1) value = value[0]; // Sadece tek karakter
    if (!/^\d*$/.test(value)) return; // Sadece rakam

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);

    // Otomatik ilerleme
    if (value !== "" && index < 3) {
      inputs.current[index + 1]?.focus();
    }

    // Şifre Kontrolü
    const enteredPin = newPin.join("");
    if (enteredPin.length === 4) {
      if (enteredPin === CORRECT_PIN) {
        sessionStorage.setItem("is_authenticated", "true");
        setTimeout(() => setIsAuthenticated(true), 300); // Hafif bekleme efekti
      } else {
        setError(true);
        // Hata efektinden sonra temizle
        setTimeout(() => {
          setPin(["", "", "", ""]);
          inputs.current[0]?.focus();
          setError(false);
        }, 1000);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  if (loading) return null; // Hydration fix

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020817]/95 backdrop-blur-xl animate-in fade-in duration-500">
        <div className="w-full max-w-sm p-8 space-y-8 text-center">
          
          <div className="space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-primary/20 shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)]">
              {error ? <Lock className="w-8 h-8 text-red-500" /> : <Unlock className="w-8 h-8 text-primary" />}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Etsy Manager
            </h1>
            <p className="text-sm text-slate-400">
              Devam etmek için erişim kodunu girin.
            </p>
          </div>

          <div className={`flex justify-center gap-4 ${error ? 'animate-shake' : ''}`}>
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputs.current[index] = el; }}
                type="password" // Nokta şeklinde gözüksün diye (inputMode numeric mobilde klavyeyi açar)
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInput(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`
                  w-14 h-16 text-center text-2xl font-bold bg-slate-900/50 
                  border-2 rounded-xl outline-none transition-all duration-200
                  ${error 
                    ? 'border-red-500 text-red-500 shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)]' 
                    : 'border-slate-800 focus:border-primary focus:shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] text-white'
                  }
                `}
              />
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm font-medium animate-pulse">
              Hatalı kod. Tekrar deneyin.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

