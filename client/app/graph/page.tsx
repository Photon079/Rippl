import AppShell from "../components/AppShell";

export const metadata = {
  title: "Causal Graph — Rippl",
  description: "FalkorDB-powered causal topology canvas for autonomous enterprise memory",
};

export default function GraphPage() {
  return <AppShell initialScreen="graph" />;
}
