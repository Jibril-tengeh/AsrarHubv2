import fs from "fs";
import path from "path";

async function run() {
  const filePath = path.join(process.cwd(), "src/data/asmaUlHusna.ts");
  console.log("File path:", filePath);
}

run();
