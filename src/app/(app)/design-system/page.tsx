"use client";

import { useState } from "react";
import {
  Button,
  DataGrid,
  EmptyState,
  KPICard,
  Modal,
  Sheet,
  StatusBadge
} from "@/components/ui";
import type { BadgeStatus } from "@/components/ui/StatusBadge";

const SWATCHES: { name: string; varName: string }[] = [
  { name: "ink-950", varName: "var(--ink-950)" },
  { name: "ink-900", varName: "var(--ink-900)" },
  { name: "ink-800", varName: "var(--ink-800)" },
  { name: "slate-50", varName: "var(--slate-50)" },
  { name: "slate-100", varName: "var(--slate-100)" },
  { name: "slate-200", varName: "var(--slate-200)" },
  { name: "gold-500", varName: "var(--gold-500)" },
  { name: "gold-400", varName: "var(--gold-400)" },
  { name: "status-success", varName: "var(--status-success)" },
  { name: "status-danger", varName: "var(--status-danger)" },
  { name: "status-pending", varName: "var(--status-pending)" },
  { name: "status-approved", varName: "var(--status-approved)" }
];

const STATUSES: BadgeStatus[] = [
  "Draft",
  "Submitted",
  "UnderReview",
  "Approved",
  "Certified",
  "FinanceProcessing",
  "PartiallyPaid",
  "Paid",
  "Returned",
  "Rejected",
  "Valid",
  "ExpiringSoon",
  "Expired"
];

const GRID_COLS = [
  { key: "code", header: "Item" },
  { key: "desc", header: "Description" },
  { key: "qty", header: "Qty", align: "right" as const },
  { key: "rate", header: "Rate", align: "right" as const },
  { key: "amount", header: "Amount", align: "right" as const }
];

const GRID_ROWS = [
  {
    id: "1",
    title: "BOQ-001",
    subtitle: "Structural concrete C40",
    cells: {
      code: "BOQ-001",
      desc: "Structural concrete C40",
      qty: "1,200",
      rate: "450.00",
      amount: "540,000.00"
    }
  },
  {
    id: "2",
    title: "BOQ-002",
    subtitle: "Rebar high-yield",
    cells: {
      code: "BOQ-002",
      desc: "Rebar high-yield",
      qty: "85",
      rate: "3,200.00",
      amount: "272,000.00"
    }
  },
  {
    id: "3",
    title: "BOQ-003",
    subtitle: "Formwork labour",
    cells: {
      code: "BOQ-003",
      desc: "Formwork labour",
      qty: "640",
      rate: "95.00",
      amount: "60,800.00"
    }
  }
];

export default function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <main className="opc-ds">
      <h1 className="opc-ds__title">Obsidian &amp; Gold</h1>
      <p className="opc-ds__lead">Design system kitchen sink — tokens and primitives for Sprint 1.</p>

      <section className="opc-ds__section" aria-labelledby="ds-colors">
        <h2 id="ds-colors" className="opc-ds__h">
          Color palette
        </h2>
        <div className="opc-ds__swatches">
          {SWATCHES.map((s) => (
            <div key={s.name} className="opc-ds__swatch">
              <div className="opc-ds__swatch-chip" style={{ background: s.varName }} />
              <div className="opc-ds__swatch-meta">--{s.name}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="opc-ds__section" aria-labelledby="ds-type">
        <h2 id="ds-type" className="opc-ds__h">
          Typography
        </h2>
        <p className="opc-ds__type-hero opc-type-display">Hero 56</p>
        <p className="opc-ds__type-h1 opc-type-display">Heading 1</p>
        <p className="opc-ds__type-h2 opc-type-display">Heading 2</p>
        <p className="opc-ds__money opc-tabular">QAR 12,450,800.00</p>
      </section>

      <section className="opc-ds__section" aria-labelledby="ds-buttons">
        <h2 id="ds-buttons" className="opc-ds__h">
          Buttons
        </h2>
        <div className="opc-ds__row">
          <Button variant="primary" blockOnMobile>
            Primary
          </Button>
          <Button variant="secondary" blockOnMobile>
            Secondary
          </Button>
          <Button variant="ghost" blockOnMobile>
            Ghost
          </Button>
          <Button variant="gold" blockOnMobile>
            Gold CTA
          </Button>
          <Button variant="primary" loading blockOnMobile>
            Loading
          </Button>
          <Button variant="primary" disabled blockOnMobile>
            Disabled
          </Button>
        </div>
      </section>

      <section className="opc-ds__section" aria-labelledby="ds-badges">
        <h2 id="ds-badges" className="opc-ds__h">
          Status badges
        </h2>
        <div className="opc-ds__row">
          {STATUSES.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
      </section>

      <section className="opc-ds__section" aria-labelledby="ds-kpi">
        <h2 id="ds-kpi" className="opc-ds__h">
          Executive KPI cards
        </h2>
        <div className="opc-ds__kpi-row">
          <KPICard
            eyebrow="Contract Value"
            value="10,000,000"
            unitOrCurrency="QAR"
            accentColor="gold"
            trendText="+0% vs baseline"
            trendDirection="neutral"
            lastUpdated="Seed Project A"
          />
          <KPICard eyebrow="Physical Progress" value="0%" accentColor="ink" trendText="Not started" />
          <KPICard
            eyebrow="Certified Value"
            value="0"
            unitOrCurrency="QAR"
            accentColor="emerald"
            trendText="No WIP yet"
          />
          <KPICard eyebrow="Paid Value" value="0" unitOrCurrency="QAR" accentColor="ink" />
        </div>
      </section>

      <section className="opc-ds__section" aria-labelledby="ds-grid">
        <h2 id="ds-grid" className="opc-ds__h">
          Data grid
        </h2>
        <DataGrid columns={GRID_COLS} rows={GRID_ROWS} />
      </section>

      <section className="opc-ds__section" aria-labelledby="ds-empty">
        <h2 id="ds-empty" className="opc-ds__h">
          Empty state
        </h2>
        <EmptyState
          title="No documents yet"
          description="Upload contract exhibits or drawings to begin the project file register."
          actionLabel="Upload file"
          onAction={() => setModalOpen(true)}
        />
      </section>

      <section className="opc-ds__section" aria-labelledby="ds-overlays">
        <h2 id="ds-overlays" className="opc-ds__h">
          Modal &amp; sheet
        </h2>
        <div className="opc-ds__row">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Open sheet
          </Button>
        </div>
      </section>

      <Modal
        open={modalOpen}
        title="Confirm action"
        onClose={() => setModalOpen(false)}
        primaryLabel="Confirm"
        onPrimary={() => setModalOpen(false)}
      >
        Sample dialog using Obsidian surfaces and gold focus rings.
      </Modal>
      <Sheet open={sheetOpen} title="Mobile sheet" onClose={() => setSheetOpen(false)}>
        Bottom sheet pattern for narrow viewports.
      </Sheet>
    </main>
  );
}
