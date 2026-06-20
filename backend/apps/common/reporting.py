from __future__ import annotations

import csv
import io
import textwrap
from datetime import datetime
from typing import Any
from zipfile import ZIP_DEFLATED, ZipFile


def build_csv_bytes(headers: list[str], rows: list[dict[str, Any]]) -> bytes:
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=headers)
    writer.writeheader()
    for row in rows:
        writer.writerow({header: row.get(header, "") for header in headers})
    return buffer.getvalue().encode("utf-8")


def build_xlsx_bytes(
    headers: list[str],
    rows: list[dict[str, Any]],
    *,
    sheet_name: str = "Report",
) -> bytes:
    sheet_rows = [_xlsx_row(1, headers, is_header=True)]
    for index, row in enumerate(rows, start=2):
        sheet_rows.append(_xlsx_row(index, [row.get(header, "") for header in headers]))

    sheet_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
        f'<sheetData>{"".join(sheet_rows)}</sheetData>'
        "</worksheet>"
    )
    workbook_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
        f'<sheets><sheet name="{_escape_xml(sheet_name)}" sheetId="1" r:id="rId1"/></sheets>'
        "</workbook>"
    )
    rels_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
        'Target="worksheets/sheet1.xml"/>'
        "</Relationships>"
    )
    content_types_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
        '<Default Extension="xml" ContentType="application/xml"/>'
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
        "</Types>"
    )
    root_rels_xml = (
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
        'Target="xl/workbook.xml"/>'
        "</Relationships>"
    )

    buffer = io.BytesIO()
    with ZipFile(buffer, "w", ZIP_DEFLATED) as archive:
        archive.writestr("[Content_Types].xml", content_types_xml)
        archive.writestr("_rels/.rels", root_rels_xml)
        archive.writestr("xl/workbook.xml", workbook_xml)
        archive.writestr("xl/_rels/workbook.xml.rels", rels_xml)
        archive.writestr("xl/worksheets/sheet1.xml", sheet_xml)
    return buffer.getvalue()


def build_pdf_bytes(
    title: str,
    headers: list[str],
    rows: list[dict[str, Any]],
    *,
    subtitle: str | None = None,
    summary_lines: list[str] | None = None,
) -> bytes:
    lines = [title]
    if subtitle:
        lines.append(subtitle)
    if summary_lines:
        lines.append("")
        lines.extend(summary_lines)
    lines.append("")
    lines.append(" | ".join(headers))
    lines.append("-" * 120)
    for row in rows:
        values = [str(row.get(header, "")) for header in headers]
        lines.append(" | ".join(values))

    wrapped_lines: list[str] = []
    for line in lines:
        wrapped = textwrap.wrap(line, width=110) or [""]
        wrapped_lines.extend(wrapped)

    pages = [wrapped_lines[i : i + 45] for i in range(0, len(wrapped_lines), 45)] or [["No data"]]
    font_object_id = 3 + len(pages)
    content_object_ids = list(range(font_object_id + 1, font_object_id + 1 + len(pages)))

    objects: list[bytes] = []
    objects.append(f"<< /Type /Catalog /Pages 2 0 R >>".encode("utf-8"))
    kids = " ".join(f"{page_id} 0 R" for page_id in range(3, 3 + len(pages)))
    objects.append(f"<< /Type /Pages /Kids [{kids}] /Count {len(pages)} >>".encode("utf-8"))

    for index, content_id in enumerate(content_object_ids, start=3):
        objects.append(
            (
                f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] "
                f"/Resources << /Font << /F1 {font_object_id} 0 R >> >> "
                f"/Contents {content_id} 0 R >>"
            ).encode("utf-8")
        )

    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

    for page_lines in pages:
        content = _build_pdf_content(page_lines)
        stream = (
            f"<< /Length {len(content)} >>\nstream\n".encode("utf-8")
            + content
            + b"\nendstream"
        )
        objects.append(stream)

    return _assemble_pdf(objects)


def _build_pdf_content(lines: list[str]) -> bytes:
    operators = [
        "BT",
        "/F1 11 Tf",
        "50 760 Td",
    ]
    for index, line in enumerate(lines):
        escaped = _escape_pdf_text(line)
        if index == 0:
            operators.append(f"({escaped}) Tj")
        else:
            operators.append("0 -14 Td")
            operators.append(f"({escaped}) Tj")
    operators.append("ET")
    return "\n".join(operators).encode("utf-8")


def _assemble_pdf(objects: list[bytes]) -> bytes:
    output = io.BytesIO()
    output.write(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(output.tell())
        output.write(f"{index} 0 obj\n".encode("utf-8"))
        output.write(obj)
        output.write(b"\nendobj\n")
    xref_position = output.tell()
    output.write(f"xref\n0 {len(objects) + 1}\n".encode("utf-8"))
    output.write(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.write(f"{offset:010d} 00000 n \n".encode("utf-8"))
    output.write(
        (
            "trailer\n"
            f"<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
            f"startxref\n{xref_position}\n%%EOF"
        ).encode("utf-8")
    )
    return output.getvalue()


def _xlsx_row(row_number: int, values: list[Any], *, is_header: bool = False) -> str:
    cells = []
    for column_index, value in enumerate(values, start=1):
        cell_ref = f"{_column_name(column_index)}{row_number}"
        if isinstance(value, (int, float)) and not is_header:
            cells.append(f'<c r="{cell_ref}"><v>{value}</v></c>')
            continue
        text = _stringify(value)
        escaped = (
            text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
        )
        cells.append(f'<c r="{cell_ref}" t="inlineStr"><is><t>{escaped}</t></is></c>')
    return f'<row r="{row_number}">{"".join(cells)}</row>'


def _column_name(number: int) -> str:
    name = ""
    while number:
        number, remainder = divmod(number - 1, 26)
        name = chr(65 + remainder) + name
    return name


def _escape_pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _escape_xml(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def _stringify(value: Any) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    return "" if value is None else str(value)
