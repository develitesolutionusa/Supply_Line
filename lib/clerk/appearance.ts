export const clerkAppearance = {
  variables: {
    colorPrimary: "#0F172A",
    colorForeground: "#0F172A",
    colorBackground: "#FFFFFF",
    colorMutedForeground: "#64748B",
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
      backgroundColor: "#0F172A",
      "&:hover": {
        backgroundColor: "#1E293B",
      },
    },
    footerActionLink: {
      color: "#0284C7",
    },
  },
};
