import { History } from "lucide-react";
import { FeaturePlaceholder } from "@/components/feature-placeholder";
export default function HistoryPage() {
  return <FeaturePlaceholder eyebrow="Your activity" title="A clear record of your participation." description="Review the comments you have posted, reactions you have made and policy discussions you have followed." icon={History} detail="Activity history will only be visible to the signed-in account. The backend will enforce access control and the ten-minute comment edit/delete window." />;
}
