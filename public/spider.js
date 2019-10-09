const fs = require("fs");
const path = require("path");
const https = require("https");

const srcRegex = /https([^"]*)/gi;

const request = (postId) =>
  new Promise((resolve, reject) => {
    if (!postId) {
      reject(new Error(`Expected postId but received ${postId}`));
    }

    https
      .get(`https://m.toutiao.com/${postId}/info/`, (res) => {
        const { statusCode } = res;
        const contentType = res.headers["content-type"];

        let error;

        if (statusCode !== 200) {
          error = new Error("Request Failed.\n", `Status Code: ${statusCode}`);
        } else if (!/^application\/json$/.test(contentType)) {
          error = new Error("Invalid content-type.\n", `Expected application/json but received ${contentType}`);
        }

        if (error) {
          console.error(error.message);
          reject(error);
          res.resume();
          return;
        }

        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          try {
            const parsedData = JSON.parse(rawData);
            resolve(parsedData);
          } catch (e) {
            console.error(e.message);
            reject(error);
          }
        });
      })
      .on("error", (e) => {
        console.error(`Got error: ${e.message}`);
        reject(e);
      });
  });

const scratch = (content) => content.match(srcRegex);

const download = async (url, dirPath, imageName) => {
  const file = fs.createWriteStream(path.join(dirPath, `./${imageName}.jpg`));

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        res.pipe(file);
        res.on("end", () => {
          resolve();
        });
      })
      .on("error", (e) => {
        console.error(`Got error: ${e.message}`);
        reject();
      });
  });
};

const mkdir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
};

module.exports = async function main({ dir, id }) {
  if (!id || id === "undefined") return;

  console.log("query:", dir, id);

  try {
    const {
      data: { title, content }
    } = await request(id);

    const images = scratch(content);
    console.log("images:", images.length);
    const targetPath = path.resolve(dir || __dirname, title);

    mkdir(targetPath);

    // await Promise.all(
    //   images.map(async (image, idx) => {
    //     console.log(idx, image);
    //     return download(image, targetPath, (idx + 1 + "").padStart(4, 0));
    //   })
    // );

    let i = 0;

    for (const image of images) {
      console.log(i, image);
      await download(image, targetPath, (i + 1 + "").padStart(4, 0));
      i++;
    }

    return images;
  } catch (e) {
    throw new Error("failure");
  }
};
