import pdfplumber
import re
import json
import os

pdf_path = r"C:\Users\Devi\.gemini\antigravity-ide\brain\fb3bec94-a103-4f24-9f1e-afd6315ab380\.user_uploaded\media_1793144578499.pdf"

def clean_counsellor(c):
    c = c.replace('\n', ' ').strip()
    c = re.sub(r'\s+', ' ', c)
    if 'ELIZABETH' in c.upper() and 'KORRAPATI' in c.upper():
        return "Ms. Korrapati Christiana Rose Elizabeth"
    if 'gujjula murali' in c.lower():
        return "Mr. Gujjula Murali"
    if 'upalanchi vara lakshmi' in c.lower():
        return "Ms. Upalanchi Vara Lakshmi"
    if 'adnan ahmad khan' in c.lower():
        return "Mr. Adnan Ahmad Khan"
    if 'yechu harshitha' in c.lower():
        return "Ms. Yechu Harshitha"
    if 'gaddam tejaswi' in c.lower():
        return "Ms. Gaddam Tejaswi"
    if 'renugadevi' in c.lower():
        return "Dr. R. Renugadevi"
    if 'allamudi kalyan babu' in c.lower():
        return "Mr. Allamudi Kalyan Babu"
    if 'peeka anusha' in c.lower():
        return "Ms. Peeka Anusha"
    if 'vishal jaiswal' in c.lower():
        return "Mr. Vishal Jaiswal"
    if 'phanindra thota' in c.lower():
        return "Dr. Phanindra Thota"
    if 'lalu naick bhukya' in c.lower():
        return "Mr. Lalu Naick Bhukya"
    if 'prathap kumar' in c.lower():
        return "Dr. R. Prathap Kumar"
    if 'raja rao' in c.lower():
        return "Dr. M. Raja Rao"
    if 'koppula anitha' in c.lower():
        return "Ms. Koppula Anitha"
    if 'shashi mani' in c.lower():
        return "Mr. Shashi Mani"
    if 'sikindar' in c.lower():
        return "Mr. Sk. Sikindar"
    if 'kandula divya' in c.lower():
        return "Ms. Kandula Divya"
    if 'bhaskar' in c.lower():
        return "Dr. O. Bhaskar"
    if 'vyshnavi kagga' in c.lower():
        return "Ms. Vyshnavi Kagga"
    if 'balu narasimha rao' in c.lower():
        return "Dr. G. Balu Narasimha Rao"
    if 'varagani tejaswi' in c.lower():
        return "Mrs. Varagani Tejaswi"
    if 'ongole gandhi' in c.lower():
        return "Mr. Ongole Gandhi"
    if 'munipalli veerendra' in c.lower():
        return "Mr. Munipalli Veerendra"
    if 'khadersha' in c.lower():
        return "Mr. Sk. Khadersha"
    if 'bhimavarapu jyothika' in c.lower():
        return "Ms. Bhimavarapu Jyothika"
    if 'bathula anil babu' in c.lower():
        return "Mr. Bathula Anil Babu"
    if 'palavelli vamsi krishna' in c.lower():
        return "Mr. Palavelli Vamsi Krishna"
    if 'tipura' in c.lower():
        return "Mrs. D. Tipura"
    if 'guggilam navya' in c.lower():
        return "Mrs. Guggilam Navya"
    if 'anusha kakumanu' in c.lower():
        return "Mrs. Anusha Kakumanu"
    if 'deepikasri' in c.lower():
        return "Ms. Kunapareddy Deepikasri Sai"
    if 'ravuri lalitha' in c.lower():
        return "Ms. Ravuri Lalitha"
    if 'dega balakotaiah' in c.lower():
        return "Mr. Dega Balakotaiah"
    if 'swathi koganti' in c.lower():
        return "Ms. Swathi Koganti"
    if 'sai eswari' in c.lower():
        return "Ms. Yalavarthi Sai Eswari"
    if 'rama mohan' in c.lower():
        return "Mr. Y. Rama Mohan"
    if 'chinna gopi' in c.lower():
        return "Dr. Simhadri Chinna Gopi"
    if 'ramanjaneyulu' in c.lower():
        return "Mr. G. Ramanjaneyulu"
    if 'madugula anil' in c.lower():
        return "Mr. Madugula Anil"
    if 'gopya sri' in c.lower():
        return "Ms. Arumalla Gopya Sri"
    if 'cheggu manasa' in c.lower():
        return "Ms. Cheggu Manasa"
    if 'kareena yashmin' in c.lower():
        return "Ms. Shaik Kareena Yashmin"
    if 'raj kiran' in c.lower():
        return "Mr. Kudupudi Raj Kiran"
    if 'senthil' in c.lower():
        return "Mr. D. Senthil"
    if 'athota padmaja' in c.lower():
        return "Ms. Athota Padmaja"
    if 'kanna hareesh' in c.lower():
        return "Mr. Kanna Hareesh"
    if 'chennamsetty naga gopi' in c.lower():
        return "Mr. Chennamsetty Naga Gopi"
    if 'venkata rajulu' in c.lower():
        return "Mr. P. Venkata Rajulu"
    if 'shaik dehtaj' in c.lower():
        return "Mr. Shaik Dehtaj"
    if 'akhilandeswari' in c.lower():
        return "Ms. Nase Bandhike Akhilandeswari"
    if 'annam durga bhavani' in c.lower():
        return "Ms. Annam Durga Bhavani"
    if 'veeranjaneyulu' in c.lower():
        return "Dr. J. Veeranjaneyulu"
    return c.title()

