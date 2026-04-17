# Note Lock

macOS의 `chflags uchg`를 이용해 Obsidian 노트를 OS 레벨에서 잠금/해제하는 플러그인입니다.

> macOS 전용 플러그인입니다.

## 기능

- **토글 커맨드**: Command Palette에서 "Toggle note lock"으로 현재 노트 잠금/해제
- **상태바 표시**: 우측 하단에 현재 노트의 잠금 상태 실시간 표시, 클릭으로 토글
- **자동 뷰 전환**: 잠긴 노트를 열면 Reading View로 전환, 해제하면 Editing View로 복원
- **토스트 알림**: 잠금/해제 시 알림 표시

| 상태 | 상태바 |
|------|--------|
| 잠김 | 🔒 Locked |
| 안 잠김 | 🔓 Unlocked |

## 설치

1. 이 저장소를 빌드하거나 릴리즈에서 `main.js`, `manifest.json`, `styles.css`를 다운로드
2. vault의 `.obsidian/plugins/obsidian-note-lock/` 폴더에 세 파일을 복사
3. Obsidian → Settings → Community Plugins → **Note Lock** 활성화

```bash
cp -r obsidian-note-lock <your-vault>/.obsidian/plugins/note-lock
```

## 빌드

```bash
npm install
npm run build   # 프로덕션 빌드
npm run dev     # watch 모드
```

## 동작 원리

잠금 상태는 `fs.statSync`의 `mode` 필드에서 user write 비트(`0o200`)가 해제되어 있는지로 판별합니다.

- 잠금: `chmod a-w <파일경로>` (모든 사용자 쓰기 권한 제거)
- 해제: `chmod u+w <파일경로>` (소유자 쓰기 권한 복원)

파일 내용 편집은 차단되지만, 파일 이동/이름 변경은 디렉토리 권한에 따라 가능합니다.

## 요구사항

- macOS
- Obsidian 1.0.0 이상
