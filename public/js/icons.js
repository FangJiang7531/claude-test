// 国风节点图标：码头牌楼 / 官厂仓廒 / 飞檐机场 / 工坊分拣 / 驿站铁路 / 锦囊包裹 / 骑手 / 手机
// 所有图标绘制在 48×48 的格子里，以 currentColor 为墨色
export const ICON_SYMBOLS = `
<symbol id="ic-port" viewBox="0 0 48 48">
  <path d="M6 14 Q24 6 42 14" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  <path d="M10 18 H38" stroke="currentColor" stroke-width="2.4"/>
  <path d="M13 14 V40 M35 14 V40 M24 11 V18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
  <rect x="18" y="19" width="12" height="6" fill="currentColor" opacity=".85"/>
  <path d="M4 42 Q12 38 20 42 T36 42 T48 42" fill="none" stroke="currentColor" stroke-width="2"/>
</symbol>
<symbol id="ic-depot" viewBox="0 0 48 48">
  <path d="M3 20 Q14 18 24 8 Q34 18 45 20 Q38 19 36 22 H12 Q10 19 3 20Z" fill="currentColor"/>
  <rect x="9" y="22" width="30" height="18" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <path d="M9 28 H39 M9 34 H39" stroke="currentColor" stroke-width="1.4" opacity=".7"/>
  <rect x="20" y="28" width="8" height="12" fill="currentColor"/>
  <path d="M4 42 H44" stroke="currentColor" stroke-width="2.4"/>
</symbol>
<symbol id="ic-airport" viewBox="0 0 48 48">
  <path d="M2 22 Q12 22 18 14 H30 Q36 22 46 22 Q40 24 37 26 H11 Q8 24 2 22Z" fill="currentColor"/>
  <path d="M8 13 Q16 13 20 8 H28 Q32 13 40 13" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <rect x="12" y="26" width="24" height="14" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <path d="M17 33 L31 33 M24 28 L26 33 L24 38" stroke="currentColor" stroke-width="2" fill="none"/>
  <path d="M4 42 H44" stroke="currentColor" stroke-width="2.4"/>
</symbol>
<symbol id="ic-hub" viewBox="0 0 48 48">
  <path d="M5 18 L24 8 L43 18" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>
  <rect x="9" y="18" width="30" height="22" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <circle cx="24" cy="29" r="6" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <path d="M24 21 V23 M24 35 V37 M16 29 H18 M30 29 H32" stroke="currentColor" stroke-width="2.4"/>
  <path d="M4 42 H44" stroke="currentColor" stroke-width="2.4"/>
</symbol>
<symbol id="ic-rail" viewBox="0 0 48 48">
  <path d="M8 16 Q24 10 40 16" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <rect x="10" y="18" width="28" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <path d="M14 23 H22 M26 23 H34" stroke="currentColor" stroke-width="2.4"/>
  <circle cx="17" cy="37" r="3" fill="currentColor"/><circle cx="31" cy="37" r="3" fill="currentColor"/>
  <path d="M4 42 H44 M10 45 H38" stroke="currentColor" stroke-width="1.8"/>
</symbol>
<symbol id="ic-city" viewBox="0 0 48 48">
  <path d="M6 40 V22 L14 16 L22 22 V40 M22 40 V12 L30 6 L38 12 V40" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <path d="M4 40 H44" stroke="currentColor" stroke-width="2.4"/>
</symbol>
<symbol id="ic-bag" viewBox="0 0 48 48">
  <path d="M17 12 Q24 16 31 12 L29 17 Q40 24 37 36 Q34 43 24 43 Q14 43 11 36 Q8 24 19 17Z" fill="currentColor"/>
  <path d="M15 17 Q24 21 33 17" fill="none" stroke="#C9A14A" stroke-width="2.4"/>
  <path d="M20 9 Q24 4 28 9" fill="none" stroke="currentColor" stroke-width="2.4"/>
  <path d="M18 29 Q24 25 30 29 Q24 33 18 29Z" fill="none" stroke="#C9A14A" stroke-width="1.6"/>
</symbol>
<symbol id="ic-rider" viewBox="0 0 48 48">
  <circle cx="12" cy="36" r="6" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <circle cx="37" cy="36" r="6" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <path d="M12 36 L20 24 H31 L37 36 M31 24 L29 14 H24" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <rect x="6" y="18" width="12" height="9" fill="currentColor"/>
</symbol>
<symbol id="ic-phone" viewBox="0 0 48 48">
  <rect x="14" y="5" width="20" height="38" rx="4" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <path d="M20 10 H28" stroke="currentColor" stroke-width="2"/>
  <path d="M19 22 L23 27 L30 18" fill="none" stroke="currentColor" stroke-width="2.6"/>
  <circle cx="24" cy="38" r="1.8" fill="currentColor"/>
</symbol>
<symbol id="ic-ship" viewBox="0 0 48 48">
  <path d="M4 30 Q24 40 44 28 L40 36 Q24 44 8 36Z" fill="currentColor"/>
  <path d="M14 30 V10 M24 31 V6 M34 30 V12" stroke="currentColor" stroke-width="2"/>
  <path d="M15 11 Q22 16 15 24 M25 7 Q33 14 25 24 M35 13 Q41 18 35 25" fill="currentColor" opacity=".5"/>
</symbol>
`;

export const icon = (id, cls = "") =>
  `<svg class="ic ${cls}" viewBox="0 0 48 48" aria-hidden="true"><use href="#ic-${id}"/></svg>`;
