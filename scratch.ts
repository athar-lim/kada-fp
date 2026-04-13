import { getCinemaBreakdown, getDashboardSummary, getCinemaStudios } from "./lib/cinetrack-api";

async function test() {
  const city = "Surabaya";
  const breakdown = await getCinemaBreakdown({ city });
  const cinema = breakdown.breakdown.find(c => c.cinema_name.includes("Surabaya Mall 14 XXI"));
  console.log("Cinema Tix:", cinema?.metrics.total_tickets);
  
  if (cinema) {
    const studios = await getCinemaStudios(cinema.cinema_id);
    console.log("Studios count:", studios.length);
    for (const s of studios.slice(0, 1)) {
       const studioId = s.studio_id || s.id;
       const sum1 = await getDashboardSummary({ city, studio_id: studioId });
       console.log("Summary with city+studio:", sum1.data.total_tickets);
       
       const sum2 = await getDashboardSummary({ city, cinema_id: cinema.cinema_id, studio_id: studioId });
       console.log("Summary with city+cinema+studio:", sum2.data.total_tickets);
    }
  }
}
test().catch(console.error);
