import { logger } from "../utils/logger.js";
import { runScan } from "./runScan.js";

export async function runPaper(): Promise<void> {
  try {
    await runScan("paper");
    logger.info("paper.tick.complete");
  } catch (err) {
    logger.error({ err }, "paper.failed_safe");
  }
}
