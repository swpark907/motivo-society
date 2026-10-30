"use client";

// 진단 선택은 안내만 바꾸며 학습 완료나 본인 확인 기록을 바꾸지 않는다.
import { useState } from "react";
import type { ApplicationStage } from "@/lib/workbook-application";
import styles from "./WorkbookLesson.module.scss";

const steps: Record<ApplicationStage, string[]> = {
  project: [
    "준비: 1-3 수업에서 준비한 Codex를 열어요. 로컬 프로젝트에 my-first-web 폴더를 연결하고 작업 위치가 This computer인지 확인해요. Windows는 탐색기, Mac은 Finder에서 같은 폴더를 찾아요.",
    "요청: 아래 내 기획의 초안을 고친 뒤 Codex에 전달해요. 이미 index.html이 있으면 그 파일을 고치도록 부탁해요. 파일이 없으면 제목·소개·목록·목록으로 이동하는 버튼을 한 파일로 만들어 달라고 해요.",
    "열기: 파일 변경 내용을 확인하고 저장된 index.html을 브라우저로 열어요. 도구가 실행 주소를 제공했다면 그 주소를 열어요. 내 컴퓨터에서 페이지를 확인하는 단계예요. 브라우저에서 열었다는 것만으로 다른 사람에게 공개된 것은 아니에요.",
    "확인: 내 제목·소개·목록이 보이고 버튼이 목록으로 이동하는지 눌러 봐요. 부탁한 파일만 바뀌었는지 확인한 뒤 아래 결과와 근거를 적어요.",
  ],
  experience: [
    "준비: 앞에서 만든 my-first-web의 index.html과 같은 Codex 프로젝트를 열어요. 현재 화면에서 잘리는 글·너무 붙은 요소·누르기 어려운 버튼을 하나 찾아요.",
    "요청: 작은 화면에서 생긴 문제와 원하는 결과를 아래 초안에 적어요. 제목·소개·목록·버튼 동작은 유지하고 필요한 배치만 고쳐 달라고 해요.",
    "비교: 변경한 파일을 저장하고 같은 페이지를 새로 열어요. 브라우저 창을 좁혔다 넓히며 긴 제목·링크가 잘리지 않는지, 버튼을 키보드 Tab으로 찾고 Enter로 누를 수 있는지 확인해요.",
    "확인: 이전 문제를 같은 폭에서 다시 확인해요. 고친 부분과 남은 문제를 적고 부탁하지 않은 내용이나 파일까지 바뀌지 않았는지 확인해요.",
  ],
  data: [
    "준비: 같은 index.html에서 필요한 동작 하나를 정해요. 소개 페이지라면 기존의 목록으로 이동하는 버튼만 확인해도 돼요. 입력이 필요하면 한 줄을 입력하고 버튼을 눌렀을 때 화면에 보이는 동작부터 시작해요.",
    "요청: 누가 무엇을 입력하거나 누르면 어디에 무엇이 보여야 하는지 적어요. 이 실습에서는 외부 저장·로그인 연결 없이 필요한 동작만 같은 파일에 추가하거나 고쳐 달라고 해요.",
    "확인: 빈 입력과 긴 입력도 넣고 버튼을 반복해서 눌러 봐요. 새로고침한 뒤 값이 사라지는지 확인해요. 잠시 보여 주는 값이라면 사라져도 괜찮고, 다음 방문에도 필요하다면 아직 저장 연결이 필요하다고 기록해요.",
    "판단: 다른 기기에서도 같은 값이 필요하면 내 컴퓨터 안의 화면만 확인해서는 충분하지 않아요. 필요한 저장 범위와 이유를 적고 실제 서버 저장 연결은 후속 작업으로 남겨요.",
  ],
  publish: [
    "준비: 내 컴퓨터에서 제목·목록·버튼과 두 화면 폭을 확인해요. 공개할 index.html과 필요한 이미지 등만 별도 공개용 폴더에 모아요. index.html은 그 폴더의 맨 위에 두고 비밀번호·비밀 키·개인 자료는 넣지 않아요.",
    "첫 공개: 기존 강의의 Vercel Drop 경로를 사용해요. 본인이 계정·이용 조건을 확인한 뒤 Drop 페이지에 공개용 폴더를 올리고 팀과 프로젝트 이름을 선택해 Deploy를 눌러요. 실제 파일이 외부 서비스에 업로드·공개되는 단계이며 이 워크북은 대신 실행하지 않아요.",
    "접속 확인: 서비스가 제공한 실제 주소를 내 브라우저와 다른 기기에서 열고 제목·이미지·버튼을 확인해요. localhost 주소는 공유하지 않아요. 주소가 있다는 사실만으로 다른 사람의 접속까지 확인한 것은 아니에요.",
    "수정 공개: 파일 변경 이력을 관리하는 Git에 연결하지 않은 기존 프로젝트는 Vercel 대시보드의 해당 프로젝트에 수정한 공개용 폴더를 올려 갱신할 수 있어요. Drop 시작 페이지에 다시 올리면 새 프로젝트가 생겨요. 갱신 결과의 주소와 고친 부분을 다시 확인하고 아래에 근거를 적어요.",
  ],
};

