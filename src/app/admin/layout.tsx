import { Geist } from "next/font/google";
import "../globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Stagevio Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-stone-100 font-sans text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
