import type { NextConfig } from "next";

import localConfig from "./next.config-local";
import liveConfig from "./next.config-live";

const nextConfig: NextConfig =
  process.env.NEXT_CONFIG_ENV === "live"
    ? liveConfig
    : localConfig;

export default nextConfig;