export function WorkbookApplicationGuide({ stage }: { stage: ApplicationStage }) {
  const [diagnosis, setDiagnosis] = useState<"file" | "screen" | "failed" | null>(null);
  const publish = stage === "publish";
  return (
    <section className={styles.practiceStage} aria-label="내 파일 실습 안내">
      <h3>{publish ? "내 페이지를 공개할 때의 순서" : "내 파일에서 해 볼 순서"}</h3>
      <p>컴퓨터에서 따라 하는 안내예요. 예시만 복습한다면 읽고 다음으로 가도 돼요.</p>
      <ol className={styles.decisionSteps}>
        {steps[stage].map((step) => (
          <li key={step}>
            <strong>{step.slice(0, step.indexOf(":"))}</strong>
            <span>{step.slice(step.indexOf(":") + 1).trim()}</span>
          </li>
        ))}
      </ol>
      <p>
        <strong>막히면 먼저 확인해요.</strong>{" "}
        {publish
          ? "실패 상태라면 서비스의 배포 기록에서 오류를 읽어요. 404는 찾는 페이지가 없다는 응답이에요. 첫 화면이 404라면 공개 폴더의 맨 위에 index.html이 있는지 확인해요. 로그인이 필요하면 공유 대상과 접근 조건을 확인하고 접속 성공으로 기록하지 않아요."
          : "파일이 없으면 Codex가 선택한 폴더와 탐색기/Finder의 폴더가 같은지 확인해요. 화면이 그대로면 저장 여부·열어 둔 파일이나 실행 주소·새로고침을 차례로 확인해요."}
      </p>
      <details className={styles.preparationMore}>
        <summary>{publish ? "배포 기록(로그) 뜻과 예시" : "파일 경로 뜻과 예시"}</summary>
        <p>
          {publish
            ? "배포 기록은 서비스가 파일을 올리고 사이트를 만드는 동안 남긴 메시지예요. 실패했다면 실패 상태와 오류 문장을 수정 요청에 함께 적어요. 비밀 키나 개인정보가 있으면 지우고 전달해요."
            : "파일 경로는 파일이 들어 있는 위치예요. my-first-web/index.html은 my-first-web 폴더 안의 index.html을 뜻해요. 이름이 같아도 다른 폴더의 파일을 열면 수정한 화면이 보이지 않을 수 있어요."}
        </p>
      </details>
      <p>어디부터 살펴볼까요? 눌러 보는 것은 선택이며 완료 기록에 영향을 주지 않아요.</p>
      <div className={styles.choices} role="group" aria-label="막힌 상황 선택">
        <button
          className={styles.choice}
          aria-pressed={diagnosis === "file"}
          onClick={() => setDiagnosis("file")}
        >
          {publish ? "첫 주소가 404예요" : "파일이 안 보여요"}
        </button>
        <button
          className={styles.choice}
          aria-pressed={diagnosis === "screen"}
          onClick={() => setDiagnosis("screen")}
        >
          {publish ? "고친 화면이 안 보여요" : "고쳤는데 화면이 그대로예요"}
        </button>
        {publish && (
          <button
            className={styles.choice}
            aria-pressed={diagnosis === "failed"}
            onClick={() => setDiagnosis("failed")}
          >
            배포가 실패했어요
          </button>
        )}
      </div>
      <p className={styles.quizFeedback} aria-live="polite">
        {diagnosis === "file"
          ? publish
            ? "404는 주소에 맞는 페이지를 찾지 못했다는 뜻이에요. 주소나 파일 위치가 다를 수 있어요. 서비스에서 받은 배포 주소를 그대로 다시 열고 공개 폴더 맨 위의 index.html을 확인해요. 폴더가 잘못됐다면 올바른 폴더로 다시 공개한 뒤 받은 주소에서 제목·목록·버튼을 확인해요. 계속 404라면 확인한 주소와 오류 문장을 문제 기록에 남겨요."
            : "Codex의 프로젝트 폴더와 탐색기/Finder의 my-first-web을 비교해요. 파일 생성이 끝났는지, 이름이 index.html.txt로 저장되지 않았는지도 확인해요."
          : diagnosis === "screen"
            ? publish
              ? "내 파일 수정과 공개 화면 갱신은 별개예요. 내 파일 저장 → 해당 프로젝트의 새 배포 완료 → 새 배포의 주소 열기 순서로 확인해요. 고친 제목·목록·버튼을 다시 눌러봐요. 여전히 이전 화면이면 열어 본 주소·배포 상태·달라지지 않은 부분을 문제 기록에 남겨요."
              : "수정한 파일 저장 → 같은 파일이나 실행 주소 열기 → 새로고침 순서로 확인해요. 다른 폴더의 index.html을 열고 있지 않은지도 살펴봐요."
            : diagnosis === "failed" && publish
              ? "배포가 실패했다면 공개 준비가 끝난 상태가 아니에요. 서비스의 배포 기록을 열어 오류 문장과 실패한 단계를 확인해요. 기록이 없다면 화면의 오류 안내를 읽어요. 그 문장과 기대했던 결과를 함께 전달해 수정할 부분을 좁혀요. 수정 뒤 다시 배포하고 성공 상태인지 확인한 다음, 받은 주소에서 제목·목록·버튼을 확인해요. 같은 오류가 나면 그 문장을 다음 문제 기록에 남겨요."
              : "직접 확인한 문제에 맞는 항목을 고를 수 있어요."}
      </p>
      <p>
        공식 안내 확인: 2026-10-08 · 아래 링크는 외부 문서예요. 버튼 이름·지원 조건이 달라졌다면
        최신 문서를 확인해요.{" "}
        {publish ? (
          <a href="https://vercel.com/docs/drop" target="_blank" rel="noreferrer">
            Vercel Drop 공식 안내
          </a>
        ) : (
          <>
            <a href="https://learn.chatgpt.com/docs/projects" target="_blank" rel="noreferrer">
              Codex 프로젝트·폴더 안내
            </a>
            {" · "}
            <a
              href="https://learn.chatgpt.com/docs/environments/modes"
              target="_blank"
              rel="noreferrer"
            >
              내 컴퓨터 작업 위치 안내
            </a>
          </>
        )}
      </p>
    </section>
  );
}
