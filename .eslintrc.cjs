/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
  },
  extends: [
    "eslint:recommended",
  ],
  overrides: [
    {
      files: ["**/*.ts"],
      parser: "@typescript-eslint/parser",
      plugins: ["@typescript-eslint"],
      extends: [
        "plugin:@typescript-eslint/recommended",
      ],
      rules: {
        "@typescript-eslint/no-explicit-any": "warn",
        "@typescript-eslint/ban-ts-comment": ["warn", { "ts-expect-error": "allow-with-description" }],
      },
    },
  ],
};


