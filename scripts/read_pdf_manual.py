# -*- coding: utf-8 -*-
import pdfplumber
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def read_pages(pdf_path, start_page, end_page):
    with pdfplumber.open(pdf_path) as pdf:
        for i in range(start_page - 1, min(end_page, len(pdf.pages))):
            page = pdf.pages[i]
            text = page.extract_text()
            if text:
                print(f"\n{'='*60}")
                print(f"페이지 {i+1}")
                print('='*60)
                print(text)

# 2차 검증: 학생창업유망팀300 평가기준 상세
pdf_path = r"C:\Users\chado\OneDrive\문서\양식 폴더\03_학생창업유망팀300\(2025-124)+2025+학생+창업유망팀+300++공고문.pdf"
print("="*80)
print("2차 검증: 학생창업유망팀300 평가기준 상세")
print("="*80)
read_pages(pdf_path, 4, 12)
