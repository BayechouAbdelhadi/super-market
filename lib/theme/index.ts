export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryText: string;
  background: string;
  surface: string;
  surfaceHover: string;
  text: string;
  textMuted: string;
  border: string;
  borderHover: string;
  success: string;
  warning: string;
  danger: string;
  bronze: string;
  silver: string;
  gold: string;
  vip: string;
}

export interface ThemeRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  button: string;
  input: string;
  card: string;
  dialog: string;
}

export interface ThemeConfig {
  name: string;
  label: string;
  colors: ThemeColors;
  radius: ThemeRadius;
  typography: {
    fontFamily: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
  };
}

export const themes: Record<string, ThemeConfig> = {
  // Theme default: Airbnb signature design language (§ 10, § 11, § 12)
  // Rausch coral primary, crisp dark charcoal typography (#222222), soft fog muted text (#717171), hairline borders (#EBEBEB)
  airbnb: {
    name: "airbnb",
    label: "Airbnb Signature",
    colors: {
      primary: "#FF385C", // Airbnb Rausch Coral
      primaryHover: "#E00B41", // Deepened coral on hover
      primaryText: "#FFFFFF",
      background: "#FFFFFF", // Crisp Airbnb white canvas
      surface: "#FFFFFF",
      surfaceHover: "#F7F7F7", // Airbnb light surface hover
      text: "#222222", // Airbnb Babu dark charcoal
      textMuted: "#717171", // Airbnb Hof fog muted grey
      border: "#EBEBEB", // Airbnb hairline border
      borderHover: "#B0B0B0", // Interactive hover border
      success: "#008A05", // Airbnb green
      warning: "#E07A5F",
      danger: "#C13515",
      bronze: "#A86326",
      silver: "#717171",
      gold: "#C28B1E",
      vip: "#222222",
    },
    radius: {
      sm: "4px",
      md: "8px",
      lg: "12px",
      xl: "16px",
      button: "12px",
      input: "12px",
      card: "16px",
      dialog: "20px",
    },
    typography: {
      fontFamily:
        "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    },
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "32px",
      "2xl": "48px",
    },
  },

  // Alias default to Airbnb
  default: {
    name: "default",
    label: "Airbnb Default",
    colors: {
      primary: "#FF385C",
      primaryHover: "#E00B41",
      primaryText: "#FFFFFF",
      background: "#FFFFFF",
      surface: "#FFFFFF",
      surfaceHover: "#F7F7F7",
      text: "#222222",
      textMuted: "#717171",
      border: "#EBEBEB",
      borderHover: "#B0B0B0",
      success: "#008A05",
      warning: "#E07A5F",
      danger: "#C13515",
      bronze: "#A86326",
      silver: "#717171",
      gold: "#C28B1E",
      vip: "#222222",
    },
    radius: {
      sm: "4px",
      md: "8px",
      lg: "12px",
      xl: "16px",
      button: "12px",
      input: "12px",
      card: "16px",
      dialog: "20px",
    },
    typography: {
      fontFamily:
        "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    },
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "32px",
      "2xl": "48px",
    },
  },

  // Theme warm (Terracotta & cream preset per § 13)
  warm: {
    name: "warm",
    label: "Warm Terracotta",
    colors: {
      primary: "#C2410C", // Terracotta
      primaryHover: "#9A3412",
      primaryText: "#FFFFFF",
      background: "#FDFBF7", // Warm cream
      surface: "#FFFFFF",
      surfaceHover: "#FCF8F2",
      text: "#292524",
      textMuted: "#78716C",
      border: "#EDE8E1",
      borderHover: "#DCD4C7",
      success: "#15803D",
      warning: "#B45309",
      danger: "#B91C1C",
      bronze: "#9A3412",
      silver: "#64748B",
      gold: "#B45309",
      vip: "#6B21A8",
    },
    radius: {
      sm: "6px",
      md: "10px",
      lg: "14px",
      xl: "18px",
      button: "14px",
      input: "14px",
      card: "18px",
      dialog: "24px",
    },
    typography: {
      fontFamily: "var(--font-geist-sans), sans-serif",
    },
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "32px",
      "2xl": "48px",
    },
  },

  // Theme emerald (Classic supermarket fresh green)
  emerald: {
    name: "emerald",
    label: "Fresh Emerald",
    colors: {
      primary: "#059669",
      primaryHover: "#047857",
      primaryText: "#FFFFFF",
      background: "#FAFAF9",
      surface: "#FFFFFF",
      surfaceHover: "#F5F5F4",
      text: "#1C1917",
      textMuted: "#78716C",
      border: "#E7E5E4",
      borderHover: "#D6D3D1",
      success: "#059669",
      warning: "#D97706",
      danger: "#DC2626",
      bronze: "#B45309",
      silver: "#64748B",
      gold: "#D97706",
      vip: "#7C3AED",
    },
    radius: {
      sm: "4px",
      md: "8px",
      lg: "12px",
      xl: "16px",
      button: "12px",
      input: "12px",
      card: "16px",
      dialog: "20px",
    },
    typography: {
      fontFamily: "var(--font-geist-sans), sans-serif",
    },
    spacing: {
      xs: "4px",
      sm: "8px",
      md: "16px",
      lg: "24px",
      xl: "32px",
      "2xl": "48px",
    },
  },
};

export const activeTheme: ThemeConfig = themes.airbnb;
