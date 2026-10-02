"use client";

// Canvas interaction and local progress live entirely in the browser.
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { findColoringRegions, type ColoringMap } from "@/lib/coloring";
import styles from "./ColoringDemo.module.scss";

const KEY = "motivo-coloring-garden-v1";
const PALETTE = [
  ["장미", "#d7758c"],
  ["산호", "#e89472"],
  ["꿀", "#e4bb64"],
  ["크림", "#eddfbb"],
  ["이끼", "#77916a"],
  ["숲", "#355f50"],
  ["물", "#86bbbf"],
  ["하늘", "#8ba7ce"],
  ["밤", "#425d86"],
  ["등나무", "#aa8bc2"],
  ["흙", "#a17f69"],
  ["돌", "#b8b4a9"],
] as const;
type Colors = Record<string, string>;

export function ColoringDemo() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const original = useRef<Uint8ClampedArray | null>(null);
  const history = useRef<Colors[]>([]);
  const down = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const [map, setMap] = useState<ColoringMap | null>(null);
  const [colors, setColors] = useState<Colors>({});
  const [color, setColor] = useState<string>(PALETTE[0][1]);
  const [zoom, setZoom] = useState(1);
  const [reference, setReference] = useState(false);
  const [moving, setMoving] = useState(false);
  const [region, setRegion] = useState(0);
  const [message, setMessage] = useState("도안의 작은 칸을 준비하고 있어요.");

  useEffect(() => {
    let cancelled = false;
    const image = new window.Image();
    image.onload = () => {
      if (cancelled || !canvas.current) return;
      const target = canvas.current;
      target.width = image.naturalWidth;
      target.height = image.naturalHeight;
      const context = target.getContext("2d", { willReadFrequently: true });
      if (!context) {
        setMessage("이 브라우저에서는 도안을 열 수 없어요.");
        return;
      }
      context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, target.width, target.height).data;
      original.current = pixels;
      const nextMap = findColoringRegions(pixels, target.width, target.height);
      let saved: Colors = {};
      try {
        const raw: unknown = JSON.parse(localStorage.getItem(KEY) ?? "{}");
        if (raw && typeof raw === "object" && !Array.isArray(raw)) {
          saved = Object.fromEntries(
            Object.entries(raw).filter(
              ([id, value]) =>
                /^\d+$/.test(id) &&
                Number(id) < nextMap.seeds.length &&
                typeof value === "string" &&
                /^#[0-9a-f]{6}$/i.test(value),
            ),
          );
        }
      } catch {
        /* A damaged or unavailable save starts a fresh page. */
      }
      setColors(saved);
      setMap(nextMap);
      setMessage("색을 고르고 칸을 눌러보세요. 작은 칸은 확대하면 편해요.");
    };
    image.onerror = () => {
      if (!cancelled) setMessage("도안을 불러오지 못했어요. 새로고침해 주세요.");
    };
    image.src = "/coloring-book/garden-lines-v1.png";
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!map || !original.current || !canvas.current) return;
    const context = canvas.current.getContext("2d");
    if (!context) return;
    const output = new Uint8ClampedArray(original.current);
    const rgb = Object.fromEntries(
      Object.entries(colors).map(([id, hex]) => [
        id,
        [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)),
      ]),
    );
    for (let p = 0; p < map.ids.length; p++) {
      const value = rgb[map.ids[p]];
      if (!value) continue;
      for (let channel = 0; channel < 3; channel++) {
        output[p * 4 + channel] = (original.current[p * 4 + channel] * value[channel]) / 255;
      }
    }
    context.putImageData(new ImageData(output, map.width, map.height), 0, 0);
    try {
      localStorage.setItem(KEY, JSON.stringify(colors));
    } catch {
      queueMicrotask(() =>
        setMessage("브라우저 저장을 사용할 수 없어요. 나가기 전에 PNG로 저장해 주세요."),
      );
    }
  }, [colors, map]);

  function paint(id: number) {
    if (!map || id < 0 || id >= map.seeds.length || colors[id] === color) return;
    history.current.push(colors);
    if (history.current.length > 100) history.current.shift();
    setColors({ ...colors, [id]: color });
    setRegion(id);
  }

  return (
    <main className={styles.root}>
      <header className={styles.header}>
        <p className="label">WORKBOOK / COLORING EXPERIMENT 01</p>
        <h1>비밀 정원</h1>
        <p>꽃잎 하나부터, 나만의 풍경으로.</p>
      </header>
      <div className={styles.workspace}>
        <aside className={styles.tools} aria-label="색칠 도구">
          <h2>오늘의 색</h2>
          <div className={styles.palette}>
            {PALETTE.map(([name, hex]) => (
              <button
                key={hex}
                type="button"
                aria-label={name}
                aria-pressed={color === hex}
                className={styles.swatch}
                style={{ backgroundColor: hex }}
                onClick={() => setColor(hex)}
              />
            ))}
          </div>
          <label className={styles.custom}>
            직접 고르기{" "}
            <input
              aria-label="사용자 색상"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
          </label>
          <div className={styles.actions}>
            <button
              disabled={!map}
              onClick={() => {
                const previous = history.current.pop();
                if (previous) setColors(previous);
              }}
            >
              되돌리기
            </button>
            <button
              disabled={!map}
              onClick={() => {
                if (window.confirm("칠한 색을 모두 지울까요? 되돌리기로 복원할 수 있어요.")) {
                  history.current.push(colors);
                  setColors({});
                }
              }}
            >
              처음부터
            </button>
            <button
              disabled={!map}
              onClick={() => {
                if (!canvas.current) return;
                const link = document.createElement("a");
                link.download = "나의-비밀-정원.png";
                link.href = canvas.current.toDataURL("image/png");
                link.click();
              }}
            >
              PNG 저장
            </button>
          </div>
          <p className={styles.progress} data-testid="coloring-progress">
            {Object.keys(colors).length.toLocaleString()} /{" "}
            {map?.seeds.length.toLocaleString() ?? "…"}칸
          </p>
          <p className={styles.note}>
            이 브라우저에 자동 저장돼요.
            <br />
            완성 시간은 아직 검증하지 않은 실험 도안이에요.
          </p>
          <details className={styles.keyboard}>
            <summary>키보드로 색칠하기</summary>
            <label>
              칸 번호{" "}
              <input
                type="number"
                min={1}
                max={map?.seeds.length ?? 1}
                value={region + 1}
                onChange={(event) =>
                  setRegion(
                    Math.max(
                      0,
                      Math.min((map?.seeds.length ?? 1) - 1, Number(event.target.value) - 1),
                    ),
                  )
                }
              />
            </label>
            <button disabled={!map} onClick={() => paint(region)}>
              선택한 칸 채우기
            </button>
          </details>
        </aside>
        <section className={styles.drawing} aria-label="정원 도안">
          <div className={styles.toolbar}>
            <button aria-pressed={reference} onClick={() => setReference(!reference)}>
              {reference ? "색칠로 돌아가기" : "원본 시안 보기"}
            </button>
            <button aria-pressed={moving} onClick={() => setMoving(!moving)}>
              이동 모드
            </button>
            <button
              aria-label="축소"
              disabled={zoom <= 1}
              onClick={() => setZoom(Math.max(1, zoom - 0.5))}
            >
              −
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
              aria-label="확대"
              disabled={zoom >= 6}
              onClick={() => setZoom(Math.min(6, zoom + 0.5))}
            >
              +
            </button>
            <button
              onClick={() => {
                setZoom(1);
                viewport.current?.scrollTo(0, 0);
              }}
            >
              전체 보기
            </button>
          </div>
          <div ref={viewport} className={styles.viewport}>
            <div style={{ width: `${zoom * 100}%` }} className={styles.sheet}>
              {reference && (
                <Image
                  className={styles.reference}
                  src="/coloring-book/garden-color-v1.png"
                  alt="꽃과 유리 온실, 돌다리와 계곡으로 이루어진 정원 풍경 시안"
                  width={1536}
                  height={1024}
                  unoptimized
                />
              )}
              <canvas
                ref={canvas}
                className={styles.canvas}
                style={{
                  display: reference ? "none" : "block",
                  cursor: moving ? "grab" : "crosshair",
                  touchAction: moving ? "none" : "auto",
                }}
                aria-label="색칠할 정원. 색 선택 후 칸을 누르세요. 키보드용 도구는 색칠 도구 아래에 있어요."
                onPointerDown={(event) => {
                  const area = viewport.current;
                  if (!area) return;
                  down.current = {
                    x: event.clientX,
                    y: event.clientY,
                    left: area.scrollLeft,
                    top: area.scrollTop,
                  };
                  if (moving) event.currentTarget.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (moving && down.current && viewport.current) {
                    viewport.current.scrollLeft =
                      down.current.left - event.clientX + down.current.x;
                    viewport.current.scrollTop = down.current.top - event.clientY + down.current.y;
                  }
                }}
                onPointerCancel={() => {
                  down.current = null;
                }}
                onPointerUp={(event) => {
                  const start = down.current;
                  down.current = null;
                  if (
                    !start ||
                    moving ||
                    !map ||
                    Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6
                  )
                    return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  const x = Math.floor(((event.clientX - rect.left) / rect.width) * map.width);
                  const y = Math.floor(((event.clientY - rect.top) / rect.height) * map.height);
                  if (x >= 0 && x < map.width && y >= 0 && y < map.height)
                    paint(map.ids[y * map.width + x]);
                }}
              />
            </div>
          </div>
          <p role="status" className={styles.status}>
            {message}
          </p>
        </section>
      </div>
    </main>
  );
}
