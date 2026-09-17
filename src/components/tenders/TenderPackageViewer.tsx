export type PackageDoc = {
  id: string;
  title: string;
  category?: string;
  revision?: string;
};

export function TenderPackageViewer({
  docs,
  locked
}: {
  docs: PackageDoc[];
  locked?: boolean;
}) {
  if (docs.length === 0) {
    return <p className="opc-tender-muted">No package documents attached.</p>;
  }
  return (
    <ul className={`opc-tender-pkg ${locked ? "opc-tender-pkg--locked" : ""}`.trim()}>
      {docs.map((d) => (
        <li key={d.id}>
          <strong>{d.title}</strong>
          <span>
            {d.category ?? "Document"}
            {d.revision ? ` · Rev ${d.revision}` : ""}
            {locked ? " · Locked" : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
