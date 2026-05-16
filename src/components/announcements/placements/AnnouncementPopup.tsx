import { useEffect, useRef, useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import {

  type Announcement,

  type Placement,

  dismiss as dismissStored,

  recordImpression,

  useTriggerReady,

  track,

} from "@/lib/announcements";

import { usePlacementAnnouncements, useAnnouncementCtx } from "../AnnouncementProvider";

import { AnnouncementPopupContent } from "../content/AnnouncementPopupContent";

import VisitingDoctorRenderer from "../renderers/VisitingDoctorRenderer";

import ErrorBoundary from "@/components/ErrorBoundary";



const placement: Placement = "popup";



function PopupItem({ announcement: a }: { announcement: Announcement }) {

  const ready = useTriggerReady(a, placement);

  const { dismissLocal, device } = useAnnouncementCtx();

  const [open, setOpen] = useState(ready);

  const [impressionRecorded, setImpressionRecorded] = useState(false);

  const hasOpenedRef = useRef(false);



  useEffect(() => {

    if (ready) setOpen(true);

  }, [ready]);



  useEffect(() => {

    if (!open || !ready || impressionRecorded) return;

    setImpressionRecorded(true);

    recordImpression(a, placement);

    track("impression", a, placement, { device });

  }, [open, ready, impressionRecorded, a, device]);



  useEffect(() => {

    if (open) hasOpenedRef.current = true;

  }, [open]);



  const handleDismiss = (silent = false) => {

    setOpen(false);

    dismissStored(a, placement);

    dismissLocal(a.id, a.version, placement);

    if (!silent) track("dismiss", a, placement, { device });

  };



  const onDialogOpenChange = (next: boolean) => {

    setOpen(next);

    if (!next && hasOpenedRef.current) {

      handleDismiss(true);

    }

  };



  if (!ready) return null;



  if (a.type === "visiting_doctor") {

    return (

      <VisitingDoctorRenderer

        announcement={a}

        open={open}

        onOpenChange={onDialogOpenChange}

        onCta={(which) => track(which === "primary" ? "cta_primary" : "cta_secondary", a, placement, { device })}

      />

    );

  }



  return (

    <Dialog open={open} onOpenChange={onDialogOpenChange}>

      <DialogContent className="max-w-lg p-0 overflow-hidden">

        <DialogTitle className="sr-only">{a.title}</DialogTitle>

        <AnnouncementPopupContent

          announcement={a}

          onCta={(which) => track(which === "primary" ? "cta_primary" : "cta_secondary", a, placement, { device })}

          onPrimaryAction={() => handleDismiss(true)}

        />

      </DialogContent>

    </Dialog>

  );

}



export function AnnouncementPopup() {

  const items = usePlacementAnnouncements(placement);

  const first = items[0];

  if (!first) return null;

  return (

    <ErrorBoundary>

      <PopupItem key={`${first.id}:${first.version}`} announcement={first} />

    </ErrorBoundary>

  );

}



export default AnnouncementPopup;


