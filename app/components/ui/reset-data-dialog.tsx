"use client";

import { useEffect, useRef } from "react";

type ResetDataDialogProps = {
  finalConfirmation: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ResetDataDialog({
  finalConfirmation,
  onCancel,
  onConfirm,
}: ResetDataDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [finalConfirmation, onCancel]);

  const title = finalConfirmation ? "你真的确定吗？" : "是否清空数据？";

  return (
    <div
      className="reset-data-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-data-title"
    >
      <div className="reset-data-dialog">
        <span className="reset-data-kicker">DATA RESET</span>
        <h2 id="reset-data-title">{title}</h2>
        <p>
          {finalConfirmation
            ? "确认后将无法恢复排行和主页面的所有选择。"
            : "这将清空排行以及主页面保存的用户选择。"}
        </p>
        <div className="reset-data-actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="reset-data-no"
            onClick={onCancel}
          >
            否
          </button>
          <button
            type="button"
            className="reset-data-yes"
            onClick={onConfirm}
          >
            是
          </button>
        </div>
      </div>
    </div>
  );
}
