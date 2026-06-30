import path from "node:path";
import { buildConfig } from "./config";
import { createApp } from "./app";
import { openProgressStore } from "./store/progress";

const cfg = buildConfig();
const store = openProgressStore(path.join(cfg.stateDir, "progress.db"));
const app = createApp(cfg, store);

app.listen(cfg.port, cfg.host, () => {
  console.log(`\n  share-net  →  serving ${cfg.shareDir}`);
  console.log(`  local:   http://localhost:${cfg.port}`);
  console.log(`  network: http://<your-lan-ip>:${cfg.port}`);
  console.log(`  login:   user "${cfg.user}"`);
  if (cfg.usingDefaultPass) {
    console.log('  ! SHARE_PASS is the default "changeme" — set it in .env');
  }
  if (cfg.usingEphemeralSecret) {
    console.log("  ! SESSION_SECRET not set — logins reset on restart. Set it in .env");
  }
  console.log("");
});
