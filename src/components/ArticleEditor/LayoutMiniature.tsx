// 이름을 읽기 전에 구도를 비교하는 편집 전용 도식. 실제 콘텐츠 렌더링과 분리한다.
export function LayoutMiniature({ kind, value: requestedValue }: { kind: string; value: string }) {
  const presets: Record<string, string> = {
    quote: "pull",
    list: "grid",
    compare: "columns",
    qa: "interview",
    callout: "note",
    text: "body",
  };
  const value = requestedValue === kind ? (presets[kind] ?? requestedValue) : requestedValue;
  const lines = (x: number, y: number, w: number, count = 3, step = 7, thickness = 3) =>
    Array.from({ length: count }, (_, i) => (
      <rect
        key={`${x}-${y}-${i}`}
        x={x}
        y={y + i * step}
        width={w * (i === count - 1 ? 0.72 : 1)}
        height={thickness}
        rx={1}
        opacity={0.55}
      />
    ));
  const picture = (x: number, y: number, w: number, h: number) => (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="currentColor" />
      <path
        d={`M${x + 3} ${y + h - 4}l${w * 0.28} -${h * 0.4} ${w * 0.2} ${h * 0.2} ${w * 0.2} -${h * 0.3} ${w * 0.2} ${h * 0.5}`}
        fill="none"
        stroke="currentColor"
      />
      <circle cx={x + w * 0.72} cy={y + h * 0.25} r={2} />
    </g>
  );
  let content;
  if (kind === "align")
    content = [72, 58, 66, 42].map((w, i) => (
      <rect
        key={i}
        x={value === "center" ? (100 - w) / 2 : 10}
        y={14 + i * 10}
        width={w}
        height={3}
        opacity={0.55}
      />
    ));
  else if (kind === "width")
    content = (
      <>
        <rect
          x={value === "reading" ? 27 : value === "wide" ? 16 : 5}
          y={10}
          width={value === "reading" ? 46 : value === "wide" ? 68 : 90}
          height={44}
          fill="none"
          stroke="currentColor"
        />
        {lines(33, 22, 34, 4)}
      </>
    );
  else if (kind.includes("focus"))
    content = (
      <>
        {picture(10, 10, 80, 44)}
        <circle
          cx={value === "left" ? 25 : value === "right" ? 75 : 50}
          cy={32}
          r={8}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        />
      </>
    );
  else if (kind === "image.ratio")
    content = picture(
      value === "portrait" ? 34 : value === "square" ? 26 : 12,
      10,
      value === "portrait" ? 32 : value === "square" ? 44 : 76,
      44,
    );
  else if (kind === "image.crop")
    content = picture(value === "detail" ? 27 : 10, 10, value === "detail" ? 46 : 80, 44);
  else if (kind === "cover")
    content =
      value === "split" || value === "compact" ? (
        <>
          {lines(7, 15, value === "compact" ? 53 : 38, 4)}
          {picture(value === "compact" ? 70 : 53, 10, value === "compact" ? 22 : 40, 44)}
        </>
      ) : value === "image-first" ? (
        <>
          {picture(10, 7, 80, 27)}
          {lines(10, 41, 70, 2)}
        </>
      ) : (
        <>
          {lines(10, 8, 70, 2)}
          {picture(10, 27, 80, 30)}
        </>
      );
  else if (
    kind === "split" ||
    kind === "imageSide" ||
    kind === "proportion" ||
    kind === "verticalAlign"
  ) {
    const right = value === "right";
    content = (
      <>
        {picture(
          right ? 56 : 7,
          10,
          value === "image-wide" ? 50 : value === "text-wide" ? 25 : 37,
          44,
        )}
        {lines(
          right ? 7 : value === "image-wide" ? 64 : value === "text-wide" ? 42 : 53,
          value === "start" ? 10 : 23,
          value === "image-wide" ? 29 : value === "text-wide" ? 50 : 38,
          4,
        )}
      </>
    );
  } else if (kind === "image") content = picture(10, 8, 80, 48);
  else if (kind === "heading")
    content = (
      <>
        <rect x={10} y={16} width={65} height={9} />
        {lines(10, 36, 80, 2)}
      </>
    );
  else if (kind === "text")
    content =
      value === "columns" ? (
        <>
          {lines(8, 11, 37, 6)}
          {lines(55, 11, 37, 6)}
        </>
      ) : value === "dropcap" ? (
        <>
          <text x={8} y={36} fontSize={30} fontFamily="serif">
            A
          </text>
          {lines(35, 14, 56, 4)}
          {lines(8, 45, 83, 2)}
        </>
      ) : (
        <>
          {lines(
            10,
            value === "lead" ? 13 : 15,
            value === "small" ? 62 : 80,
            value === "lead" ? 3 : 5,
            value === "lead" ? 13 : value === "small" ? 5 : 7,
            value === "lead" ? 6 : value === "small" ? 2 : 3,
          )}
        </>
      );
  else if (kind === "quote")
    content = (
      <>
        {value === "pull" && (
          <text x={6} y={34} fontSize={35}>
            “
          </text>
        )}
        {value === "rule" && <path d="M10 9h80M10 55h80" stroke="currentColor" />}
        {value === "margin" && <path d="M40 10v44" stroke="currentColor" />}
        {lines(
          value === "margin" ? 49 : value === "pull" ? 29 : 14,
          21,
          value === "margin" ? 40 : value === "pull" ? 60 : 72,
          3,
          value === "statement" ? 11 : 8,
        )}
      </>
    );
  else if (kind === "compare")
    content =
      value === "stack" || value === "table" ? (
        <>
          <path d="M8 10h84M8 32h84M8 54h84" stroke="currentColor" />
          {lines(10, 17, value === "table" ? 22 : 70, 1)}
          {lines(10, 40, value === "table" ? 22 : 70, 1)}
          {value === "table" && (
            <>
              {lines(42, 17, 47, 1)}
              {lines(42, 40, 47, 1)}
            </>
          )}
        </>
      ) : (
        <>
          <rect x={7} y={9} width={39} height={46} fill="none" stroke="currentColor" />
          <rect x={54} y={9} width={39} height={46} opacity={value === "contrast" ? 0.85 : 0.12} />
          {lines(13, 20, 27, 4)}
          <g fill={value === "contrast" ? "var(--surface)" : "currentColor"}>
            {lines(60, 20, 27, 4)}
          </g>
        </>
      );
  else if (kind === "list")
    content =
      value === "grid" || value === "steps" ? (
        Array.from({ length: value === "steps" ? 3 : 4 }, (_, i) => (
          <g key={i}>
            <rect
              x={8 + (i % (value === "steps" ? 3 : 2)) * (value === "steps" ? 29 : 46)}
              y={9 + (value === "steps" ? 0 : Math.floor(i / 2) * 26)}
              width={value === "steps" ? 24 : 37}
              height={value === "steps" ? 44 : 19}
              fill="none"
              stroke="currentColor"
            />
          </g>
        ))
      ) : (
        <>
          {value === "timeline" && <path d="M15 9v45" stroke="currentColor" />}
          {[13, 29, 45].map((y) => (
            <g key={y}>
              <rect
                x={10}
                y={y}
                width={value === "checklist" ? 8 : 4}
                height={value === "checklist" ? 8 : 4}
                fill={value === "checklist" ? "none" : "currentColor"}
                stroke="currentColor"
              />
              {lines(26, y, 64, 1)}
            </g>
          ))}
        </>
      );
  else if (kind === "qa")
    content =
      value === "columns" ? (
        <>
          {lines(8, 12, 26, 2)}
          {lines(43, 12, 48, 5)}
        </>
      ) : (
        <>
          {value === "ruled" && <path d="M8 8h84M8 36h84" stroke="currentColor" />}
          <text x={8} y={24} fontSize={12}>
            Q
          </text>
          {lines(25, 16, 66, 1)}
          <text x={8} y={47} fontSize={12}>
            A
          </text>
          {lines(25, 40, 66, 2)}
        </>
      );
  else if (kind === "callout")
    content = (
      <>
        {value === "aside" ? (
          <path d="M12 9v46" stroke="currentColor" strokeWidth={3} />
        ) : value === "band" ? (
          <path d="M8 10h84M8 54h84" stroke="currentColor" />
        ) : (
          <rect x={8} y={9} width={84} height={46} fill="none" stroke="currentColor" />
        )}
        {lines(22, 23, 57, 3)}
      </>
    );
  else content = lines(10, 15, 80, 5);
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 100 64" fill="currentColor">
      {content}
    </svg>
  );
}
