const Client = require("./client");

async function main() {
  let client = new Client();

  await client.init({
    type: "preset",
    preset: "chrome83",
  });

  let res = await client.request({
    url: "https://www.axs.com/search/autocomplete?term=flight&rows=100&country=US&latitude=34.05&longitude=-118.24",
    method: "GET",
    headers: [
      ['accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'],
      ['accept-encoding', 'gzip, deflate, br'],
      ['accept-language', 'en-US,en;q=0.9'],
      ['cache-control', 'max-age=0'],
      ['sec-ch-ua', '" Not;A Brand";v="99", "Google Chrome";v="97", "Chromium";v="97"'],
      ['sec-ch-ua-mobile', '?0'],
      ['sec-ch-ua-platform', '"Windows"'],
      ['sec-fetch-dest', 'document'],
      ['sec-fetch-mode', 'navigate'],
      ['sec-fetch-site', 'none'],
      ['sec-fetch-user', '?1'],
      ['upgrade-insecure-requests', '1'],
      ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36']
    ],
  });

  console.log(res);
}

main();
