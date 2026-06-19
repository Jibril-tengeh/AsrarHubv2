export default async function run() {
  try {
    const res = await fetch("http://api.alquran.cloud/v1/search/الرحيم/all/ar");
    const data = await res.json();
    console.log("Count for الرحمن:", data.data.count);
  } catch(e) {
    console.error(e);
  }
}
run();
