"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { DocumentTable } from "@/components/documents/DocumentTable";
import { RevisionHistoryDrawer } from "@/components/documents/RevisionHistoryDrawer";
import { FileUploadZone } from "@/components/files/FileUploadZone";
import { EmptyState } from "@/components/ui/EmptyState";
import { DocsModalShell } from "@/components/ui/DocsModalShell";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { isAbortError } from "@/lib/api/abort";
import {
  downloadUrl,
  getDocumentHistory,
  listDocuments,
  uploadDocumentRevision,
  uploadProjectDocument,
  type DocumentRow
} from "@/lib/api/services/documentsService";
import { getAccessToken } from "@/lib/auth/session";
import { useAbortableLoad } from "@/lib/hooks/useAbortableLoad";
import { useProjectId } from "@/lib/project/ProjectIdContext";

const CATEGORIES = [
  "PreTender",
  "Drawings",
  "Specifications",
  "BOQ",
  "Tender",
  "Contract",
  "Invoice",
  "Payment",
  "Compliance",
  "ProgressEvidence",
  "Other"
] as const;

export default function ProjectDocumentsPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = useProjectId(params.projectId);
  const [rows, setRows] = useState<DocumentRow[]>([]);
  const [total, setTotal] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [includeSuperseded, setIncludeSuperseded] = useState(false);
  const [sort, setSort] = useState<"newest" | "title">("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>("Drawings");
  const [uploadTitle, setUploadTitle] = useState("");
  const [reviseTarget, setReviseTarget] = useState<DocumentRow | null>(null);
  const [reviseRev, setReviseRev] = useState("");
  const [history, setHistory] = useState<{ title: string; chain: DocumentRow[] } | null>(null);
  const token = getAccessToken();

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const reload = useCallback(
    async (signal?: AbortSignal) => {
      if (!projectId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const { items, totalRecords } = await listDocuments(projectId, {
          ...(category ? { category } : {}),
          includeSuperseded,
          ...(searchDebounced ? { search: searchDebounced } : {}),
          signal
        });
        if (signal?.aborted) return;
        setRows(items);
        setTotal(totalRecords);
      } catch (e) {
        if (isAbortError(e) || signal?.aborted) return;
        setError((e as Error).message);
        setRows([]);
        setTotal(0);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [projectId, category, includeSuperseded, searchDebounced]
  );

  useAbortableLoad([projectId, category, includeSuperseded, searchDebounced], async (signal) => {
    await reload(signal);
  });

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sort === "title") copy.sort((a, b) => a.title.localeCompare(b.title));
    else copy.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt));
    return copy;
  }, [rows, sort]);

  const tabCounts = useMemo(() => {
    // Active filter already applied server-side; count current page set only for All
    return { all: total };
  }, [total]);

  return (
    <div className="opc-docs" data-opc-project-id={projectId || ""} data-opc-docs-loading={loading ? "1" : "0"}>
      <header className="opc-docs-header">
        <div>
          <h1 className="opc-docs-h1">Project Documents</h1>
          <p className="opc-docs-lead">
            Controlled repository with revision lineage. Active revisions shown by default.
          </p>
        </div>
        <button type="button" className="opc-btn opc-btn--primary" onClick={() => setUploadOpen(true)}>
          Upload Document
        </button>
      </header>

      <div className="opc-docs-tabs" role="tablist" aria-label="Document categories">
        <button
          type="button"
          role="tab"
          aria-selected={!category}
          className={!category ? "opc-docs-tab opc-docs-tab--active" : "opc-docs-tab"}
          onClick={() => setCategory("")}
        >
          All{!category ? ` (${tabCounts.all})` : ""}
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            className={category === c ? "opc-docs-tab opc-docs-tab--active" : "opc-docs-tab"}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="opc-docs-filters">
        <input
          className="opc-docs-search"
          placeholder="Search title or filename…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search documents"
        />
        <label className="opc-docs-toggle">
          <input
            type="checkbox"
            checked={includeSuperseded}
            onChange={(e) => setIncludeSuperseded(e.target.checked)}
          />
          Show superseded
        </label>
        <select
          className="opc-docs-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as "newest" | "title")}
          aria-label="Sort"
        >
          <option value="newest">Newest first</option>
          <option value="title">Title A-Z</option>
        </select>
      </div>

      {error ? (
        <p className="opc-auth-error" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : sorted.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Upload drawings, specs, contracts, or site evidence to start the register."
          actionLabel="Upload Document"
          onAction={() => setUploadOpen(true)}
        />
      ) : (
        <DocumentTable
          rows={sorted}
          downloadAuth={token}
          downloadHref={downloadUrl}
          onHistory={(row) => {
            void getDocumentHistory(projectId, row.id).then((chain) =>
              setHistory({ title: row.title, chain })
            );
          }}
          onRevise={(row) => {
            setReviseTarget(row);
            setReviseRev("");
          }}
        />
      )}

      {uploadOpen ? (
        <DocsModalShell title="Upload Document" ariaLabel="Upload document" onClose={() => setUploadOpen(false)}>
          <label>
            Category
            <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              maxLength={150}
              required
            />
          </label>
          <FileUploadZone
            disabled={!uploadTitle.trim()}
            onFile={async (file) => {
              await uploadProjectDocument({
                projectId,
                file,
                category: uploadCategory,
                title: uploadTitle.trim() || file.name.slice(0, 150)
              });
              setUploadOpen(false);
              setUploadTitle("");
              await reload();
            }}
          />
          <div className="opc-docs-modal-actions">
            <button type="button" className="opc-docs-action" onClick={() => setUploadOpen(false)}>
              Cancel
            </button>
          </div>
        </DocsModalShell>
      ) : null}

      {reviseTarget ? (
        <DocsModalShell
          title={`New revision — ${reviseTarget.title}`}
          ariaLabel="Upload revision"
          onClose={() => setReviseTarget(null)}
        >
          <label>
            Revision label
            <input
              value={reviseRev}
              onChange={(e) => setReviseRev(e.target.value)}
              placeholder="02"
              maxLength={10}
              required
            />
          </label>
          <FileUploadZone
            disabled={!/^[A-Za-z0-9-]{1,10}$/.test(reviseRev)}
            onFile={async (file) => {
              await uploadDocumentRevision({
                projectId,
                documentId: reviseTarget.id,
                file,
                revision: reviseRev
              });
              setReviseTarget(null);
              await reload();
            }}
          />
          <div className="opc-docs-modal-actions">
            <button type="button" className="opc-docs-action" onClick={() => setReviseTarget(null)}>
              Cancel
            </button>
          </div>
        </DocsModalShell>
      ) : null}

      <RevisionHistoryDrawer
        open={Boolean(history)}
        title={history?.title ?? ""}
        chain={history?.chain ?? []}
        onClose={() => setHistory(null)}
      />
    </div>
  );
}
