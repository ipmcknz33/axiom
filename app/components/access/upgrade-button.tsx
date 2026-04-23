"use client";

import { useState } from "react";

type UpgradeButtonProps = {
  plan: "premium" | "pro" | "business";
  text?: string;
};

export function UpgradeButton({ plan, text }: UpgradeButtonProps) {
  const [requested, setRequested] = useState(false);

  function onUpgradeClick() {
    setRequested(true);
  }

  return (
    <div>
      <button
        type="button"
        className="upgrade-btn"
        onClick={onUpgradeClick}
        disabled={requested}
      >
        {requested ? "Request queued" : (text ?? `Request ${plan} access`)}
      </button>
      {requested ? (
        <p className="upgrade-error">
          Demo mode: checkout is disabled. Ask an admin for internal access.
        </p>
      ) : null}
    </div>
  );
}
