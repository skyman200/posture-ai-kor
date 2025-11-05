import { computeSideMetrics } from "../computeSideMetrics";

const W = 1080;

const sampleLeft = {
  tragus:   {x: 710, y: 360}, // 전방-상방
  c7:       {x: 560, y: 360}, // 같은 높이
  acromion: {x: 580, y: 420},
  hip:      {x: 550, y: 700},
  knee:     {x: 560, y: 980},
  ankle:    {x: 565, y: 1200},
  asis:     {x: 560, y: 780},
  psis:     {x: 520, y: 760},
};

test("CVA should be acute (~65° range) not >90°", () => {
  const out = computeSideMetrics(sampleLeft as any, W);
  expect(out.CVA).toBeGreaterThan(50);
  expect(out.CVA).toBeLessThan(80);
});

test("PTA sign mapping (+ anterior tilt when ASIS lower than PSIS)", () => {
  const out = computeSideMetrics(sampleLeft as any, W);
  expect(out.PTA).toBeGreaterThan(0); // 전방경사(+)
});

