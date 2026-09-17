"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getAccessToken } from "@/lib/auth/session";
import {
  createProject,
  listOrganizations,
  type OrgRow
} from "@/lib/api/services/projectsService";

export default function NewProjectPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<OrgRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [ownerOrgId, setOwnerOrgId] = useState("");
  const [consultantOrgId, setConsultantOrgId] = useState("");
  const [contractorOrgId, setContractorOrgId] = useState("");
  const [start, setStart] = useState("2026-10-01");
  const [end, setEnd] = useState("2028-10-01");
  const [budget, setBudget] = useState("12000000.00");
  const [contract, setContract] = useState("10000000.00");
  const [fundingType, setFundingType] = useState<"BankLoan" | "OwnerEquity" | "Other">("BankLoan");
  const [retentionPct, setRetentionPct] = useState(10);
  const [advancePct, setAdvancePct] = useState(10);
  const [vatPct, setVatPct] = useState(0);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace("/login");
      return;
    }
    void listOrganizations()
      .then((rows) => {
        setOrgs(rows);
        const owner = rows.find((o) => o.type === "Owner");
        if (owner) setOwnerOrgId(owner.id);
      })
      .catch((e: Error) => setError(e.message));
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await createProject({
        name,
        code,
        location,
        ...(description ? { description } : {}),
        ownerOrgId,
        ...(consultantOrgId ? { consultantOrgId } : {}),
        ...(contractorOrgId ? { contractorOrgId } : {}),
        plannedStartDate: new Date(start).toISOString(),
        plannedEndDate: new Date(end).toISOString(),
        originalBudget: budget,
        contractValue: contract,
        currency: "QAR",
        fundingType,
        settings: {
          progressMethod: "QUANTITY_BASED",
          retentionPct,
          advancePct,
          vatPct,
          allowMaterialsOnSite: false
        }
      });
      router.push(`/projects/${created.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  const owners = orgs.filter((o) => o.type === "Owner");
  const consultants = orgs.filter((o) => o.type === "Consultant");
  const contractors = orgs.filter((o) => o.type === "Contractor");

  return (
    <main className="opc-project-form">
      <h1 className="opc-portfolio-title">New Project</h1>
      <p className="opc-portfolio-lead">Provision a capital project and assign yourself as Owner.</p>
      {error ? (
        <p className="opc-auth-error" role="alert">
          {error}
        </p>
      ) : null}
      <form className="opc-project-form-card" onSubmit={(e) => void onSubmit(e)}>
        <fieldset>
          <legend>General</legend>
          <label>
            Name
            <input required minLength={3} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Code
            <input
              required
              pattern="[A-Za-z0-9-]{3,12}"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
          </label>
          <label>
            Location
            <input required value={location} onChange={(e) => setLocation(e.target.value)} />
          </label>
          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </label>
        </fieldset>

        <fieldset>
          <legend>Stakeholders</legend>
          <label>
            Owner organization
            <select required value={ownerOrgId} onChange={(e) => setOwnerOrgId(e.target.value)}>
              <option value="">Select…</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Consultant
            <select value={consultantOrgId} onChange={(e) => setConsultantOrgId(e.target.value)}>
              <option value="">None</option>
              {consultants.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Contractor
            <select value={contractorOrgId} onChange={(e) => setContractorOrgId(e.target.value)}>
              <option value="">None</option>
              {contractors.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Commercials</legend>
          <label>
            Planned start
            <input type="date" required value={start} onChange={(e) => setStart(e.target.value)} />
          </label>
          <label>
            Planned end
            <input type="date" required value={end} onChange={(e) => setEnd(e.target.value)} />
          </label>
          <label>
            Original budget (QAR)
            <input required value={budget} onChange={(e) => setBudget(e.target.value)} className="opc-tabular" />
          </label>
          <label>
            Contract value (QAR)
            <input required value={contract} onChange={(e) => setContract(e.target.value)} className="opc-tabular" />
          </label>
          <label>
            Funding
            <select value={fundingType} onChange={(e) => setFundingType(e.target.value as typeof fundingType)}>
              <option value="BankLoan">Bank loan</option>
              <option value="OwnerEquity">Owner equity</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Rules</legend>
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
          <label>
            VAT %
            <input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={vatPct}
              onChange={(e) => setVatPct(Number(e.target.value))}
            />
          </label>
        </fieldset>

        <div className="opc-project-form-actions">
          <Button type="button" variant="secondary" onClick={() => router.push("/projects")}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={busy}>
            Create Project
          </Button>
        </div>
      </form>
    </main>
  );
}
