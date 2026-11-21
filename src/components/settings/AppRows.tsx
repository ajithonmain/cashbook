import { useEffect, useState } from "react";
import {
  APP_VERSION,
  applyUpdate,
  checkForUpdates,
  isIOS,
  promptInstall,
  readStorage,
  requestPersistence,
  usePwa,
  type StorageInfo,
  type UpdateStatus,
} from "../../lib/pwa";
import { showToast } from "../../lib/toast";
import { PillButton, Row } from "../ui/ListGroup";
import Sheet from "../ui/Sheet";

const STATUS_SUB: Partial<Record<UpdateStatus, string>> = {
  checking: "Checking...",
  latest: "You are up to date",
  available: "Update available",
  offline: "You are offline",
  error: "Could not check",
};

export function InstallRow() {
  const { installed, installEvent } = usePwa();
  const [help, setHelp] = useState(false);

  if (installed) return <Row title="Install" sub="Installed on this device" />;

  if (installEvent) {
    return (
      <Row
        title="Install"
        sub="Add CashBook to your home screen"
        right={
          <PillButton
            onClick={() =>
              void promptInstall().then((o) => o === "accepted" && showToast("CashBook installed", { variant: "success" }))
            }
          >
            Install
          </PillButton>
        }
      />
    );
  }

  if (isIOS()) {
    return (
      <>
        <Row title="Install" sub="Tap Share, then Add to Home Screen" right={<PillButton onClick={() => setHelp(true)}>How</PillButton>} />
        {help && (
          <Sheet onClose={() => setHelp(false)}>
            <div className="px-5 pb-6 pt-1">
              <h2 className="mb-3 text-base font-bold text-fg">Install on iPhone or iPad</h2>
              <ol className="list-decimal space-y-2 pl-5 text-[15px] text-fg">
                <li>Open this page in Safari</li>
                <li>Tap the Share button</li>
                <li>Choose Add to Home Screen, then Add</li>
              </ol>
            </div>
          </Sheet>
        )}
      </>
    );
  }

  return <Row title="Install" sub="Use your browser menu and choose Install app" />;
}

export function UpdateRow() {
  const { status, needRefresh } = usePwa();
  const [applying, setApplying] = useState(false);

  return (
    <Row
      title={`Version ${APP_VERSION}`}
      sub={needRefresh ? STATUS_SUB.available : STATUS_SUB[status]}
      right={
        needRefresh ? (
          <PillButton
            solid
            disabled={applying}
            onClick={() => {
              setApplying(true);
              void applyUpdate();
            }}
          >
            {applying ? "Updating..." : "Update now"}
          </PillButton>
        ) : (
          <PillButton disabled={status === "checking"} onClick={() => void checkForUpdates()}>
            Check for updates
          </PillButton>
        )
      }
    />
  );
}

function formatBytes(n: number): string {
  if (n < 1024 * 1024) return `${Math.max(1, Math.round(n / 1024))} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function StorageRow() {
  const [info, setInfo] = useState<StorageInfo | null>(null);

  useEffect(() => {
    void readStorage().then(setInfo);
  }, []);

  if (!info || (info.usage === null && info.persisted === null)) return null;

  return (
    <Row
      title="Storage"
      sub={info.usage !== null ? `${formatBytes(info.usage)} on this device` : undefined}
      right={
        info.persisted ? (
          <span className="flex-none text-sm text-fg-muted">Protected</span>
        ) : (
          <PillButton
            onClick={() =>
              void requestPersistence().then(async (granted) => {
                setInfo(await readStorage());
                showToast(granted ? "Data protected from automatic clearing" : "Your browser did not allow it", {
                  variant: granted ? "success" : "default",
                });
              })
            }
          >
            Protect
          </PillButton>
        )
      }
    />
  );
}
