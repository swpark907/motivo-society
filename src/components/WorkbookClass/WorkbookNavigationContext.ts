"use client";

import { createContext } from "react";

// 클래스 시작 시 메뉴를 접되, 사용자가 다시 펼칠 수 있다.
export const WorkbookNavigationContext = createContext<(() => void) | null>(null);
