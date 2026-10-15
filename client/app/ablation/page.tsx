import AppShell from "../components/AppShell";

export const metadata = {
  title: "Ablation Lab — Empirical Benchmarks",
  description: "FalkorDB GraphBLAS vs Flat Vector RAG live evaluation metrics",
};

export default function AblationPage() {
  return <AppShell initialScreen="ablation" />;
}
