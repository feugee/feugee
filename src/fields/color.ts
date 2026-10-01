import type { Field } from "payload";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/**
 * Empty passes — the required flag owns absence; anything set must be a
 * strict #rrggbb hex, what the picker produces and what the Work Card chip
 * consumes.
 */
const hexColorValidate = (
  value: string | null | undefined,
): true | string => {
  if (value == null || value === "") return true;
  return HEX_COLOR.test(value) ? true : "Enter a hex color like #F2631C.";
};

type ColorFieldOptions = {
  /** The field name at its site. */
  name: string;
  label?: string;
  /** Whether a value must be set — absence is the required flag's business. */
  required?: boolean;
  /** Pre-fills the picker on new documents. */
  defaultValue?: string;
  /** What the color means at this site, shown under the field. */
  description?: string;
};

/**
 * The Color field: Payload has no native color field type, so the value is
 * stored as plain text — hex validated — with the admin input swapped for a
 * picker component (src/fields/ColorField.tsx, resolved through the import
 * map).
 */
export const colorField = (options: ColorFieldOptions): Field => {
  const { name, label, required, defaultValue, description } = options;

  return {
    name,
    type: "text",
    ...(label !== undefined ? { label } : {}),
    ...(required !== undefined ? { required } : {}),
    ...(defaultValue !== undefined ? { defaultValue } : {}),
    validate: hexColorValidate,
    admin: {
      components: { Field: "/fields/ColorField" },
      ...(description !== undefined ? { description } : {}),
    },
  };
};
