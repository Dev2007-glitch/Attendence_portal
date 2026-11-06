import openpyxl
import re
import json
import os

EXCEL_PATH = os.path.join(os.path.dirname(__file__), "3rd_yr_tt.xlsx")

PERIOD_TIME_SLOTS = [
    {"period": "1", "time": "8.15 - 9.05"},
    {"period": "2", "time": "9.05 - 9.55"},
    {"period": "3", "time": "9.55 - 10.45"},
    {"period": "4", "time": "11.00 - 11.50"},
    {"period": "5", "time": "11.50 - 12.40"},
    {"period": "6", "time": "1.30 - 2.20"},
    {"period": "7", "time": "2.20 - 3.10"},
    {"period": "8", "time": "3.10 - 4.00"}
]

SUBJECT_COLORS = {
    "ML": "#2563eb",
    "CN": "#059669",
    "MFEF": "#7c3aed",
    "OT": "#d97706",
    "CE": "#0891b2",
    "CV": "#9333ea",
    "DAV": "#0d9488",
    "API": "#e11d48",
    "PC_LAB": "#4f46e5",
    "CC": "#ea580c",
    "TRAINING": "#dc2626",
    "NPTEL": "#475569",
    "LIB": "#64748b",
    "MINORS": "#854d0e",
    "COUN": "#15803d",
    "PROJECT": "#0284c7"
}

def extract_phone(s):
    if not s:
        return ""
    m = re.search(r'([6-9]\d{4}\s*\d{5})', s)
    if m:
        return "+91" + m.group(1).replace(" ", "")
    m = re.search(r'([6-9]\d{9})', s)
    if m:
        return "+91" + m.group(1)
    return ""

def clean_faculty_name(s):
    if not s:
        return ""
    # Remove phone numbers and parenthesis
    cleaned = re.sub(r'[\(\[\-]?\s*[6-9]\d{4}\s*\d{5}\s*[\)\]]?', '', s)
    cleaned = re.sub(r'[\(\[\-]?\s*[6-9]\d{9}\s*[\)\]]?', '', cleaned)
    cleaned = re.sub(r'\(\s*\)', '', cleaned)
    cleaned = re.sub(r'\[\s*\]', '', cleaned)
    return cleaned.strip(" ,-")

def identify_subject_key(raw_str):
    if not raw_str:
        return "FREE", "Free Period"
    s = raw_str.upper().strip()
    if "MACHINE LEARNING" in s or re.search(r'\bML\b', s):
        return "ML", "Machine Learning"
    if "COMPUTER NETWORKS" in s or re.search(r'\bCN\b', s):
        return "CN", "Computer Networks"
    if "MODERN FRONT" in s or re.search(r'\bMFEF\b', s):
        return "MFEF", "Modern Front-End Frameworks"
    if "OPTIMIZATION" in s or re.search(r'\bOT\b', s):
        return "OT", "Optimization Techniques"
    if "COMPUTING ETHICS" in s or re.search(r'\bCE\b', s):
        return "CE", "Computing Ethics"
    if "COMPUTER VISION" in s or re.search(r'\bCV\b', s):
        return "CV", "Computer Vision"
    if "DATA ANALYTICS" in s or re.search(r'\bDAV\b', s):
        return "DAV", "Data Analytics and Visualization"
    if "API" in s:
        return "API", "API Security and Authentication"
    if "PC LAB" in s or re.search(r'\bPC\b', s):
        return "PC_LAB", "PC LAB"
    if "COMPETITIVE CODING" in s or re.search(r'\bCC\b', s):
        return "CC", "Competitive Coding"
    if "TRAINING" in s or "TRAIN" in s:
        return "TRAINING", "Technical Training"
    if "NPTEL" in s:
        return "NPTEL", "NPTEL"
    if "LIB" in s:
        return "LIB", "Library / Self Study"
    if "MINORS" in s:
        return "MINORS", "Minor Degree Programs"
    if "COUN" in s:
        return "COUN", "Student Mentoring & Counselling"
    if "EXPERIENTIAL" in s or "PROJECT" in s:
        return "PROJECT", "Experiential Learning / Project"
    return "OTHER", raw_str

