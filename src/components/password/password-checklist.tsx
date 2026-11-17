"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { BiCheck } from "react-icons/bi";

export type PasswordCriteria = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
};

export const getPasswordCriteria = (password: string): PasswordCriteria => ({
  length: password.length >= 8,
  upper: /[A-Z]/.test(password),
  lower: /[a-z]/.test(password),
  number: /[0-9]/.test(password),
  special: /[@$!%*?&#]/.test(password),
});

export const getPasswordStrength = (criteria: PasswordCriteria) =>
  Object.values(criteria).filter(Boolean).length;

export const isPasswordValid = (password: string) =>
  Object.values(getPasswordCriteria(password)).every(Boolean);

const STRENGTH_COLORS = [
  "bg-error-1",
  "bg-error-1",
  "bg-yellow-500",
  "bg-success-6",
  "bg-success-6",
];

type PasswordChecklistProps = {
  password: string;
  className?: string;
};

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({
  password,
  className = "flex flex-col gap-2",
}) => {
  const t = useTranslations("Security");
  const criteria = useMemo(() => getPasswordCriteria(password), [password]);
  const strength = getPasswordStrength(criteria);

  if (!password) return null;

  const strengthLabels = [
    t("passwordWeak"),
    t("passwordWeak"),
    t("passwordFair"),
    t("passwordStrong"),
    t("passwordVeryStrong"),
  ];
  const color = STRENGTH_COLORS[Math.max(0, strength - 1)];

  return (
    <div className={className}>
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`flex-1 rounded-full transition-colors ${
              strength >= level ? color : "bg-gray-7"
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className={color.replace("bg-", "text-")}>
          {strength > 0 ? strengthLabels[strength - 1] : ""}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Criterion ok={criteria.length} label={t("passwordChars")} />
        <Criterion ok={criteria.upper} label={t("passwordUppercase")} />
        <Criterion ok={criteria.lower} label={t("passwordLowercase")} />
        <Criterion ok={criteria.number} label={t("passwordNumber")} />
        <Criterion ok={criteria.special} label={t("passwordSpecial")} />
      </div>
    </div>
  );
};

const Criterion: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
  <div
    className={`flex items-center gap-1.5 text-xs ${
      ok ? "text-success-6" : "text-white/40"
    }`}
  >
    <BiCheck size={16} /> {label}
  </div>
);
