export default function Loading() {
  return (
    <main aria-busy="true" aria-live="polite" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <div role="status">
        Loading EnterpriseVerse…
      </div>
    </main>
  );
}
