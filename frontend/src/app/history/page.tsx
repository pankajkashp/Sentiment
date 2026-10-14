import { History } from "lucide-react";
import { FeaturePlaceholder } from "@/components/feature-placeholder";

export default function HistoryPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Your Activity History"
      title="Track Policy Notices & Consultations."
      description="Review the verified government policy releases, notifications, and gazette updates you have accessed."
      icon={History}
      detail="Activity history is stored securely per citizen profile. Account verification and encrypted session history will be available upon backend integration."
      cta="Back to Portal Home"
      href="/"
    />
  );
}
