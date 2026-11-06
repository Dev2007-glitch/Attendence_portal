import pdfplumber

with pdfplumber.open(r"C:\Users\Devi\.gemini\antigravity-ide\brain\fb3bec94-a103-4f24-9f1e-afd6315ab380\.user_uploaded\media_1793144578499.pdf") as pdf:
    p42 = pdf.pages[41]
    w_1000 = [w for w in p42.extract_words() if w['text'] == '1000'][0]
    words_1000 = [w for w in p42.extract_words() if abs(w['top'] - w_1000['top']) < 10]
    for w in sorted(words_1000, key=lambda x: x['x0']):
        print(f"{w['x0']:.1f}-{w['x1']:.1f}: {w['text']}")
