# Logitech OMM (Onboard Memory Manager) - Web Edition

웹 기반 로지텍 마우스 온보드 메모리 관리 도구입니다. WebHID API를 사용하여 브라우저에서 직접 마우스 설정을 관리할 수 있습니다.

🔗 **[Live Demo](https://hwkim3330.github.io/logitech/)**

## 주요 기능

- 🖱️ **DPI 설정**: 최대 5단계 DPI 프리셋 설정 (100 ~ 25,600 DPI)
- 🔘 **버튼 매핑**: 마우스 버튼에 기능/키/매크로 할당
- 🌈 **RGB 조명**: LED 색상 및 효과 설정 (고정, 숨쉬기, 색상 순환)
- ⚡ **폴링 레이트**: 125/250/500/1000 Hz 설정
- 💾 **프로필 관리**: 최대 3개의 온보드 프로필 저장
- 📤 **Import/Export**: JSON 형식으로 프로필 백업 및 복원

## 지원 마우스

HID++ 2.0 프로토콜을 지원하는 로지텍 게이밍 마우스:

| 모델 | PID | 최대 DPI |
|------|-----|----------|
| G502 Proteus Core | C07D | 12,000 |
| G502 HERO | C08B | 25,600 |
| G502 LIGHTSPEED | C08D | 25,600 |
| G502 X | C094 | 25,600 |
| G502 X LIGHTSPEED | C095 | 25,600 |
| G502 X PLUS | C096 | 25,600 |
| G PRO X SUPERLIGHT | C092 | 25,600 |
| G PRO Wireless | C088 | 25,600 |
| G403 Prodigy | C082 | 12,000 |
| G403 Hero | C083 | 25,600 |
| G305 | C090 | 12,000 |
| G203 Prodigy | C084 | 8,000 |
| G903 HERO | C539 | 25,600 |

## 사용 방법

1. **브라우저 요구사항**: Chrome 89+ 또는 Edge 89+ (WebHID API 지원)
2. 사이트 접속: https://hwkim3330.github.io/logitech/
3. "마우스 연결" 버튼 클릭
4. 장치 선택 대화상자에서 로지텍 마우스 선택
5. 설정 변경 후 "장치에 적용" 클릭

## 기술 스택

- **WebHID API**: 브라우저에서 HID 장치 직접 접근
- **HID++ 2.0**: 로지텍 고급 기능 프로토콜
- **Vanilla JavaScript**: 외부 의존성 없는 순수 JS
- **CSS3**: 모던 다크 테마 UI
- **Font Awesome**: 아이콘
- **Google Fonts (Inter)**: 타이포그래피

## 프로젝트 구조

```
logitech-omm/
├── index.html          # 메인 HTML
├── css/
│   └── styles.css      # 스타일시트
├── js/
│   ├── constants.js    # HID++ 상수 및 장치 정보
│   ├── hidpp.js        # HID++ 2.0 프로토콜 구현
│   ├── profile.js      # 프로필 관리자
│   ├── ui.js           # UI 컴포넌트
│   └── app.js          # 메인 애플리케이션
└── README.md
```

## 개발 환경 설정

```bash
# 레포지토리 클론
git clone https://github.com/hwkim3330/logitech.git
cd logitech

# 로컬 서버 실행 (Python)
python -m http.server 8000

# 또는 Node.js
npx serve
```

브라우저에서 `http://localhost:8000` 접속

> ⚠️ WebHID는 HTTPS 또는 localhost에서만 동작합니다.

## 참고 자료

- [omm.py](https://github.com/lexr1/omm.py) - Python 기반 OMM 구현
- [Logitech HID++ 2.0 Specification](https://lekensteyn.nl/files/logitech/)
- [WebHID API](https://developer.mozilla.org/en-US/docs/Web/API/WebHID_API)

## 주의사항

- ⚠️ 이 도구는 비공식 소프트웨어입니다
- ⚠️ 잘못된 설정으로 인한 문제는 사용자 책임입니다
- ⚠️ 일부 기능은 마우스 모델에 따라 지원되지 않을 수 있습니다

## 라이선스

MIT License

---

Made with ❤️ for Logitech mouse enthusiasts
