import { Bookmark } from "lucide-react";
import { FeaturePlaceholder } from "@/components/feature-placeholder";
export default function SavedPage() {
  return <FeaturePlaceholder eyebrow="Your library" title="Keep the issues you care about close." description="Save consultations you want to revisit and follow their discussion over time." icon={Bookmark} detail="Saved items will be associated with your verified account on the server. This prototype does not store user content." />;
}
