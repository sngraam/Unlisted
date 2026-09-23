"use client";
import { useState } from "react";
import { Plus, X } from "lucide-react";
import { hasStrictChoices, isManagedTemplateField, isNumericTemplateField, type TemplateAnswerIssue, type TemplateDefinition } from "@/lib/marketplace-template";
import type { MarketplaceTemplate, MarketplaceTemplateField } from "@/types/marketplace-template";

export default function TemplateDefinitionEditor({ definition, template, answers, issues = [], revealKeys = [], onChange }: {
  definition: TemplateDefinition;
  template: MarketplaceTemplate;
  answers: Record<string, string>;
  issues?: TemplateAnswerIssue[];
  revealKeys?: string[];
  onChange: (field: MarketplaceTemplateField, value: string) => void;
}) {
  const [opened, setOpened] = useState<string[]>([]);
  const cells = definition.cells.filter((cell) => !isManagedTemplateField(cell));
  const field = definition.field;
  const slot = field.attribute.match(/^other_(?:product|offer)_image_locator_(\d+)$/)?.[1];
  const displayLabel = `${field.label}${slot ? ` ${slot}` : ""}`;
  const repeated = definition.cells.length > 1;
  const visible = cells.filter((cell, index) => index === 0 || !!answers[cell.key]?.trim() || opened.includes(cell.key) || revealKeys.includes(cell.key) || issues.some((issue) => issue.key === cell.key));
  const next = cells.find((cell) => !visible.includes(cell));
  const managed = definition.cells.length - cells.length;
  const conditionalMissing = cells.some((cell) => issues.some((issue) => issue.key === cell.key && issue.kind === "missing"));
  return (
    <fieldset className={`template-definition${cells.some((cell) => revealKeys.includes(cell.key)) ? " template-definition-target" : ""}`} data-pattern={definition.pattern}>
      <legend>
        {displayLabel}
        <span className={`template-requirement ${conditionalMissing ? "required" : field.requirement.toLowerCase()}`}>{conditionalMissing ? "Required for this SKU" : field.requirement === "REQUIRED" ? "Required" : field.requirement === "CONDITIONAL" ? "Conditional" : field.requirement === "RECOMMENDED" ? "Suggested" : "Optional"}</span>
      </legend>
      {!!managed && <p className="field-hint">The first value is set in the category selector. Add extra values here only if applicable.</p>}
      {visible.map((cell) => {
        const value = answers[cell.key] || "";
        const strict = hasStrictChoices(template, cell);
        const index = Array.from(cell.key.matchAll(/#(\d+)/g)).map((match) => match[1]).join(".");
        const label = repeated ? `${displayLabel} — value ${index}` : displayLabel;
        const id = `cell-${template.id}-${cell.column}`;
        const issue = issues.find((item) => item.key === cell.key);
        const validation = { "aria-invalid": !!issue, "aria-describedby": issue ? `${id}-error` : undefined };
        return (
          <div className="template-value" key={cell.key}>
            <label className="field" htmlFor={id}>
              {repeated && <span className="field-label">Value {index}</span>}
              {strict && cell.allowedValues!.length <= 100 ? (
                <select id={id} aria-label={label} {...validation} value={value} onChange={(event) => onChange(cell, event.target.value)}>
                  <option value="">Select a value</option>
                  {cell.allowedValues!.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : !cell.allowedValues?.length && (value.length > 120 || (definition.example?.length || 0) > 120) ? (
                <textarea id={id} aria-label={label} {...validation} rows={3} maxLength={30000} value={value} onChange={(event) => onChange(cell, event.target.value)} placeholder="Enter verified value" />
              ) : (
                <>
                  <input id={id} aria-label={label} {...validation} inputMode={isNumericTemplateField(cell) ? "decimal" : undefined} value={value} maxLength={30000} list={cell.allowedValues?.length ? `options-${id}` : undefined} placeholder={isNumericTemplateField(cell) ? "One number, e.g. 5.25" : strict ? "Choose an allowed value" : "Enter verified value"} onChange={(event) => onChange(cell, event.target.value)} />
                  {!!cell.allowedValues?.length && <datalist id={`options-${id}`}>{cell.allowedValues.map((option) => <option key={option} value={option} />)}</datalist>}
                </>
              )}
              {issue && <span className="error-text" id={`${id}-error`} role="alert">{issue.message}</span>}
            </label>
            {cell !== cells[0] && (
              <button className="icon-button" type="button" aria-label={`Remove ${label}`} onClick={() => {
                onChange(cell, "");
                setOpened((keys) => keys.filter((key) => key !== cell.key));
              }}><X size={14} /></button>
            )}
          </div>
        );
      })}
      {next && <button type="button" className="btn small template-add" onClick={() => setOpened((keys) => [...keys, next.key])}><Plus size={13} /> Add another {field.label.toLowerCase()}</button>}
      {isNumericTemplateField(field) && <p className="field-hint">Enter a single number. Choose its unit separately. Workbook examples separated by commas show alternative values.</p>}
      {field.attribute === "external_product_information" && field.key.endsWith(".value") && <p className="field-hint">For HSN Code, enter one verified 6–8-digit code. Do not paste the whole example list.</p>}
      {field.attribute === "regulatory_compliance_certification" && <p className="field-hint">Use the same value number for a compliance type and its verified ID. Leave both empty when not applicable.</p>}
      {definition.example && <p className="template-example"><strong>Workbook example:</strong> {definition.example}</p>}
      {field.description && <details className="field-help"><summary>Guidance{definition.sourceRow ? ` · Data Definitions row ${definition.sourceRow}` : ""}</summary><p>{field.description}</p>{hasStrictChoices(template, cells[0]) ? <p>Choose one of the allowed values.</p> : !!cells[0]?.allowedValues?.length && <p>The workbook allows other values in addition to its suggestions.</p>}</details>}
    </fieldset>
  );
}
