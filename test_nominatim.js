const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

async function run() {
  const res = await fetch('https://nominatim.openstreetmap.org/search?q=Surat&format=json&limit=1');
  const data = await res.json();
  console.log("Search Result:", data[0].lat, data[0].lon);
  
  const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${data[0].lat}&lon=${data[0].lon}&format=json&addressdetails=1`, {headers: {'User-Agent': 'AgriSense-App/1.0'}});
  const revData = await revRes.json();
  console.log("Reverse Result:", revData.address);
}

run();
