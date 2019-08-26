const spider = require("./spider");

(async function main() {
  const { dir, id } = JSON.parse(process.argv[2]);
  console.log(process.argv, { dir, id });
  const data = await spider({ dir, id });
  process.send({ data });
  process.exit(0);
})();
