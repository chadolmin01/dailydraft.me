# -*- coding: utf-8 -*-
"""
HTML을 PDF로 변환하는 스크립트 (Playwright 사용)
"""

import asyncio
import os
import sys
import io

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

async def convert_html_to_pdf(html_path, pdf_path):
    from playwright.async_api import async_playwright

    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # HTML 파일 로드
        file_url = f"file:///{html_path.replace(os.sep, '/')}"
        await page.goto(file_url)

        # PDF로 저장
        await page.pdf(
            path=pdf_path,
            format="A4",
            margin={
                "top": "20mm",
                "right": "20mm",
                "bottom": "20mm",
                "left": "20mm"
            },
            print_background=True
        )

        await browser.close()
        print(f"PDF 생성 완료: {pdf_path}")

def main():
    # 경로 설정
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    html_path = os.path.join(base_dir, "docs", "test_business_plan.html")
    pdf_path = os.path.join(base_dir, "docs", "test_business_plan.pdf")

    if not os.path.exists(html_path):
        print(f"HTML 파일을 찾을 수 없습니다: {html_path}")
        print("먼저 test_business_plan.py를 실행해주세요.")
        return

    print(f"HTML 파일: {html_path}")
    print(f"PDF 출력: {pdf_path}")
    print()
    print("PDF 변환 중...")

    # Windows에서 이벤트 루프 설정
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

    asyncio.run(convert_html_to_pdf(html_path, pdf_path))

if __name__ == "__main__":
    main()
