import fs from "fs";

async function run() {
  try {
    const res = await fetch("http://api.alquran.cloud/v1/search/%D8%A7%D9%84%D8%B1%D8%AD%D9%8A%D9%85/all/ar");
    const data = await res.json();
    console.log("Count:", data.data.count);
    const verses = data.data.matches.map((m: any) => `${m.surah.number}:${m.numberInSurah}`);
    console.log("Sample verses:", verses.slice(0, 5));
  } catch(e) {
    console.error(e);
  }
}

run();
