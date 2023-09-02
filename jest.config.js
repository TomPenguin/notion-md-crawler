export default {
  resolver: "ts-jest-resolver",
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "esbuild-jest",
      { sourceMap: true, format: "cjs", target: "es2022" },
    ],
  },
};
