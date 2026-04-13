"use client";

import { trpc } from "@/app/_trpc/client";
import Error from "@/components/Error";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { BuildProcedure } from "@trpc/server";

export default function AdminHome() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("");
  const [initialEnabled, setInitialEnabled] = useState(false);
  const [initialMessage, setInitialMessage] = useState("");
  const [error, setError] = useState<TRPCClientErrorLike<BuildProcedure<"mutation", any, any>> | null>(null);

  const getAnnouncement = trpc.getAdminAnnouncementSettings.useMutation({
    onSuccess: (data) => {
      setEnabled(data.enabled);
      setMessage(data.message);
      setInitialEnabled(data.enabled);
      setInitialMessage(data.message);
      setError(null);
    },
    onError: (err) => {
      setError(err);
    },
  });

  const updateAnnouncement = trpc.updateAdminAnnouncementSettings.useMutation({
    onSuccess: (data) => {
      setEnabled(data.enabled);
      setMessage(data.message);
      setInitialEnabled(data.enabled);
      setInitialMessage(data.message);
      toast.success("Announcement updated");
      setError(null);
    },
    onError: (err) => {
      toast.error(err.message);
      setError(err);
    },
  });

  useEffect(() => {
    getAnnouncement.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasChanges = enabled !== initialEnabled || message !== initialMessage;

  const handleSave = async () => {
    await updateAnnouncement.mutateAsync({
      enabled,
      message,
    });
  };

  if (getAnnouncement.isLoading) {
    return <p>Loading announcement settings...</p>;
  }

  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold">Homepage message</h2>
        <p className="text-sm text-muted-foreground">This message appears globally under the navbar.</p>
      </div>

      <div className="rounded-lg border border-border p-4 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <Label htmlFor="announcement-enabled">Enabled</Label>
            <p className="text-sm text-muted-foreground">Toggle the global message on or off.</p>
          </div>
          <Switch
            id="announcement-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="announcement-message">Message</Label>
          <Textarea
            id="announcement-message"
            maxLength={500}
            placeholder="Write a short global message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">{message.length}/500</p>
        </div>

        <Button onClick={handleSave} disabled={!hasChanges || updateAnnouncement.isLoading}>
          {updateAnnouncement.isLoading ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
