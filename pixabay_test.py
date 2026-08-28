#!/usr/bin/env python3
"""
Pixabay 이미지 검색 테스트 스크립트
- 한글 주제를 영어 키워드로 검색해 이미지를 찾는 흐름을 검증합니다.
- 본 세션 실행환경은 pixabay.com 접속이 막혀 있어, 사용자 PC/서버에서 실행하세요.

사용법:
    export PIXABAY_API_KEY="본인_API_키"     # 키를 코드에 넣지 말 것!
    python3 pixabay_test.py 결혼 축의금

동작:
    1) 입력한 한글 키워드를 아래 사전으로 영어로 변환 (실제 프로그램에선 AI가 변환)
    2) 각 영어 키워드로 Pixabay 검색
    3) 이미지 URL·태그·저작권 안전 여부를 출력
"""
import os
import sys
import json
from urllib.parse import urlencode
from urllib.request import urlopen

# 데모용 한글→영어 키워드 사전.
# 실제 프로그램에서는 이 부분을 Claude API로 대체:
#   "다음 주제의 이미지 검색용 영어 키워드 3~5개를 콤마로: {주제}"
KO_TO_EN = {
    "결혼": ["wedding", "marriage", "bride and groom", "couple"],
    "축의금": ["wedding gift money", "cash envelope", "money gift"],
    "신혼부부": ["newlyweds", "young couple", "honeymoon"],
    "저출생": ["birth rate", "baby", "family"],
    "정부": ["government", "policy", "korea government"],
}


def to_english(ko_word: str) -> list[str]:
    """한글 키워드를 영어 후보로 변환. 사전에 없으면 원문 그대로 시도."""
    return KO_TO_EN.get(ko_word, [ko_word])


def search_pixabay(api_key: str, query: str, per_page: int = 3) -> dict:
    params = urlencode({
        "key": api_key,
        "q": query,
        "image_type": "photo",
        "safesearch": "true",
        "per_page": per_page,
        "order": "popular",
    })
    url = f"https://pixabay.com/api/?{params}"
    with urlopen(url, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> None:
    api_key = os.environ.get("PIXABAY_API_KEY")
    if not api_key:
        sys.exit("환경변수 PIXABAY_API_KEY 가 설정되지 않았습니다. "
                 'export PIXABAY_API_KEY="키" 후 다시 실행하세요.')

    ko_words = sys.argv[1:] or ["결혼"]
    print(f"입력 한글 키워드: {', '.join(ko_words)}\n")

    seen = set()  # 중복 이미지 제거용
    for ko in ko_words:
        en_list = to_english(ko)
        print(f"◼ '{ko}' → 영어 키워드: {', '.join(en_list)}")
        for en in en_list:
            try:
                data = search_pixabay(api_key, en)
            except Exception as e:  # noqa: BLE001
                print(f"    [{en}] 요청 실패: {e}")
                continue
            total = data.get("total", 0)
            hits = data.get("hits", [])
            print(f"    [{en}] 검색 결과 {total:,}건")
            for h in hits:
                u = h["largeImageURL"]
                if u in seen:
                    continue
                seen.add(u)
                print(f"        - {h['tags']}")
                print(f"          {u}")
        print()

    print(f"총 {len(seen)}개의 고유 이미지 후보를 찾았습니다.")
    print("※ Pixabay 이미지는 상업적 사용 무료지만, 발행 전 저작권/출처를 최종 확인하세요.")


if __name__ == "__main__":
    main()
