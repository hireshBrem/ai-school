import { graph } from "./agent.ts";

export async function main() {
  const result = await graph.invoke({
    input: "Introduction to Machine Learning for Beginners",
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);