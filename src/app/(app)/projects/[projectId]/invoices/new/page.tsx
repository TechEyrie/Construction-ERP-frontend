"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createInvoice } from "@/lib/api/services/invoiceService";
import { listWips, type Wip } from "@/lib/api/services/wipService";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function NewInvoicePage() {
  return (
    <Suspense fallback={<TableSkeleton rows={4} cols={3} />}>
      <NewInvoiceContent />
    </Suspense>
  );
}

function NewInvoiceContent() {
  const params = useParams<{ projectId: string }>();
  const search = useSearchParams();
  const projectId = params.projectId;
  const router = useRouter();

  const [wips, setWips] = useState<Wip[]>([]);
  const [wipId, setWipId] = useState(search.get("wipId") ?? "");
  const [gross, setGross] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("2026-09-16");
  const [dueDate, setDueDate] = useState("2026-10-16");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    if (!projectId) return;
    try {
      const all = await listWips(projectId);
      const certified = all.filter((w) => w.status === "Certified");
      setWips(certified);
      if (!wipId && certified[0]) {
        setWipId(certified[0].id);
        setGross(certified[0].netCertifiedValue ?? "");
      } else if (wipId) {
        const hit = certified.find((w) => w.id === wipId);
        if (hit && !gross) setGross(hit.netCertifiedValue ?? "");
      }
    } catch (e) {
      setError((e as Error).message);
    }
  }, [projectId, wipId, gross]);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function onCreate() {
    if (!projectId || !wipId) return;
    setBusy(true);
    setError(null);
    try {
      const inv = await createInvoice(projectId, {
        wipId,
        invoiceDate: new Date(`${invoiceDate}T00:00:00.000Z`).toISOString(),
        dueDate: new Date(`${dueDate}T00:00:00.000Z`).toISOString(),
        grossAmount: gross,
        // ponytail: placeholder until file picker
        attachmentDocumentIds: ["000000000000000000000001"],
        ...(notes ? { notes } : {})
      });
      router.push(`/projects/${projectId}/invoices/${inv.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="opc-boq opc-wip">
      <p className="opc-tenders-back">
        <Link href={`/projects/${projectId}/invoices`}>← Invoice register</Link>
      </p>
      <header className="opc-boq-page-head">
        <div>
          <h1 className="opc-boq-h1">Create Invoice</h1>
          <p className="opc-boq-lead">Against a Certified WIP only.</p>
        </div>
      </header>

      {error ? <p className="opc-tenders-error">{error}</p> : null}

      <section className="opc-wip-create">
        <label>
          Certified WIP
          <select
            className="opc-progress-touch"
            value={wipId}
            onChange={(e) => {
              const id = e.target.value;
              setWipId(id);
              const hit = wips.find((w) => w.id === id);
              if (hit) setGross(hit.netCertifiedValue ?? "");
            }}
          >
            {wips.length === 0 ? <option value="">No certified WIP</option> : null}
            {wips.map((w) => (
              <option key={w.id} value={w.id}>
                #{w.wipNumber} · net cert {w.netCertifiedValue}
              </option>
            ))}
          </select>
        </label>
        <label>
          Invoice date
          <input type="date" className="opc-progress-touch" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
        </label>
        <label>
          Due date
          <input type="date" className="opc-progress-touch" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </label>
        <label>
          Gross amount (QAR)
          <input className="opc-progress-touch" inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)} />
        </label>
        <label>
          Notes
          <input className="opc-progress-touch" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <button type="button" className="opc-btn opc-btn--gold opc-progress-touch" disabled={busy || !wipId} onClick={() => void onCreate()}>
          Create draft
        </button>
      </section>
    </div>
  );
}
