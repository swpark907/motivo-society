"use client";

import { applicationStages, type ApplicationStage } from "@/lib/workbook-application";
import { useEffect, useRef } from "react";
import { workbookClassPath, workbookLessonRoutes } from "@/lib/workbook-lesson-routes";
import { useWorkbookProgress } from "./WorkbookProgressContext";

// URL은 수업 진입 위치만 소유하고 작은 설명 위치와 입력은 공통 Provider에 남긴다.
export function useWorkbookLessonRoute() {
  const p = useWorkbookProgress();
  const latest = useRef(p);
  useEffect(() => {
    latest.current = p;
  }, [p]);
  const skip = useRef(false);
  useEffect(() => {
    function restore() {
      if (
        window.location.pathname !== workbookClassPath &&
        !workbookLessonRoutes.some((item) => item.path === window.location.pathname)
      )
        return;
      const state = latest.current;
      const route = workbookLessonRoutes.find((item) => item.path === window.location.pathname);
      skip.current = true;
      const search = new URLSearchParams(window.location.search);
      const view = search.get("view");
      const application = search.get("stage");
      state.setReviewView(
        !route && view === "summary"
          ? "summary"
          : !route &&
              view === "application" &&
              application &&
              Object.hasOwn(applicationStages, application)
            ? (application as ApplicationStage)
            : null,
      );
      state.setLessonUi((previous) => ({ ...previous, "active-practical": null }));
      if (route) {
        if (!state.purpose) state.setPurpose("explore");
        state.setScene(2);
        state.setMapWorld(route.world);
        state.setLesson(route.lesson);
        if (route.world === "ai") state.setCurrentStop(route.step);
        else if (route.world === "project") state.setProjectStop(route.step);
        else if (route.world === "experience") state.setExperienceStop(route.step);
        else if (route.world === "data") state.setDataStop(route.step);
        else state.setPublishStop(route.step);
      } else if (window.location.pathname === workbookClassPath) {
        state.setLesson(null);
        state.setScene(
          // 예전 링크의 view=examples도 같은 시작 화면(인트로)으로 연다.
          view === "intro" || view === "examples"
            ? 3
            : view === "map" || view === "summary" || view === "application"
              ? 2
              : 0,
        );
      }
    }
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);
  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    // 개발용으로 클래스를 삽입한 페이지의 주소는 유지한다.
    if (!window.location.pathname.startsWith(workbookClassPath)) return;
    const step =
      p.lesson !== null && p.lesson < 5
        ? p.lesson
        : p.mapWorld === "project"
          ? p.projectStop
          : p.mapWorld === "experience"
            ? p.experienceStop
            : p.mapWorld === "data"
              ? p.dataStop
              : p.publishStop;
    const route =
      p.scene === 2 && p.lesson !== null && p.reviewView === null
        ? workbookLessonRoutes.find((item) => item.lesson === p.lesson && item.step === step)
        : undefined;
    const path =
      route?.path ??
      `${workbookClassPath}${p.scene === 3 ? "?view=intro" : p.scene === 2 ? (p.reviewView === "summary" ? "?view=summary" : p.reviewView ? `?view=application&stage=${p.reviewView}` : "?view=map") : ""}`;
    if (window.location.pathname + window.location.search !== path)
      window.history.pushState(null, "", path);
  }, [
    p.scene,
    p.lesson,
    p.mapWorld,
    p.projectStop,
    p.experienceStop,
    p.dataStop,
    p.publishStop,
    p.reviewView,
  ]);
}
