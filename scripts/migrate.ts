import "dotenv/config";
import { migrate } from "../lib/schema";

migrate();
console.log("SQLite migration completed.");
