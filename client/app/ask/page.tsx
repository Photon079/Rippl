import AppShell from "../components/AppShell";

export const metadata = {
  title: "Ask Rippl — Decision Provenance",
  description: "Natural language queries backed by raw inspectable Cypher queries and execution trails",
};

export default function AskPage() {
  return <AppShell initialScreen="ask" />;
}
