import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

/** README_11: ban raw hex + default Tailwind color utilities in TSX. */
const TW_COLOR =
  "\\b(text|bg|border|ring|from|to|via|outline|divide|decoration|caret|accent|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b";

export default tseslint.config(
  {
    ignores: [".next/**", "node_modules/**", "scripts/**", "next.config.ts", "next-env.d.ts", "src/lib/api/schema.d.ts"]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^#[0-9A-Fa-f]{3,8}$/]",
          message: "Raw hex literal forbidden. Use Obsidian & Gold tokens (e.g. var(--gold-500))."
        },
        {
          selector: "TemplateElement[value.raw=/#[0-9A-Fa-f]{3,8}/]",
          message: "Raw hex literal forbidden. Use Obsidian & Gold tokens (e.g. var(--gold-500))."
        },
        {
          selector: `Literal[value=/${TW_COLOR}/]`,
          message: "Default Tailwind color forbidden. Use token classes or CSS variables."
        },
        {
          selector: `TemplateElement[value.raw=/${TW_COLOR}/]`,
          message: "Default Tailwind color forbidden. Use token classes or CSS variables."
        }
      ]
    }
  }
);
