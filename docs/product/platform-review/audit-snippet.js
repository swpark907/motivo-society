/**
 * 플랫폼 검수 자동 측정. 브라우저 도구의 javascript 실행에 파일 내용을 그대로 붙여 넣는다.
 * 마지막 식의 값(객체)이 결과다. 숫자는 출발점일 뿐 — 오탐(카드 전체를 덮는 링크 등)은 눈으로 거른다.
 * 체크 ID는 CHECKLIST.md와 같다.
 * 줄바꿈을 지킨 채 붙여 넣는다(// 주석이 있어 한 줄로 합치면 깨진다). 페이지를 스크롤하지 않는다.
 * 2026-11-10 /explore · /activities/vibe-season-4w 모바일 375에서 시험: 탭 바 위 여백 7px(LOG L12의 "8px 빠듯"과 일치).
 */
(() => {
  const vw = innerWidth;
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    // 접힌 <details> 안(요약 제외)은 크기가 잡혀도 보이지 않는다(로그인 화면 개발용 영역 오탐).
    const inClosedDetails = [...document.querySelectorAll("details:not([open])")].some(
      (d) => d.contains(el) && !d.querySelector(":scope > summary")?.contains(el),
    );
    return (
      r.width > 0 &&
      r.height > 0 &&
      cs.visibility !== "hidden" &&
      cs.display !== "none" &&
      !inClosedDetails
    );
  };
  const label = (el) =>
    (
      el.getAttribute("aria-label") ||
      el.getAttribute("title") ||
      el.innerText ||
      [...(el.labels ?? [])].map((l) => l.innerText).join(" ") ||
      el.getAttribute("placeholder") ||
      el.querySelector("img[alt]")?.alt ||
      ""
    )
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 40);
  const where = (el) => {
    const r = el.getBoundingClientRect();
    return `${el.tagName.toLowerCase()}「${label(el)}」 ${Math.round(r.width)}×${Math.round(r.height)} @y${Math.round(r.top + scrollY)}`;
  };
  const interactive = [
    ...document.querySelectorAll(
      "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab]",
    ),
  ].filter(visible);

  // M1 가로 스크롤
  const overflowX = document.documentElement.scrollWidth - vw;
  const wideEls =
    overflowX > 0
      ? [...document.querySelectorAll("body *")]
          .filter((el) => visible(el) && el.getBoundingClientRect().right > vw + 1)
          .slice(0, 8)
          .map(where)
      : [];

  // M2 누름 영역 44px (devtools 오버레이·next 표시 제외).
  // ::before/::after를 absolute로 띄워 영역을 넓힌 요소(예: 상단 "로그인")는 rect에 안 잡히므로
  // smallTargetsPseudo로 따로 모은다 — 대개 오탐, 가상 요소 inset을 눈으로 확인.
  const expandsByPseudo = (el) =>
    ["::before", "::after"].some((p) => {
      const cs = getComputedStyle(el, p);
      return cs.content !== "none" && cs.position === "absolute";
    });
  const small = interactive
    .filter((el) => !el.closest("nextjs-portal"))
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width < 44 || r.height < 44;
    });
  const smallTargets = small.filter((el) => !expandsByPseudo(el)).map(where);
  const smallTargetsPseudo = small.filter(expandsByPseudo).map(where);

  // M4 맨 아래까지 스크롤했을 때, 보이는 마지막 내용(글자·이미지·입력)과
  // 화면 아래쪽 고정 요소(탭 바·신청 바) 맨 위 사이 여백. 음수면 가린다.
  // 스크롤하지 않고 문서 좌표로 계산한다(숨은 창에서는 scrollTo가 끝까지 가지 않는다).
  // 글자 없는 빈 여백 요소(고정 바 자리 확보용)는 내용으로 세지 않는다(2026-11-10 오탐 확인).
  const bars = [...document.querySelectorAll("body *")].filter((el) => {
    const cs = getComputedStyle(el);
    return (
      (cs.position === "fixed" || cs.position === "sticky") &&
      visible(el) &&
      el.getBoundingClientRect().top > innerHeight / 2 &&
      !el.closest("nextjs-portal")
    );
  });
  const barZone =
    innerHeight - Math.min(innerHeight, ...bars.map((b) => b.getBoundingClientRect().top));
  const hasInk = (el) =>
    ["IMG", "SVG", "INPUT", "TEXTAREA", "SELECT", "BUTTON", "VIDEO", "CANVAS"].includes(
      el.tagName.toUpperCase(),
    ) || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  const main = document.querySelector("main") || document.body;
  const lastInkDoc = [...main.querySelectorAll("*")]
    .filter((el) => visible(el) && hasInk(el) && !bars.some((b) => b.contains(el)))
    .reduce((m, el) => Math.max(m, el.getBoundingClientRect().bottom + scrollY), 0);
  const bottomClearance = Math.round(document.documentElement.scrollHeight - barZone - lastInkDoc);

  // M5 작은 글자 · 입력창 글자
  const textEls = [
    ...document.querySelectorAll(
      "main p, main li, main span, main a, main dd, main td, main label",
    ),
  ].filter(
    (el) =>
      visible(el) &&
      el.childNodes.length &&
      [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()),
  );
  const smallText = textEls
    .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 12)
    .slice(0, 10)
    .map((el) => `${getComputedStyle(el).fontSize} ${where(el)}`);
  const smallInputs = [
    ...document.querySelectorAll(
      "input:not([type=checkbox]):not([type=radio]):not([type=hidden]), textarea, select",
    ),
  ]
    .filter((el) => visible(el) && parseFloat(getComputedStyle(el).fontSize) < 16)
    .map((el) => `${getComputedStyle(el).fontSize} ${where(el)}`);

  // K2 이름 없는 버튼·링크
  const unnamed = interactive
    .filter((el) => !label(el) && !el.getAttribute("aria-labelledby"))
    .map(where);

  // K5 제목 위계
  const headings = [...document.querySelectorAll("h1,h2,h3")]
    .filter(visible)
    .map((h) => `${h.tagName} ${h.innerText.trim().slice(0, 30)}`);
  const h1Count = headings.filter((h) => h.startsWith("H1")).length;

  // D1 오렌지(행동 색) 면을 가진 요소 수
  const rootCs = getComputedStyle(document.documentElement);
  const toRgb = (v) => {
    const d = document.createElement("div");
    d.style.color = v;
    document.body.appendChild(d);
    const c = getComputedStyle(d).color;
    d.remove();
    return c;
  };
  const oranges = ["--orange", "--orange-deep"]
    .map((n) => rootCs.getPropertyValue(n).trim())
    .filter(Boolean)
    .map(toRgb);
  const orangeEls = [...document.querySelectorAll("body *")].filter((el) => {
    if (!visible(el)) return false;
    const cs = getComputedStyle(el);
    return oranges.includes(cs.backgroundColor);
  });
  const orangeCount = orangeEls.length;
  const orangeList = orangeEls.slice(0, 6).map(where);

  // D3 그라디언트 · 그림자
  const all = [...document.querySelectorAll("main *")].filter(visible);
  const gradients = all
    .filter((el) => /gradient/.test(getComputedStyle(el).backgroundImage))
    .slice(0, 6)
    .map(where);
  const shadows = all
    .filter((el) => {
      const cs = getComputedStyle(el);
      return cs.boxShadow !== "none" || (cs.filter && cs.filter.includes("drop-shadow"));
    })
    .slice(0, 6)
    .map(where);

  // D4 라운드 종류(카드·버튼 일관성 참고용)
  const radii = {};
  all.forEach((el) => {
    const r = getComputedStyle(el).borderTopLeftRadius;
    if (r !== "0px") radii[r] = (radii[r] || 0) + 1;
  });

  // D5 깨진 이미지
  const brokenImages = [...document.images]
    .filter((img) => img.complete && img.naturalWidth === 0)
    .map((img) => img.alt || img.src);

  return {
    url: location.pathname + location.search,
    viewport: `${vw}×${innerHeight}`,
    M1_overflowX: overflowX,
    M1_wideEls: wideEls,
    M2_smallTargets: smallTargets,
    M2_smallTargetsPseudo: smallTargetsPseudo,
    M4_bottomClearance: bottomClearance,
    M5_smallText: smallText,
    M5_smallInputs: smallInputs,
    K2_unnamed: unnamed,
    K5_h1Count: h1Count,
    K5_headings: headings,
    D1_orangeCount: orangeCount,
    D1_orangeList: orangeList,
    D3_gradients: gradients,
    D3_shadows: shadows,
    D4_radii: radii,
    D5_brokenImages: brokenImages,
  };
})();
