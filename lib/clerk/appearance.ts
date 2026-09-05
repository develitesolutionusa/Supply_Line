export const clerkAppearance = {
  variables: {
    colorPrimary: "#2563EB",
    colorForeground: "#0F172A",
    colorBackground: "#FFFFFF",
    colorMutedForeground: "#475569",
    colorInput: "#FFFFFF",
    colorInputForeground: "#0F172A",
    borderRadius: "0.5rem",
    fontFamily: "var(--font-geist-sans)",
  },
  elements: {
    card: {
      boxShadow: "none",
      border: "1px solid #E2E8F0",
    },
    formButtonPrimary: {
      backgroundColor: "#2563EB",
      transition: "background-color 180ms ease, box-shadow 180ms ease",
      "&:hover": {
        backgroundColor: "#1D4ED8",
        boxShadow: "0 0 22px rgb(37 99 235 / 0.5), 0 8px 18px rgb(37 99 235 / 0.3)",
      },
    },
    footerActionLink: {
      color: "#1D4ED8",
    },
  },
};
