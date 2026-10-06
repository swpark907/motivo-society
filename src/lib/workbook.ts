// 홈 시안용 콘텐츠. 발행된 커리큘럼이나 사용자 기록이 아니다.
export const missions = [
  {
    title: "지금의 나를 살펴보기",
    description: "잘하는 것과 궁금한 것을 꺼내 봐요.",
    time: "10분",
    prompt: "요즘 반복하는 일 하나와, AI와 함께 바꿔 보고 싶은 이유를 적어 보세요.",
    output: "바꿔 보고 싶은 일 한 문장",
    word: "DISCOVER",
    category: "Self",
  },
  {
    title: "작은 아이디어 정하기",
    description: "나에게 필요한 웹 도구를 그려 봐요.",
    time: "15분",
    prompt: "누가, 언제, 무엇 때문에 쓸 도구인가요? 꼭 필요한 기능을 하나만 골라 보세요.",
    output: "사용자와 핵심 기능 한 가지",
    word: "IMAGINE",
    category: "Work",
  },
  {
    title: "첫 화면 만들어 보기",
    description: "머릿속 생각을 작동하는 화면으로.",
    time: "30분",
    prompt:
      "앞에서 정한 기능을 설명하고 AI와 첫 화면을 만들어 보세요. 직접 눌러 보며 예상과 다른 점을 적어 보세요.",
    output: "첫 화면과 확인할 점",
    word: "MAKE",
    category: "Skill",
  },
  {
    title: "배운 것 남기기",
    description: "작은 발견도 다음 시도의 힌트가 돼요.",
    time: "10분",
    prompt: "잘된 것 하나, 막혔던 것 하나, 다음에 바꿀 것 하나를 적어 보세요.",
    output: "세 줄 회고",
    word: "REFLECT",
    category: "Creative",
  },
] as const;
export const categories = [
  {
    name: "Self",
    subtitle: "나를 알아가는 기록",
    idea: "내 관심사 지도 만들기",
    detail: "최근 저장한 글 세 개에서 공통 관심사를 찾아보세요.",
  },
  {
    name: "Work",
    subtitle: "일을 조금 더 가볍게",
    idea: "반복 업무 관찰 노트",
    detail: "이번 주 반복한 일을 적고 줄여 보고 싶은 한 단계를 골라보세요.",
  },
  {
    name: "Skill",
    subtitle: "직접 만들며 익히기",
    idea: "나만의 작은 웹 도구",
    detail: "기능 하나를 정하고 첫 화면을 만드는 연습입니다.",
  },
  {
    name: "Life",
    subtitle: "나만의 리듬 찾기",
    idea: "하루 15분 실험",
    detail: "부담 없이 이어갈 수 있는 시간과 작은 행동을 정해보세요.",
  },
  {
    name: "Creative",
    subtitle: "생각을 결과물로",
    idea: "수집에서 시작하는 아이디어",
    detail: "좋아하는 장면 세 개를 모아 만들고 싶은 것의 분위기를 설명해보세요.",
  },
] as const;
