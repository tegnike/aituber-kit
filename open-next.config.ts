// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

const config = defineCloudflareConfig({});

// Next.jsのファイルトレースはnode条件で解決するため、
// esbuildもnode条件に合わせないとファイルが見つからないエラーになる
config.cloudflare = {
  useWorkerdCondition: false,
};

export default config;
