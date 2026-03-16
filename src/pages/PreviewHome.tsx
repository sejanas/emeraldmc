import { Suspense, lazy } from "react";
import Index from "./pages/Index";

const PreviewHome = () => {
  return (
    <div>
      <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground text-center py-2 text-sm font-medium">
        🔍 Preview Mode — This is how the homepage will look. Changes are not published yet.
      </div>
      <div className="pt-10">
        <Index />
      </div>
    </div>
  );
};

export default PreviewHome;
