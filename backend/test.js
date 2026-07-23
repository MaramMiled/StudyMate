import { getEmbedding } from "./utils/embeddings.js";

const test = async () => {
  const embedding = await getEmbedding(
    "Newton's first law states that objects remain at rest unless acted upon by a force."
  );

  console.log("Embedding size:", embedding.length);
  console.log("First values:", embedding.slice(0, 5));
};

test();