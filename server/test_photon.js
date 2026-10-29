const fetch = require('node-fetch');
(async () => {
  try {
    const res = await fetch("https://photon.komoot.io/api/?q=akola&limit=1");
    const data = await res.json();
    console.log("Photon API Search Response:", JSON.stringify(data, null, 2));

    const res2 = await fetch("https://photon.komoot.io/reverse?lon=74.7749&lat=20.9042");
    const data2 = await res2.json();
    console.log("Photon API Reverse Response:", JSON.stringify(data2, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
})();
