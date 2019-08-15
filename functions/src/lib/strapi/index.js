const axios     = require("axios");
                  require("dotenv").config();
const endpoint  = process.env.JSM_ENDPOINT;

async function getJWT() {
  try {

    const { data: { jwt }} = await axios.post(`${endpoint}/auth/local`, {
      identifier: process.env.JSM_USERNAME,
      password:   process.env.JSM_PASSWORD
    });

    return jwt;

  } catch (err) {
    console.log("Unable to get JWT");
  }
}

async function updateArticleReads(jwt, articleId, articleReads) {

  try {

    await axios({
      method: "put",
      url: `${endpoint}/articles/${articleId}`,
      headers: { Authorization: `Bearer ${jwt}` },
      data: { articleReads }
    });

    console.log(`Article ${articleId} updated with ${articleReads} reads.`);

  } catch (err) {
    console.log(`Unable to update article ${articleId}`);
  }

}

module.exports = {
  getJWT,
  updateArticleReads
}