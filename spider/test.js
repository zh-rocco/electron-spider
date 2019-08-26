const path = require("path");
const { fork } = require("child_process");

function runScriptWithChildProcess(script, args = []) {
  const child = fork(script, args);

  return new Promise((resolve) => {
    child.on("error", (err) => {
      resolve([err]);
    });

    child.on("exit", (code) => {
      global.console.log(`stop child_process: "${script}" with ${code}`);
    });

    child.on("message", ({ data }) => {
      resolve([null, data]);
    });
  });
}

async function main(id) {
  const [err, data] = await runScriptWithChildProcess(path.resolve(__dirname, "./main"), [id]);
  console.log(err, data);
}

main();
