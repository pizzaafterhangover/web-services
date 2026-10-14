# web-services

Physical AI를 공부하며 정리한 개념과 실험 기록을 모아 두는 개인 노트 사이트입니다.
Astro 7 정적 사이트이며 GitHub Pages로 배포됩니다.

- 주소: https://pizzaafterhangover.github.io/web-services/
- 수식(KaTeX), 다이어그램(Mermaid), 그래프·인터랙티브 위젯(Preact + Observable Plot), 이미지·영상 지원

## 로컬 실행

Node 22 이상이 필요합니다(`.nvmrc`).

```bash
nvm use
npm install
npm run dev      # http://localhost:4321/web-services/
npm run build    # dist/ 생성
```

## 새 글 추가

1. `src/content/notes/_template.mdx`를 복사해 `src/content/notes/<분류id>/<영문-슬러그>.mdx`로 저장합니다.
2. 맨 위 frontmatter를 채웁니다.

   | 항목 | 설명 |
   | --- | --- |
   | `title`, `description` | 제목과 목록에 보일 요약 |
   | `category` | `src/data/categories.ts`의 `id` 중 하나 (틀리면 빌드 실패) |
   | `tags` | 자유 태그. 태그 페이지가 자동 생성됨 |
   | `date`, `updated` | 작성일 / 수정일 |
   | `status` | `학습중` 또는 `정리완료` |
   | `draft` | `true`면 사이트에 나타나지 않음 |

3. 본문에서 쓸 수 있는 요소는 `_template.mdx`에 예시가 모두 있습니다.
   - `Callout`(정의·핵심·주의·실험 메모), `Figure`, `Video` — import 없이 사용
   - `Chart`, `src/components/widgets/`의 위젯 — import 후 `client:visible`
   - 수식 `$...$`, `$$...$$` / 다이어그램 ```` ```mermaid ````
4. 이미지는 `src/assets/notes/<분류id>/`에 넣고 import 하면 자동 최적화됩니다.
   큰 영상은 YouTube 등에 올리고 링크만 넣습니다.

## 새 분류 추가

`src/data/categories.ts` 배열에 한 줄을 추가하고, `src/styles/tokens.css`에 `--cat-<color>` 색을 라이트/다크 각각 정의합니다.
하위 분류로 만들려면 그 줄에 `parent: '<상위 분류 id>'`를 넣습니다(예: `slam`은 `ros2`의 하위 분류). 상위 분류 페이지에는 하위 분류의 글도 함께 나옵니다.

## 배포

`main`에 push하면 `.github/workflows/deploy.yml`이 빌드해 GitHub Pages에 올립니다.
처음 한 번은 저장소 **Settings → Pages → Source**를 **GitHub Actions**로 설정해야 합니다.
