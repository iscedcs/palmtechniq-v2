import { auth } from "@/auth";
import { Navigation } from "@/components/navigation";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { AnalyticsProvider } from "@/lib/analytics/analytics-provider";
import { WebSocketProvider } from "@/lib/websocket/websocket-provider";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Inter } from "next/font/google";
import type React from "react";
import { Suspense } from "react";
import "./globals.css";
import { ToploaderProvider } from "@/components/shared/toploader-provider";
import { SocketInitializer } from "@/components/shared/web-socket-init";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "PalmTechnIQ - Advanced E-Learning Platform",
    template: "%s | PalmTechnIQ",
  },
  description:
    "PalmTechnIQ is an advanced e-learning platform for AI, web development, data science, and career-focused technical skills.",
  applicationName: "PalmTechnIQ",
  keywords: [
    "PalmTechnIQ",
    "e-learning platform",
    "online courses",
    "AI courses",
    "web development",
    "data science",
    "tech mentorship",
  ],
  authors: [{ name: "PalmTechnIQ Team" }],
  creator: "PalmTechnIQ",
  publisher: "PalmTechnIQ",
  category: "education",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://palmtechniq.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PalmTechnIQ - Advanced E-Learning Platform",
    description:
      "Learn in-demand technical skills with practical courses, expert guidance, and a modern learning experience.",
    url: "https://palmtechniq.com",
    siteName: "PalmTechnIQ",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "PalmTechnIQ Platform",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PalmTechnIQ - Advanced E-Learning Platform",
    description:
      "Learn in-demand technical skills with practical courses, expert guidance, and a modern learning experience.",
    images: ["/twitter-image"],
    site: "@palmtechniq",
    creator: "@palmtechniq",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "5HTHdwd5queZq2qykGMCxyAh-KM6-kvuOLwvoFZNzWo",
    yandex: "7c7c50ea0bb36790",
  },
};

export default async function MainRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let session = null;
  try {
    session = await auth();
  } catch {
    // During build (e.g. DATABASE_URL unset), auth() can throw; use null session so build completes.
  }
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PalmTechnIQ",
    url: "https://palmtechniq.com",
    email: "support@palmtechniq.com",
    logo: "https://palmtechniq.com/opengraph-image",
    sameAs: [],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PalmTechnIQ",
    url: "https://palmtechniq.com",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://palmtechniq.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <SessionProvider session={session}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(organizationJsonLd),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(websiteJsonLd),
            }}
          />

          {/* Google Analytics */}
          <script
            async
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                page_title: document.title,
                page_location: window.location.href,
              });
            `,
            }}
          />

          {/* Facebook Pixel */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}');
              fbq('track', 'PageView');
            `,
            }}
          />

          {/* Mixpanel */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
              (function(c,a){if(!a.__SV){var b=window;try{var d,m,j,k=b.location,f=k.hash;d=function(a,b){return(m=a.match(RegExp(b+"=([^&]*)")))?m[1]:null};f&&d(f,"state")&&(j=JSON.parse(decodeURIComponent(d(f,"state"))),"mpeditor"===j.action&&(b.sessionStorage.setItem("_mpcehash",f),history.replaceState(j.desiredHash||"",c.title,k.pathname+k.search)))}catch(n){}var l,h;window.mixpanel=a;a._i=[];a.init=function(b,d,g){function c(b,i){var a=i.split(".");2==a.length&&(b=b[a[0]],i=a[1]);b[i]=function(){b.push([i].concat(Array.prototype.slice.call(arguments,0)))}}var e=a;"undefined"!==typeof g?e=a[g]=[]:g="mixpanel";e.people=e.people||[];e.toString=function(b){var a="mixpanel";"mixpanel"!==g&&(a+="."+g);b||(a+=" (stub)");return a};e.people.toString=function(){return e.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");for(h=0;h<l.length;h++)c(e,l[h]);var f="set set_once union unset remove delete".split(" ");e.get_group=function(){function a(c){b[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));e.push([d,call2])}}for(var b={},d=["get_group"].concat(Array.prototype.slice.call(arguments,0)),c=0;c<f.length;c++)a(f[c]);return b};a._i.push([b,d,g])};a.__SV=1.2;b=c.createElement("script");b.type="text/javascript";b.async=!0;b.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===c.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";d=c.getElementsByTagName("script")[0];d.parentNode.insertBefore(b,d)}})(document,window.mixpanel||[]);
              mixpanel.init('${process.env.NEXT_PUBLIC_MIXPANEL_TOKEN}', {debug: ${
                process.env.NODE_ENV === "development" ? "true" : "false"
              }});
            `,
            }}
          />
        </head>
        <body
          className={`${inter.className} bg-gray-900 text-white min-h-screen`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange>
            <AnalyticsProvider>
              <WebSocketProvider>
                <SocketInitializer />
                <ToploaderProvider
                  color="linear-gradient(90deg, #00D4FF 0%, #8B5CF6 50%, #F472B6 100%)"
                  height={4}
                  showSpinner={false}
                  crawlSpeed={150}
                  speed={300}>
                  <Suspense fallback={null}>
                    <div className="flex flex-col min-h-screen">
                      <Navigation />
                      <main className="flex-1">{children}</main>

                      <MobileBottomNav />
                    </div>
                  </Suspense>
                  <Toaster richColors />
                </ToploaderProvider>
              </WebSocketProvider>
            </AnalyticsProvider>
          </ThemeProvider>
        </body>
      </html>
    </SessionProvider>
  );
}
