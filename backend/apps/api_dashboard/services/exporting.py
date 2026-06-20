from __future__ import annotations

import csv
import io
import json
from zipfile import ZIP_DEFLATED, ZipFile

from apps.api_dashboard.models import TestRun


def export_run_json(run: TestRun) -> str:
    return json.dumps(_rows_for_run(run), indent=2, default=str)


def export_run_csv(run: TestRun) -> str:
    rows = _rows_for_run(run)
    buffer = io.StringIO()
    writer = csv.DictWriter(
        buffer,
        fieldnames=["endpoint", "method", "status", "response_time_ms", "error_message", "test_type"],
    )
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    return buffer.getvalue()


def export_run_excel(run: TestRun) -> bytes:
    rows = _rows_for_run(run)
    return _build_xlsx_bytes(rows)


def _rows_for_run(run: TestRun) -> list[dict[str, object]]:
    return [
        {
            "endpoint": result.path,
            "method": result.method,
            "status": result.status,
            "response_time_ms": round(result.response_time_ms, 2),
            "error_message": result.error_message,
            "test_type": result.test_type,
        }
        for result in run.results.select_related("endpoint").all().order_by("created_at", "id")
    ]


def _build_xlsx_bytes(rows: list[dict[str, object]]) -> bytes:
    headers = ["endpoint", "method", "status", "response_time_ms", "error_message", "test_type"]
    sheet_rows = []
    sheet_rows.append(_xlsx_row(1, headers, is_header=True))
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
        '<sheets><sheet name="Sanity Report" sheetId="1" r:id="rId1"/></sheets>'
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


def _xlsx_row(row_number: int, values: list[object], is_header: bool = False) -> str:
    cells = []
    for column_index, value in enumerate(values, start=1):
        cell_ref = f"{_column_name(column_index)}{row_number}"
        if isinstance(value, (int, float)) and not is_header:
            cells.append(f'<c r="{cell_ref}"><v>{value}</v></c>')
            continue
        text = str(value)
        escaped = (
            text.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace('"', "&quot;")
        )
        cells.append(
            f'<c r="{cell_ref}" t="inlineStr"><is><t>{escaped}</t></is></c>'
        )
    return f'<row r="{row_number}">{"".join(cells)}</row>'


def _column_name(number: int) -> str:
    name = ""
    while number:
        number, remainder = divmod(number - 1, 26)
        name = chr(65 + remainder) + name
    return name
