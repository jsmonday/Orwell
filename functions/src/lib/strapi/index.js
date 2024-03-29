const axios     = require("axios");
const Strapi    = require("strapi-sdk-javascript").default;
                  require("dotenv").config();
const endpoint  = process.env.JSM_ENDPOINT;

const strapi = new Strapi(endpoint);

async function getJWT() {
  try {

    const { jwt } = await strapi.login(process.env.JSM_USERNAME, process.env.JSM_PASSWORD);
    return jwt;

  } catch (err) {
    console.log(err)
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