# -*- coding: utf-8 -*-
import os
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

base_path = r"C:\Users\chado\OneDrive\문서\양식 폴더\03_학생창업유망팀300"
if os.path.exists(base_path):
    for f in os.listdir(base_path):
        print(f"  - {f}")
