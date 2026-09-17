"use client";

import { useState } from "react";
import { FileUploadZone } from "@/components/files/FileUploadZone";
import { uploadFile } from "@/lib/api/services/fileService";
import { getAccessToken } from "@/lib/auth/session";

/** Demo surface for README_08 FileUploadZone (AC-08). */
export default function FileUploadDemoPage() {
  const [projectId, setProjectId] = useState("");
  const [last, setLast] = useState<string | null>(null);
  const authed = Boolean(getAccessToken());

  return (
    <main className="opc-admin">
      <p className="opc-admin-crumb">System / File Upload</p>
      <header className="opc-admin-header">
        <h1>Document Upload</h1>
      </header>

      {!authed ? (
        <div className="opc-api-status-banner opc-api-status-banner-error">
          <span className="opc-pill opc-pill-danger">Sign in required to upload</span>
        </div>
      ) : null}

      <form className="opc-admin-form" onSubmit={(e) => e.preventDefault()}>
        <label>
          Project ID
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="24-char ObjectId"
          />
        </label>
      </form>

      <FileUploadZone
        disabled={!authed || projectId.length !== 24}
        onFile={async (file) => {
          const data = await uploadFile({
            file,
            projectId,
            category: "Other",
            title: file.name.slice(0, 150)
          });
          setLast(`${data.fileName} · ${data.checksum.slice(0, 12)}…`);
        }}
      />

      {last ? <p className="opc-admin-muted">Uploaded: {last}</p> : null}
    </main>
  );
}
