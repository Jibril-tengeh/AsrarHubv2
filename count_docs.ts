import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import config from "./firebase-applet-config.json";

const app = initializeApp(config);
const db = getFirestore(app);

async function main() {
  const querySnapshot = await getDocs(collection(db, "texts"));
  console.log("Total docs:", querySnapshot.size);
  querySnapshot.forEach((doc) => {
    console.log(doc.id, "=>", doc.data().title);
  });
}
main().catch(console.error);
