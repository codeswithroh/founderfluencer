import { Inter, Instrument_Serif, Caveat } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const instrumentSerif = Instrument_Serif({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-serif",
})
const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-cursive",
})

export const metadata = {
  title: "FoundrProof — Discover Your Founder Potential",
  description:
    "Analyze any X username and discover their founder potential. Generate a shareable founder card and find your ideal cofounder on cofoundrs.fun.",
  openGraph: {
    title: "FoundrProof",
    description: "Discover your founder potential. Share your founder card.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FoundrProof",
    description: "Discover your founder potential. Share your founder card.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", inter.variable, instrumentSerif.variable, caveat.variable, "font-sans")}
    >
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
