"use client";

import { FieldLabel, useField } from "@payloadcms/ui";
import React from "react";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * The Color field's admin input: the native color picker bound to the
 * field's value, with the exact hex beside it for tokens a picker sweep
 * can't hit. Storage and validation live on the text field beneath — this
 * only edits the value. Light-theme styling is hardcoded; the Dashboard
 * forces light mode.
 */
const ColorFieldClient: React.FC<{
  field: { label?: string; required?: boolean };
  path: string;
  readOnly?: boolean;
}> = ({ field, path, readOnly }) => {
  const { setValue, value } = useField<string | null>({ path });

  const hex =
    typeof value === "string" && HEX_COLOR.test(value) ? value : "#000000";

  return (
    <div className="field-type">
      <FieldLabel label={field.label} path={path} required={field.required} />
      <div style={{ alignItems: "center", display: "flex", gap: 8 }}>
        <input
          disabled={readOnly}
          onChange={(event) => setValue(event.target.value)}
          style={{
            background: "none",
            border: 0,
            blockSize: 30,
            cursor: "pointer",
            inlineSize: 42,
            padding: 0,
          }}
          type="color"
          value={hex}
        />
        <input
          disabled={readOnly}
          maxLength={7}
          onChange={(event) => setValue(event.target.value)}
          placeholder="#F2631C"
          style={{
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 4,
            color: "#1a1a1a",
            fontSize: 13,
            padding: "5px 8px",
            width: 90,
          }}
          type="text"
          value={value ?? ""}
        />
      </div>
    </div>
  );
};

export default ColorFieldClient;
