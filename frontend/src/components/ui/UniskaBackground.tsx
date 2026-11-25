import { useEffect, useId, useRef } from "react";
import type { CSSProperties } from "react";

/**
 * Latar animasi UNISKA sebagai overlay di bawah viewport — Fase 1 (LandingPage).
 *
 * Visualnya ditranskrip dari `uniska-preview.html` (file di root repo, hanya
 * acuan visual — tidak diimpor dan tidak di-commit): matahari di atas viewport,
 * dua awan, gedung kiri + gedung kanan, menara UNISKA, bendera, gerbang,
 * pagar, pohon, jalan (rect hitam) dan mobil.
 *
 * Parallax lewat ref: pointermove menulis CSS variable --uniska-x/--uniska-y
 * ke root SVG, throttle dengan requestAnimationFrame, effect cleanup
 * removeEventListener + cancelAnimationFrame. Hanya aktif jika
 * (hover: hover) and (pointer: fine) dan !prefers-reduced-motion.
 */

// Factor paralaks per lapisan — setiap <g class="uniska-layer"> ditulis nilai
// --d sendiri sehingga sudutnya ditemukan sendiri dari var() di index.css.
function layerStyle(d: number): CSSProperties {
  // CSSProperties pada @types/react 19 tidak punya indeks untuk custom
  // property --*, jadi isi sebagai CSSProperties (React juga mengerti --d).
  return { "--d": d } as CSSProperties;
}

