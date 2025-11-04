import React from "react";

const Section = ({ title, data }) => (
  <div className="card" style={{ flex: 1, minWidth: 280 }}>
    <h4 style={{marginTop:0}}>{title}</h4>
    <p><b>상태:</b> {data.상태}</p>
    {data.타이트?.length ? <p>• <span className="tight">타이트</span>: {data.타이트.join(", ")}</p> : null}
    {data.약화?.length ? <p>• <span className="weak">약화</span>: {data.약화.join(", ")}</p> : null}
    {data.추천?.length ? <p>• 추천: {data.추천.join(", ")}</p> : null}
  </div>
);

export default function MusclePanel({ analysis }) {
  if (!analysis) return null;
  return (
    <div className="row" style={{ marginTop: 12 }}>
      <Section title="머리/경추" data={analysis.head || {상태:"-",타이트:[],약화:[],추천:[]}} />
      <Section title="몸통/골반" data={analysis.trunk || {상태:"-",타이트:[],약화:[],추천:[]}} />
      <Section title="무릎/하지" data={analysis.knee || {상태:"-",타이트:[],약화:[],추천:[]}} />
    </div>
  );
}

