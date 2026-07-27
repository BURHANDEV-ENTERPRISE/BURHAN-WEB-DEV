import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = [
  {
    ignores: [
      "out/**",
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      ".MOP/**",
      ".claude/**",
      ".agents/**",
      ".codex/**",
      ".gemini/**",
      "bin/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
