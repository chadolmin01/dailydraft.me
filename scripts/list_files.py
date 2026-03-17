# -*- coding: utf-8 -*-
import os
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

folders = [
    r"C:\Users\chado\OneDrive\문서\양식 폴더\05_오늘전통",
    r"C:\Users\chado\OneDrive\문서\양식 폴더\06_경기G스타오디션",
]

for folder in folders:
    print(f"\n{'='*60}")
    print(f"Folder: {folder}")
    print('='*60)
    if os.path.exists(folder):
        for f in os.listdir(folder):
            print(f"  - {f}")
    else:
        print("  (folder not found)")
