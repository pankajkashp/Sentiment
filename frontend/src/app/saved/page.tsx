import { Bookmark } from "lucide-react";
import { FeaturePlaceholder } from "@/components/feature-placeholder";

export default function SavedPage() {
  return (
    <FeaturePlaceholder
      eyebrow="Saved Schemes & Notices"
      title="Keep Key Welfare Programmes Close."
      description="Bookmark critical policy announcements, eligibility criteria, and application guidelines to revisit them anytime."
      icon={Bookmark}
      detail="Saved schemes are linked to your verified account. Real-time notifications on scheme amendments will be available with the notification service."
      cta="Back to Portal Home"
      href="/"
    />
  );
}
