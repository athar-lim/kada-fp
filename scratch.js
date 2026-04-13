const fs = require('fs');

async function buildQueryString(query) {
  const params = new URLSearchParams();
  if (!query) return params.toString();

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  return params.toString();
}

async function fetchJson(path, query) {
  const queryString = await buildQueryString(query);
  const url = `https://capstone-project-api-cinetrack.vercel.app/api/v1${path}?${queryString}`;
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  return response.json();
}

async function test() {
  const city = "Surabaya";
  
  // 1. Get Cinema Breakdown
  const res1 = await fetchJson('/cinemas', { city });
  const cinema = res1.breakdown.find(c => c.cinema_name.includes("Surabaya Mall 14"));
  console.log("Cinema Total Tickets:", cinema?.metrics?.total_tickets);
  console.log("Cinema ID:", cinema?.cinema_id);
  
  // 2. Get Studios for Cinema
  if (cinema) {
    const res2 = await fetchJson('/studios', { cinema_id: cinema.cinema_id });
    console.log("Studios count:", res2.data.length);
    
    // 3. Get Studio summary
    const studioId = res2.data[0].studio_id || res2.data[0].id;
    const res3 = await fetchJson('/stats/summary', { city, cinema_id: cinema.cinema_id, studio_id: studioId });
    console.log(`Studio ${studioId} summary:`, res3.data?.total_tickets, "occupancy:", res3.data?.occupancy);
  }
}

test().catch(console.error);
