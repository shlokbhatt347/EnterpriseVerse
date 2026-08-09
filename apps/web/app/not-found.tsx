export default function NotFound() {
  return (
    <main role="main" style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem" }}>
      <section style={{ maxWidth: 560, textAlign: "center" }}>
        <p>EnterpriseVerse</p>
        <h1>Page not found</h1>
        <p>The requested EnterpriseVerse page does not exist.</p>
        <a href="/">Return to EnterpriseVerse</a>
      </section>
    </main>
  );
}
