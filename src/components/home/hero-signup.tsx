"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuthStore } from "@/src/stores/auth-store";

export const HeroSignup = () => {
  const [value, setValue] = useState("");
  const router = useRouter();
  const setStoreEmail = useAuthStore((state) => state.setEmail);
  const setStorePhone = useAuthStore((state) => state.setPhone);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = value.trim();
    if (!input) return;
    if (input.includes("@")) {
      setStoreEmail(input);
    } else {
      setStorePhone(input);
    }
    router.push("/auth/signup");
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full min-w-0 items-center gap-3">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter your mail/number"
        className="text-sm placeholder:text-gray-2 min-w-0 flex-1 px-4 bg-gray-3 focus:shadow-2 focus:outline-0 duration-200 border border-primary h-10 md:h-51px rounded-xl text-white"
      />
      <button
        type="submit"
        className="bg-primary text-black md:h-51px h-10 rounded-lg md:text-base text-sm md:rounded-2xl font-medium px-4 md:px-7 shrink-0"
      >
        Sign Up
      </button>
    </form>
  );
};