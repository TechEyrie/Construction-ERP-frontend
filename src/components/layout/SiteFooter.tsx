/** Shared site credit — root layout, every screen. */
export function SiteFooter() {
  return (
    <footer className="opc-site-footer" role="contentinfo">
      <p className="opc-site-footer__credit">
        Developed by{" "}
        <a
          className="opc-site-footer__link"
          href="https://saqrih.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Saqrih Qatar
        </a>
      </p>
    </footer>
  );
}
