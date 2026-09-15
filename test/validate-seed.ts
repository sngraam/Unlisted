// Fast dataset check that does not need a running database.
import { readFileSync } from "node:fs";
import { seedDataSchema } from "./seed-contract";

const data = seedDataSchema.parse(
  JSON.parse(readFileSync("../test/seed-data.json", "utf8")),
);
console.log(
  `PASS: dataset has ${data.products.length} products, ${data.products.reduce((sum, item) => sum + item.variants.length, 0)} variants and every frontend field is valid.`,
);
