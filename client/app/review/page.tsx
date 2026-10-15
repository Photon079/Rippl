import AppShell from "../components/AppShell";

export const metadata = {
  title: "Review Queue — Rippl",
  description: "Human-in-the-loop forensic audit trails and verifiable hash receipts",
};

export default function ReviewPage() {
  return <AppShell initialScreen="review" />;
}
