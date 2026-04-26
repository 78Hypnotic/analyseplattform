"use client";

import { FileDown } from "lucide-react";
import { Button } from "./button";

export function PdfExportButton() {
  return (
    <Button type="button" variant="secondary" onClick={() => window.print()}>
      <FileDown size={16} />
      PDF exportieren
    </Button>
  );
}
