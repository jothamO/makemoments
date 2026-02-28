import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import security from "eslint-plugin-security";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "convex/_generated",
      "scripts",
      "inject-stars.mjs",
      "convex/test_query.ts",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      security: security,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...security.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-empty-object-type": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-require-imports": "warn",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
    },
  },
);
