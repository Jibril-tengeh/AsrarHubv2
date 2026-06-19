import fs from "fs";

async function run() {
  // Read the original file
  const fileContent = fs.readFileSync("./src/data/asmaUlHusna.ts", "utf-8");
  
  // Extract the array using regex
  const regex = /export const asmaUlHusnaList: AsmaUlHusnaData\[\] = (\[[\s\S]*\]);/;
  const match = fileContent.match(regex);
  if (!match) return console.log("No match found");
  
  // Parse the JS array
  const rawList = eval(match[1]);
  
  for (let i = 0; i < rawList.length; i++) {
    const item = rawList[i];
    if (item.occurrences !== null && item.occurrences > item.verses.length) {
      console.log(`Fetching ${item.arabic}...`);
      try {
        const searchWord = item.arabic.replace(/[\u064B-\u065F\u0670]/g, '');
        const res = await fetch(`http://api.alquran.cloud/v1/search/${encodeURIComponent(searchWord)}/all/ar`);
        const data = await res.json();
        if (data.code === 200 && data.data && data.data.matches) {
          const fetchedVars = data.data.matches.map(m => `${m.surah.number}:${m.numberInSurah}`);
          const unique = Array.from(new Set([...item.verses, ...fetchedVars]));
          // Limit to occurrences limit to stay faithful to traditional counts if alquran returns too many
          rawList[i].verses = unique.slice(0, item.occurrences);
        }
      } catch (e) {
        console.error(e);
      }
      // Delay so we don't spam api
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Stringify the modified array
  const updatedArrayString = JSON.stringify(rawList, null, 2);
  
  // Replace the old array declaration 
  const updatedContent = fileContent.replace(regex, `export const asmaUlHusnaList: AsmaUlHusnaData[] = ${updatedArrayString};`);
  
  fs.writeFileSync("./src/data/asmaUlHusna.ts", updatedContent);
  console.log("Updated data saved!");
}

run();
