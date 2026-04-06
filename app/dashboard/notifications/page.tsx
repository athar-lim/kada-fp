export default function NotificationsPage() {
  return (
    <main className="space-y-6 text-foreground">
      <div>
        <h1 className="text-2xl font-bold">Notifikasi</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan alert dan insight terbaru.
        </p>
      </div>

      <section className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Okupansi Rendah — Semarang</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cineplex Semarang Central turun ke 38% dan perlu perhatian.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Node Offline — Palembang</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            CineTrack tidak merespons sejak pukul 08:15 WIB.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Rekor Baru — Jakarta Barat</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Penjualan harian tertinggi mencapai 1.306 tiket.
          </p>
        </div>
      </section>
    </main>
  );
}