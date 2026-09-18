"use client";

import { FormEvent, useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { ContractDetailCard, type ContractView } from "@/components/contracts/ContractDetailCard";
import { FileUploadZone } from "@/components/files/FileUploadZone";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocsModalShell } from "@/components/ui/DocsModalShell";
import { getAccessToken, getSessionUser } from "@/lib/auth/session";
import { DetailSkeleton } from "@/components/ui/Skeleton";
import { isAbortError } from "@/lib/api/abort";
import {
  activateContract,
  bindSignedDocument,
  createContract,
  getProjectContract
} from "@/lib/api/services/contractsService";
import { downloadUrl, uploadProjectDocument } from "@/lib/api/services/documentsService";
import { getProjectSummary, listOrganizations, type OrgRow } from "@/lib/api/services/projectsService";
import { useAbortableLoad } from "@/lib/hooks/useAbortableLoad";

function toIsoDate(d: string): string {
  return new Date(`${d}T00:00:00.000Z`).toISOString();
}

export default function ProjectContractsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const [contract, setContract] = useState<ContractView | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [projectCode, setProjectCode] = useState("—");
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showBind, setShowBind] = useState(false);
  /** When true, successful PDF bind continues into activate. */
  const [activateAfterBind, setActivateAfterBind] = useState(false);
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [busy, setBusy] = useState(false);
  const user = getSessionUser();

  const [reference, setReference] = useState("CNT-PRJ-A-001");
  const [amount, setAmount] = useState("10000000.00");
  const [contractorOrgId, setContractorOrgId] = useState("");
  const [award, setAward] = useState("2026-09-15");
  const [start, setStart] = useState("2026-10-01");
  const [end, setEnd] = useState("2028-10-01");
  const [retentionPct, setRetentionPct] = useState(10);
  const [advancePct, setAdvancePct] = useState(10);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      if (!projectId) return;
      setLoading(true);
      setError(null);
      try {
        const init = signal ? { signal } : undefined;
        const [c, summary] = await Promise.all([
          getProjectContract(projectId, init).catch((e: Error & { status?: number }) => {
            if (e.status === 404) return null;
            throw e;
          }),
          getProjectSummary(projectId, init).catch(() => null)
        ]);
        if (signal?.aborted) return;
        if (summary) {
          setProjectCode(summary.code);
          setOwnerName(summary.assignedStakeholders.owner);
        }
        if (!c) {
          setMissing(true);
          setContract(null);
        } else {
          setMissing(false);
          setContract(c as ContractView);
        }
      } catch (e) {
        if (isAbortError(e) || signal?.aborted) return;
        setError((e as Error).message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [projectId]
  );

  useAbortableLoad([projectId], async (signal) => {
    await reload(signal);
    try {
      const rows = await listOrganizations({ signal });
      if (signal.aborted) return;
      setOrgs(rows);
      const gc = rows.find((o) => o.type === "Contractor");
      if (gc) setContractorOrgId(gc.id);
    } catch (e) {
      if (isAbortError(e) || signal.aborted) return;
    }
  });

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!projectId || !contractorOrgId) return;
    setBusy(true);
    setError(null);
    try {
      await createContract(projectId, {
        contractorOrgId,
        reference,
        originalContractAmount: amount,
        currency: "QAR",
        awardDate: toIsoDate(award),
        startDate: toIsoDate(start),
        completionDate: toIsoDate(end),
        retentionPct,
        advancePct
      });
      setShowCreate(false);
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onActivate() {
    if (!contract) return;
    // Must bind executed PDF first — open upload instead of a raw API error.
    if (contract.signedStatus !== "FullySigned") {
      setError(null);
      setActivateAfterBind(true);
      setShowBind(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await activateContract(projectId, contract.id);
      await reload();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onBindExecuted(file: File) {
    if (!contract) return;
    setBusy(true);
    setError(null);
    try {
      const doc = await uploadProjectDocument({
        projectId,
        file,
        category: "Contract",
        title: `Executed ${contract.reference}`
      });
      await bindSignedDocument(projectId, contract.id, {
        documentId: doc.id,
        signedStatus: "FullySigned"
      });
      setShowBind(false);
      if (activateAfterBind && contract.status === "Draft") {
        await activateContract(projectId, contract.id);
      }
      setActivateAfterBind(false);
      await reload();
    } catch (err) {
      setError((err as Error).message);
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function downloadSigned() {
    if (!contract?.signedDocument) return;
    const token = getAccessToken();
    const res = await fetch(downloadUrl(contract.signedDocument.fileKey), {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = contract.signedDocument.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="opc-contract-page">
        <header className="opc-boq-page-head">
          <div>
            <h1 className="opc-boq-h1">Contracts</h1>
            <p className="opc-boq-lead">Primary commercial agreement for this project.</p>
          </div>
        </header>
        <DetailSkeleton />
      </div>
    );
  }

  return (
    <div className="opc-contract-page">
      {error ? (
        <p className="opc-auth-error" role="alert">
          {error}
        </p>
      ) : null}

      {missing || !contract ? (
        <EmptyState
          title="No contract on this project"
          description="Create the primary commercial agreement to lock original amount and retention baseline."
          actionLabel="Create Contract"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <>
          <div className="opc-contract-actions">
            {contract.status === "Draft" ? (
              <button
                type="button"
                className="opc-btn opc-btn--primary"
                disabled={busy}
                onClick={() => void onActivate()}
              >
                Activate Contract
              </button>
            ) : null}
            <button
              type="button"
              className="opc-btn opc-btn--primary"
              onClick={() => {
                setActivateAfterBind(false);
                setShowBind(true);
              }}
            >
              Upload Executed Agreement
            </button>
          </div>
          <ContractDetailCard
            contract={contract}
            projectCode={projectCode}
            ownerName={ownerName}
            onDownloadSigned={() => void downloadSigned()}
          />
          <p className="opc-contract-user-hint">Signed in as {user?.name ?? "—"}</p>
          {contract.status === "Draft" && contract.signedStatus !== "FullySigned" ? (
            <p className="opc-boq-lead" style={{ marginTop: "0.75rem" }}>
              Tip: click <strong>Activate Contract</strong> — you&apos;ll upload the executed PDF, then
              activation runs automatically.
            </p>
          ) : null}
        </>
      )}

      {showCreate ? (
        <DocsModalShell
          asForm
          title="Create Contract"
          ariaLabel="Create contract"
          onSubmit={(e) => void onCreate(e)}
          onClose={() => setShowCreate(false)}
        >
          <label>
            Reference
            <input value={reference} onChange={(e) => setReference(e.target.value)} required />
          </label>
          <label>
            Contractor organization
            <select
              value={contractorOrgId}
              onChange={(e) => setContractorOrgId(e.target.value)}
              required
            >
              <option value="">Select…</option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.type})
                </option>
              ))}
            </select>
          </label>
          <label>
            Original amount (QAR)
            <input value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <label>
            Award date
            <input type="date" value={award} onChange={(e) => setAward(e.target.value)} required />
          </label>
          <label>
            Start date
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
          </label>
          <label>
            Completion date
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} required />
          </label>
          <label>
            Retention %
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={retentionPct}
              onChange={(e) => setRetentionPct(Number(e.target.value))}
            />
          </label>
          <label>
            Advance %
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={advancePct}
              onChange={(e) => setAdvancePct(Number(e.target.value))}
            />
          </label>
          <div className="opc-docs-modal-actions">
            <button type="button" className="opc-docs-action" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button type="submit" className="opc-btn opc-btn--primary" disabled={busy}>
              Save Draft
            </button>
          </div>
        </DocsModalShell>
      ) : null}

      {showBind && contract ? (
        <DocsModalShell
          title={activateAfterBind ? "Activate Contract" : "Upload Executed Agreement"}
          ariaLabel="Bind signed document"
          onClose={() => {
            setShowBind(false);
            setActivateAfterBind(false);
          }}
        >
          <p className="opc-docs-lead">
            {activateAfterBind
              ? "Upload the executed agreement PDF. Once it is marked FullySigned, the contract activates automatically."
              : "Uploads as Contract category and marks FullySigned."}
          </p>
          <FileUploadZone onFile={(file) => onBindExecuted(file)} />
          <div className="opc-docs-modal-actions">
            <button
              type="button"
              className="opc-docs-action"
              onClick={() => {
                setShowBind(false);
                setActivateAfterBind(false);
              }}
            >
              Cancel
            </button>
          </div>
        </DocsModalShell>
      ) : null}
    </div>
  );
}
