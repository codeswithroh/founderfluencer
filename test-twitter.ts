import { getUserInfo, getLastTweets } from "./lib/twitter";

async function run() {
  console.log("Fetching profile...");
  const p = await getUserInfo("codeswithroh");
  console.log("Profile:", p);
  
  console.log("Fetching tweets...");
  const t = await getLastTweets("codeswithroh");
  console.log("Tweets:", JSON.stringify(t, null, 2));
}

run().catch(console.error);
