import { auth } from "@/auth";
import { Navigation } from "@/components/navigation";
import { MobileBottomNav } from "@/components/navigation/mobile-bottom-nav";
import { ConditionalNavigation } from "@/components/navigation/conditional-navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { AnalyticsProvider } from "@/lib/analytics/analytics-provider";
import { NotificationProvider } from "@/lib/notifications/notification-provider";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { JsonLd } from "@/components/seo/json-ld";
import {
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/structured-data";
import { SessionProvider } from "next-auth/react";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import Script from "next/script";
import "./globals.css";
import { ToploaderProvider } from "@/components/shared/toploader-provider";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "PalmTechnIQ — Learn a Skill, Teach a Skill, Get Paid",
    template: "%s | PalmTechnIQ",
  },
  description:
    "Learn any skill — tailoring, auto repair, catering, design, coding and AI. Or teach what you already know and earn from it. Courses, mentorship, certificates.",
  applicationName: "PalmTechnIQ",
  keywords: [
    "PalmTechnIQ",
    // Broad intent — the platform is for any skill, not only technical ones.
    "learn a skill online",
    "teach online and earn",
    "sell your course online",
    "online courses Nigeria",
    "vocational skills training",
    "artisan training",
    "tailoring course",
    "auto repair course",
    // Technical intent retained — these are still core categories.
    "AI courses",
    "artificial intelligence course",
    "cybersecurity course",
    "cybersecurity training Nigeria",
    "web development",
    "data science",
    "online mentorship",
    "e-learning platform",
  ],
  authors: [{ name: "PalmTechnIQ Team" }, { name: "Ignatius Emeka Joshua" }],
  creator: "PalmTechnIQ",
  publisher: "PalmTechnIQ",
  category: "education",
  icons: {
    icon: "/assets/standalone.png",
    apple: "/assets/standalone.png",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PalmTechnIQ - Advanced E-Learning Platform",
    description:
      "Learn in-demand technical skills with practical courses, expert guidance, and a modern learning experience.",
    url: SITE_URL,
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
  other: {
    "theme-color": "#10b981",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
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
  return (
    <SessionProvider session={session}>
      <html lang="en" suppressHydrationWarning>
        <head>
          <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        </head>
        <body
          className={`${inter.className} bg-gray-900 text-white min-h-screen`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange>
            {/* ensure hooks like useSearchParams are inside a suspense boundary */}
            <Suspense fallback={null}>
              <AnalyticsProvider>
                <NotificationProvider>
                  <ToploaderProvider
                    color="linear-gradient(90deg, #00343d 0%, #27ba55 50%, #000000 100%)"
                    height={4}
                    showSpinner={false}
                    crawlSpeed={150}
                    speed={300}>
                    <div className="flex flex-col min-h-screen">
                      <ConditionalNavigation>
                        <Navigation />
                      </ConditionalNavigation>
                      <main className="flex-1">
                        <SmoothScrollProvider>{children}</SmoothScrollProvider>
                      </main>

                      <ConditionalNavigation>
                        <MobileBottomNav />
                      </ConditionalNavigation>
                    </div>
                  </ToploaderProvider>
                  <Toaster richColors />
                </NotificationProvider>
              </AnalyticsProvider>
            </Suspense>
          </ThemeProvider>
          {/*
            Third-party tags, loaded through next/script rather than raw
            <script> tags in <head>.

            They were `async`, but async only frees the download — their code
            still ran during page load, competing with hydration for the main
            thread. On a mid-range phone the Facebook Pixel alone blocked it for
            ~540ms and gtag for ~310ms, on a page whose main image took 7.2s.

            All three libraries are lazyOnload, which waits for the page to go
            idle. GA was first tried as afterInteractive — the case the Next
            docs name for analytics — but for a script with a `src` that adds a
            high-priority preload, and 172KB of gtag.js competing with the first
            paint pushed it from 1.2s to 3.5s on a throttled phone. Measured, not
            assumed; see the commit.

            GA's tiny inline stub still runs early (it has no `src`, so nothing
            is preloaded). It defines `gtag()` and `dataLayer`, so every call
            made before gtag.js arrives — the config, the page_view, any app
            event — is queued and sent once it loads, rather than dropped.

            The cost: a visitor who leaves before the page goes idle may not be
            counted. The Pixel and Mixpanel snippets carry their own stubs; any
            app call before they load is guarded (`if (window.fbq)`) and
            dropped, never thrown.

            Inline code is passed as children, not dangerouslySetInnerHTML: the
            content is ours and constant apart from build-time env values.

            Mixpanel's vendor snippet chose its CDN URL protocol-relatively,
            which resolves to http:// on the http dev server; the CSP only
            allows https://cdn.mxpnl.com, so Mixpanel was blocked in local dev
            and had never actually run there. Pinned to https, which is what
            production already resolved to.

            Script ids must never match a global these snippets rely on. An
            element with an id becomes a window property of that name, so
            id="mixpanel" made `window.mixpanel` the <script> element itself;
            the snippet read it as its own queue and `mixpanel.track()` threw
            "b.push is not a function". Hence mixpanel-init, not mixpanel.
          */}
          {process.env.NEXT_PUBLIC_GA_ID && (
            <>
              <Script id="gtag-init" strategy="afterInteractive">
                {`
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                  });
                `}
              </Script>
              <Script
                id="gtag-src"
                src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                strategy="lazyOnload"
              />
            </>
          )}
          {process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID && (
            <Script id="facebook-pixel" strategy="lazyOnload">
              {`
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
              `}
            </Script>
          )}
          {process.env.NEXT_PUBLIC_MIXPANEL_TOKEN && (
            <Script id="mixpanel-init" strategy="lazyOnload">
              {`
                (function(c,a){if(!a.__SV){var b=window;try{var d,m,j,k=b.location,f=k.hash;d=function(a,b){return(m=a.match(RegExp(b+"=([^&]*)")))?m[1]:null};f&&d(f,"state")&&(j=JSON.parse(decodeURIComponent(d(f,"state"))),"mpeditor"===j.action&&(b.sessionStorage.setItem("_mpcehash",f),history.replaceState(j.desiredHash||"",c.title,k.pathname+k.search)))}catch(n){}var l,h;window.mixpanel=a;a._i=[];a.init=function(b,d,g){function c(b,i){var a=i.split(".");2==a.length&&(b=b[a[0]],i=a[1]);b[i]=function(){b.push([i].concat(Array.prototype.slice.call(arguments,0)))}}var e=a;"undefined"!==typeof g?e=a[g]=[]:g="mixpanel";e.people=e.people||[];e.toString=function(b){var a="mixpanel";"mixpanel"!==g&&(a+="."+g);b||(a+=" (stub)");return a};e.people.toString=function(){return e.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");for(h=0;h<l.length;h++)c(e,l[h]);var f="set set_once union unset remove delete".split(" ");e.get_group=function(){function a(c){b[c]=function(){call2_args=arguments;call2=[c].concat(Array.prototype.slice.call(call2_args,0));e.push([d,call2])}}for(var b={},d=["get_group"].concat(Array.prototype.slice.call(arguments,0)),c=0;c<f.length;c++)a(f[c]);return b};a._i.push([b,d,g])};a.__SV=1.2;b=c.createElement("script");b.type="text/javascript";b.async=!0;b.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";d=c.getElementsByTagName("script")[0];d.parentNode.insertBefore(b,d)}})(document,window.mixpanel||[]);
                mixpanel.init('${process.env.NEXT_PUBLIC_MIXPANEL_TOKEN}', {debug: ${
                  process.env.NODE_ENV === "development" ? "true" : "false"
                }});
              `}
            </Script>
          )}
        </body>
      </html>
    </SessionProvider>
  );
}
