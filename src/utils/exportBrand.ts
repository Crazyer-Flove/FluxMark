/** Export-only heading. Never mutate the editable source document. */
export function withExportBrand(html: string, enabled = false): string {
  if (!enabled) return html;
  return '<header data-export-brand="true" style="padding:0 0 24px;margin:0 0 28px;border-bottom:1px solid currentColor;break-inside:avoid"><div style="font-size:24px;font-weight:700;letter-spacing:-.5px">FluxMark</div><div style="font-size:14px;margin-top:6px">灵感流淌，极致表达。</div></header>' + html;
}