function UniskaBackground({ className = "" }: { className?: string }) {
  const patternId = useId().replace(/:/g, "");
  const rootRef = useRef<SVGSVGElement>(null);
  const xRef = useRef(0);
  const yRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    // Layar sentuh dan preferensi reduced-motion tidak mendapat parallax —
    // biasanya karena teks di atas gedung perlu stabil, bukan melek mata.
    const canParallax =
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canParallax) {
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      // Normalisasi ke [-1, 1]: senter dari dalam viewport jadi nol.
      xRef.current = (event.clientX / window.innerWidth - 0.5) * 2;
      yRef.current = (event.clientY / window.innerHeight - 0.5) * 2;
      if (!frameRef.current) {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = 0;
          root.style.setProperty("--uniska-x", xRef.current.toFixed(3));
          root.style.setProperty("--uniska-y", yRef.current.toFixed(3));
        });
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div aria-hidden="true" className={`uniska-bg${className ? ` ${className}` : ""}`}>
      <svg
        ref={rootRef}
        viewBox="0 0 1600 640"
        preserveAspectRatio="xMidYMax slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id={`${patternId}-lat`}
            width={30}
            height={30}
            patternUnits="userSpaceOnUse"
          >
            <rect width={30} height={30} fill="#ecebe6" />
            <path
              d="M15 2 L28 15 L15 28 L2 15 Z"
              fill="none"
              stroke="#9a9688"
              strokeWidth="1.2"
            />
            <circle cx={15} cy={15} r={3} fill="#9a9688" />
          </pattern>
          <pattern
            id={`${patternId}-chk`}
            width={80}
            height={80}
            patternUnits="userSpaceOnUse"
            x={610}
            y={170}
          >
            <rect width={80} height={80} fill="#f7c81e" />
            <rect width={40} height={40} fill="#5b2a4a" />
            <rect x={40} y={40} width={40} height={40} fill="#5b2a4a" />
          </pattern>
        </defs>

        {/* Matahari di atas viewport */}
        <g className="uniska-layer" style={layerStyle(-10)}>
          <circle cx={1380} cy={190} r={64} fill="#fcd34d" opacity={0.25} />
          <circle cx={1380} cy={190} r={46} fill="#fcd34d" />
        </g>

        {/* Dua awan */}
        <g className="uniska-layer" style={layerStyle(-18)}>
          <g
            className="uniska-cloud"
            style={{ animationDuration: "70s" }}
          >
            <ellipse cx={0} cy={120} rx={70} ry={22} fill="#fff" opacity={0.9} />
            <ellipse cx={-30} cy={108} rx={40} ry={20} fill="#fff" opacity={0.9} />
            <ellipse cx={35} cy={106} rx={34} ry={18} fill="#fff" opacity={0.9} />
          </g>
          <g
            className="uniska-cloud"
            style={{ animationDuration: "95s", animationDelay: "-40s" }}
          >
            <ellipse cx={0} cy={210} rx={90} ry={26} fill="#fff" opacity={0.75} />
            <ellipse cx={-34} cy={196} rx={46} ry={22} fill="#fff" opacity={0.75} />
          </g>
        </g>

        {/* Gedung kiri + kanan, menara, bendera, gerbang, pagar */}
        <g className="uniska-layer" style={layerStyle(-6)}>
          {/* Sayap kiri */}
          <rect
            x={150}
            y={270}
            width={460}
            height={270}
            fill={`url(#${patternId}-lat)`}
            stroke="#8a8678"
            strokeWidth={2}
          />
          <rect x={140} y={262} width={480} height={14} fill="#8a8678" />

          {/* Sayap kanan */}
          <rect
            x={880}
            y={240}
            width={720}
            height={300}
            fill={`url(#${patternId}-lat)`}
            stroke="#8a8678"
            strokeWidth={2}
          />
          <rect x={870} y={232} width={730} height={14} fill="#8a8678" />

          {/* Menara UNISKA */}
          <rect
            x={610}
            y={170}
            width={270}
            height={370}
            fill={`url(#${patternId}-chk)`}
            stroke="#a6830a"
            strokeWidth={2}
          />
          <rect x={590} y={160} width={310} height={14} fill="#7c2d3d" />
          <path d="M630 160 L700 60 H840 L862 160 Z" fill="#a33a48" stroke="#6e1f2b" strokeWidth={2} />
          <path d="M700 60 L690 40 H840 V60 Z" fill="#6e1f2b" />
          <rect x={652} y={200} width={188} height={44} rx={6} fill="#f7c81e" />
          <text
            x={746}
            y={233}
            textAnchor="middle"
            fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
            fontWeight={800}
            fontSize={30}
            textLength={160}
            lengthAdjust="spacing"
            fill="#fff"
            stroke="#8a6d00"
            strokeWidth={1.2}
            paintOrder="stroke"
          >
            UNISKA
          </text>

          {/* Penampakan bawah menara */}
          <path d="M690 540 V470 Q745 420 800 470 V540 Z" fill="#3b2230" />

          {/* Bendera */}
          <rect x={563} y={150} width={4} height={120} fill="#94a3b8" />
          <g className="uniska-flag">
            <path d="M567 152 H622 V190 H567 Z" fill="#e53935" />
            <path d="M567 171 H622 V190 H567 Z" fill="#fff" />
          </g>

          {/* Gerbang dengan huruf UNISKA */}
          <rect x={232} y={450} width={200} height={90} fill="#2e9e4f" />
          <rect x={250} y={470} width={164} height={70} fill="#243b2d" />
          <rect x={226} y={444} width={212} height={12} fill="#1f7a3b" />
          <text
            x={332}
            y={436}
            textAnchor="middle"
            fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
            fontWeight={800}
            fontSize={50}
            textLength={190}
            lengthAdjust="spacing"
          >
            <tspan fill="#e53935">U</tspan>
            <tspan fill="#2e9e4f">N</tspan>
            <tspan fill="#3949ab">I</tspan>
            <tspan fill="#ffd54a" stroke="#c9a200" strokeWidth={1}>
              S
            </tspan>
            <tspan fill="#fff" stroke="#999" strokeWidth={1}>
              K
            </tspan>
            <tspan fill="#ff7043">A</tspan>
          </text>

          {/* Pagar */}
          <rect x={930} y={506} width={670} height={8} fill="#a8452f" />
          <rect x={930} y={526} width={670} height={8} fill="#a8452f" />
          <path
            d="M950 500V540M1010 500V540M1070 500V540M1130 500V540M1190 500V540M1250 500V540M1310 500V540M1370 500V540M1430 500V540M1490 500V540M1550 500V540"
            stroke="#a8452f"
            strokeWidth={5}
          />
          <rect x={896} y={480} width={44} height={60} fill="#2e9e4f" />
          <rect x={890} y={474} width={56} height={10} fill="#1f7a3b" />
        </g>

        {/* Pohon */}
        <g className="uniska-layer" style={layerStyle(10)}>
          <g className="uniska-tree max-sm:[animation:none]">
            <path
              d="M950 505 C930 440 980 400 1030 410 C1050 355 1130 345 1160 400 C1220 380 1285 400 1272 452 C1325 442 1372 472 1342 508 Z"
              fill="#43a047"
            />
            <circle cx={1040} cy={455} r={30} fill="#66bb6a" />
            <circle cx={1160} cy={440} r={34} fill="#66bb6a" />
            <circle cx={1260} cy={478} r={22} fill="#66bb6a" />
          </g>
          <g className="uniska-tree max-sm:[animation:none]" style={{ animationDelay: "-1.5s" }}>
            <path
              d="M1372 505 C1362 442 1422 412 1472 432 C1512 402 1582 422 1582 472 C1602 492 1592 508 1582 508 Z"
              fill="#388e3c"
            />
            <circle cx={1470} cy={470} r={28} fill="#5fb865" />
          </g>
          <g className="uniska-tree max-sm:[animation:none]" style={{ animationDelay: "-3s" }}>
            <rect x={505} y={440} width={10} height={100} fill="#6d4c41" />
            <path
              d="M470 405 C448 370 500 338 532 360 C562 338 604 372 582 405 C562 425 490 430 470 405 Z"
              fill="#4caf50"
            />
          </g>
          <g className="uniska-tree max-sm:[animation:none]" style={{ animationDelay: "-4s" }}>
            <rect x={55} y={430} width={10} height={110} fill="#6d4c41" />
            <path
              d="M20 432 C0 392 50 362 80 382 C110 367 140 402 120 432 C100 452 40 452 20 432 Z"
              fill="#4caf50"
            />
          </g>
        </g>

        {/* Jalan hitam lebar + baris putih */}
        <rect y={540} width={1600} height={100} fill="#7b8794" />
        <rect y={540} width={1600} height={6} fill="#4a9d5b" />
        <path
          d="M0 592 H1600"
          stroke="#fff"
          strokeWidth={3}
          strokeDasharray="40 30"
          opacity={0.6}
        />

        {/* Mobil — max-sm:hidden: di bawah 640px mobil dibunyikan */}
        <g className="uniska-layer" style={layerStyle(10)}>
          <g className="uniska-car max-sm:hidden">
            <path
              d="M0 576V562Q0 552 12 552H98Q110 552 110 562V576Z"
              fill="#6366f1"
            />
            <path
              d="M24 553L37 533Q39 530 43 530H75Q79 530 82 533L94 553Z"
              fill="#4f46e5"
            />
            <path d="M31 551L41 535H55V551ZM59 551V535H73L83 551Z" fill="#c7d2fe" />
            <rect x={101} y={557} width={7} height={5} rx={2} fill="#fde68a" />
            <rect x={2} y={557} width={6} height={5} rx={2} fill="#f87171" />
            <circle cx={26} cy={576} r={10} fill="#1e293b" />
            <circle cx={26} cy={576} r={4} fill="#cbd5e1" />
            <circle cx={86} cy={576} r={10} fill="#1e293b" />
            <circle cx={86} cy={576} r={4} fill="#cbd5e1" />
          </g>
        </g>
      </svg>
    </div>
  );
}

export default UniskaBackground;
