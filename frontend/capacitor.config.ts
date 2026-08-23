import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.mykasa.app",
  appName: "MyKASA",
  webDir: "out",
  server: {
    // In development with live-reload, point to the Next.js dev server.
    // Comment this out for production builds.
    // url: "http://192.168.x.x:3000",
    // cleartext: true,
    androidScheme: "https",
  },
  android: {
    buildOptions: {
      releaseType: "APK",
    },
  },
};

export default config;