def parse_all():
    wb = openpyxl.load_workbook(EXCEL_PATH, data_only=True)
    all_sections = {}

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        sec_num = int(re.sub(r'\D', '', sheet_name))
        day_col = 3 if sheet_name == 'sec12' else 2

        # 1. Title & Main Room
        title_val = ""
        for r in [1, 2]:
            for c in range(1, 5):
                val = str(ws.cell(r, c).value or "").strip()
                if "SECTION" in val.upper():
                    title_val = val
                    break
            if title_val:
                break
        
        room_match = re.search(r'\[([^\]]+)\]', title_val)
        main_room = f"Room {room_match.group(1).strip()}" if room_match else f"Room N-40{sec_num}"

        # 2. Map all merged cells onto a virtual 2D grid
        grid = {}
        for r in range(1, ws.max_row + 1):
            for c in range(1, ws.max_column + 1):
                grid[(r, c)] = ws.cell(r, c).value

        for m in ws.merged_cells.ranges:
            top_val = ws.cell(m.min_row, m.min_col).value
            for r in range(m.min_row, m.max_row + 1):
                for c in range(m.min_col, m.max_col + 1):
                    grid[(r, c)] = top_val

        # 3. Detect column indices for each of the 8 attendance periods
        period_cols = {}
        for c in range(day_col + 1, ws.max_column + 1):
            raw = str(ws.cell(2, c).value or '').strip().replace(' ', '')
            if '8.15' in raw and '9.05' in raw: period_cols[1] = c
            elif '9.05' in raw and '9.55' in raw: period_cols[2] = c
            elif '9.55' in raw and '10.45' in raw: period_cols[3] = c
            elif '11.00' in raw and '11.50' in raw: period_cols[4] = c
            elif '11.50' in raw and '12.40' in raw: period_cols[5] = c
            elif '1.30' in raw and '2.20' in raw: period_cols[6] = c
            elif '2.20' in raw and '3.10' in raw: period_cols[7] = c
            elif '3.10' in raw and '4.00' in raw: period_cols[8] = c

        # 4. Parse Faculty Table
        faculty_raw_map = {}
        class_teacher = {"name": "", "phone": ""}
        for r in range(9, ws.max_row + 1):
            subj_name = str(ws.cell(r, day_col).value or ws.cell(r, day_col-1).value or '').strip()
            if not subj_name:
                continue
            fac_val = ""
            for c in range(day_col + 1, ws.max_column + 1):
                v = str(ws.cell(r, c).value or '').strip()
                if v and v != subj_name:
                    fac_val = v
                    break
            if fac_val:
                skey, _ = identify_subject_key(subj_name)
                phone = extract_phone(fac_val)
                name = clean_faculty_name(fac_val)
                if "CLASS TEACHER" in subj_name.upper():
                    class_teacher = {"name": name, "phone": phone}
                faculty_raw_map[skey] = {
                    "raw": fac_val,
                    "name": name,
                    "phone": phone,
                    "subjectTitle": subj_name
                }

        # 5. Build daily timetable (Monday - Saturday)
        days_schedule = {}
        day_names_order = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

        for r in range(3, 9):
            day_name = str(grid.get((r, day_col), '') or '').strip()
            if not day_name:
                continue
            # Normalize day name
            matched_day = next((d for d in day_names_order if d.lower() == day_name.lower()), day_name)
            days_schedule[matched_day] = {}

            for p in range(1, 9):
                c = period_cols.get(p)
                raw_cell = str(grid.get((r, c), '') or '').strip() if c else ""
                
                # Check for room in slot
                slot_room = main_room
                rm_bracket = re.search(r'\[([^\]]+)\]', raw_cell)
                rm_paren = re.search(r'\(([A-Z]\-?\d+[A-Z]?)\)', raw_cell)
                if rm_bracket:
                    slot_room = f"Room {rm_bracket.group(1).strip()}"
                elif rm_paren:
                    slot_room = f"Room {rm_paren.group(1).strip()}"

                skey, default_title = identify_subject_key(raw_cell)
                fac_info = faculty_raw_map.get(skey, {})
                fac_name = fac_info.get("name", "")
                fac_phone = fac_info.get("phone", "")

                # If break or empty
                if not raw_cell or "BREAK" in raw_cell.upper():
                    display_subj = "Recess / Break" if "BREAK" in raw_cell.upper() else "Free / Self Study"
                else:
                    display_subj = raw_cell

                time_slot = PERIOD_TIME_SLOTS[p-1]["time"]

                days_schedule[matched_day][str(p)] = {
                    "period": str(p),
                    "time": time_slot,
                    "raw": raw_cell,
                    "subject": display_subj,
                    "subjectKey": skey,
                    "room": slot_room,
                    "faculty": fac_name or ("Class Faculty" if raw_cell else ""),
                    "phone": fac_phone or ("+919000443503" if raw_cell else "")
                }

        all_sections[sec_num] = {
            "sectionNum": sec_num,
            "sectionName": f"Section {sec_num}",
            "room": main_room,
            "classTeacher": class_teacher,
            "faculties": faculty_raw_map,
            "timetable": days_schedule
        }

    return all_sections

if __name__ == "__main__":
    data = parse_all()
    print(f"Successfully parsed {len(data)} sections!")
    
    out_json = os.path.join(os.path.dirname(__file__), "..", "src", "data", "all_timetables.json")
    with open(out_json, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
    print(f"Wrote JSON to {out_json}")

    # Generate src/data/all_timetables.js
    out_js = os.path.join(os.path.dirname(__file__), "..", "src", "data", "all_timetables.js")
    with open(out_js, "w", encoding="utf-8") as f:
        f.write("/**\n * Official VFSTR Vadlamudi: 3rd Year CSE Timetables for All 22 Sections\n * Parsed directly from official spreadsheet: https://tinyurl.com/3rdyearTT2026\n */\n\n")
        f.write("export const ALL_SECTION_TIMETABLES = ")
        json.dump(data, f, indent=2)
        f.write(";\n\nexport default ALL_SECTION_TIMETABLES;\n")
    print(f"Wrote JS to {out_js}")