students = []

with pdfplumber.open(pdf_path) as pdf:
    for page_idx, page in enumerate(pdf.pages):
        words = page.extract_words()
        
        # Row anchors: column 0 (x0 < 148) integer
        row_anchors = []
        for w in words:
            if w['x0'] < 148 and re.match(r'^\d+$', w['text']):
                sl = int(w['text'])
                if sl > 0 and sl <= 1511:
                    row_anchors.append((sl, w['top'], w['bottom']))
                    
        row_anchors.sort(key=lambda x: x[1])
        
        for idx, (sl, a_top, a_bottom) in enumerate(row_anchors):
            # Roll words in [a_top - 5.5, a_top + 13.5]
            roll_words = [w['text'] for w in sorted(words, key=lambda x: (x['top'], x['x0'])) 
                          if 148 <= w['x0'] < 205 and -5.5 <= (w['top'] - a_top) <= 13.5]
            
            # Name words in [a_top - 5.5, a_top + 13.5]
            name_words = [w['text'] for w in sorted(words, key=lambda x: (x['top'], x['x0'])) 
                          if 205 <= w['x0'] < 484 and -5.5 <= (w['top'] - a_top) <= 13.5]
            
            # Sec words in [a_top - 5.5, a_top + 13.5]
            sec_words = [w['text'] for w in sorted(words, key=lambda x: (x['top'], x['x0'])) 
                         if 484 <= w['x0'] < 505 and -5.5 <= (w['top'] - a_top) <= 13.5]
            
            # Counsellor words in [a_top - 5.5, a_top + 13.5]
            counsellor_words = [w['text'] for w in sorted(words, key=lambda x: (x['top'], x['x0'])) 
                                if w['x0'] >= 505 and -5.5 <= (w['top'] - a_top) <= 13.5]
            
            raw_roll = "".join(roll_words).replace(" ", "").upper()
            raw_name = " ".join(name_words).strip().upper()
            raw_sec = "".join(sec_words).strip()
            raw_counsellor = " ".join(counsellor_words).strip()
            
            sec_match = re.search(r'\d+', raw_sec)
            sec_num = int(sec_match.group(0)) if sec_match else 1
            
            roll_match = re.search(r'[0-9]{2,3}[A-Za-z]{2,3}[0-9A-Za-z]+', raw_roll)
            roll = roll_match.group(0).upper() if roll_match else raw_roll
            
            counsellor = clean_counsellor(raw_counsellor)
            
            students.append({
                "id": roll,
                "slNo": sl,
                "roll": roll,
                "name": raw_name,
                "section": f"Section {sec_num}",
                "sectionNum": sec_num,
                "counsellor": counsellor
            })

print(f"Total extracted by coords: {len(students)}")
invalid = [s for s in students if len(s['roll']) != 10]
print(f"Invalid roll count: {len(invalid)}")

# Print section distribution
sections = {}
for s in students:
    sec = s["sectionNum"]
    sections[sec] = sections.get(sec, 0) + 1
print("Sections count distribution:")
for sec, cnt in sorted(sections.items()):
    print(f"Section {sec}: {cnt} students")

# Save JSON
base_dir = r"c:\Users\Devi\Downloads\Attendance-Porta-main\Attendance-Porta-main"
out_json = os.path.join(base_dir, "src", "data", "all_students.json")
out_server_json = os.path.join(base_dir, "server", "students.json")

with open(out_json, "w", encoding="utf-8") as f:
    json.dump(students, f, indent=2, ensure_ascii=False)

with open(out_server_json, "w", encoding="utf-8") as f:
    json.dump(students, f, indent=2, ensure_ascii=False)

# Build Sections Metadata
sections_meta = {}
counsellor_map = {}

for s in students:
    sec = s["sectionNum"]
    if sec not in sections_meta:
        sections_meta[sec] = {
            "section": f"Section {sec}",
            "sectionNum": sec,
            "room": f"Room N-40{sec % 10 + 1}",
            "studentCount": 0,
            "counsellors": set(),
            "firstRoll": s["roll"],
            "lastRoll": s["roll"]
        }
    sections_meta[sec]["studentCount"] += 1
    sections_meta[sec]["counsellors"].add(s["counsellor"])
    sections_meta[sec]["lastRoll"] = s["roll"]

    c = s["counsellor"]
    if c not in counsellor_map:
        counsellor_map[c] = {
            "name": c,
            "sections": set(),
            "studentCount": 0
        }
    counsellor_map[c]["sections"].add(sec)
    counsellor_map[c]["studentCount"] += 1

sections_list = []
for sec_num in sorted(sections_meta.keys()):
    item = sections_meta[sec_num]
    item["counsellors"] = sorted(list(item["counsellors"]))
    item["classTeacher"] = item["counsellors"][0] if item["counsellors"] else "Class Teacher"
    sections_list.append(item)

counsellor_list = []
for c_name in sorted(counsellor_map.keys()):
    c_item = counsellor_map[c_name]
    c_item["sections"] = sorted(list(c_item["sections"]))
    counsellor_list.append(c_item)

meta_path = os.path.join(base_dir, "src", "data", "sections_meta.json")
with open(meta_path, "w", encoding="utf-8") as f:
    json.dump({
        "totalStudents": len(students),
        "totalSections": len(sections_list),
        "sections": sections_list,
        "counsellors": counsellor_list
    }, f, indent=2, ensure_ascii=False)

print("Saved metadata successfully.")
