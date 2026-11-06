import { Checkbox, Loader } from "@mantine/core";
import clsx from "clsx";
import {
  API_KEY_PERMISSION_TONE_CLASS,
  getApiKeyPermissionMeta,
  type ApiKeyPermissionGroup,
} from "@/src/lib/api-key-permissions";

type ApiKeyPermissionPickerProps = {
  groups: ApiKeyPermissionGroup[];
  selected: string[];
  onToggle: (permissionId: string) => void;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

export function ApiKeyPermissionPicker({
  groups,
  selected,
  onToggle,
  isLoading = false,
  isError = false,
  onRetry,
}: ApiKeyPermissionPickerProps) {
  if (isLoading) {
    return (
      <div className="flex min-h-32 flex-col gap-3 rounded-xl border border-white/[0.07] bg-white/[0.015] p-5">
        <div className="flex items-center gap-3 text-sm text-white/50">
          <Loader size="sm" color="blue" />
          Loading available permissions…
        </div>
        <div className="grid gap-2.5">
          {[0, 1, 2].map((row) => (
            <div
              key={row}
              className="h-16 animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.025]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-error-1/25 bg-error-1/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-error-1">
          Unable to load the available API key permissions.
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="shrink-0 rounded-lg border border-error-1/40 px-3 py-2 text-xs font-semibold text-error-1 transition-colors hover:bg-error-1/10"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] p-5 text-center">
        <p className="text-xs leading-5 text-white/45">
          No API key permissions are currently available. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => {
        const selectedCount = group.permissionIds.filter((id) => selected.includes(id)).length;

        return (
          <div key={group.key} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white/60">
                  {group.title}
                </h3>
                <p className="mt-1 text-xs leading-5 text-white/35">{group.description}</p>
              </div>
              <span className="shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold tabular-nums text-white/40">
                {selectedCount}/{group.permissionIds.length}
              </span>
            </div>

            <div className="grid gap-2.5">
              {group.permissionIds.map((permissionId) => {
                const permission = getApiKeyPermissionMeta(permissionId);
                const isSelected = selected.includes(permissionId);
                const PermissionIcon = permission.icon;

                return (
                  <label
                    key={permissionId}
                    className={clsx(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors sm:gap-4 sm:p-4",
                      isSelected
                        ? "border-primary/40 bg-primary/[0.07]"
                        : "border-white/[0.07] bg-white/[0.015] hover:border-white/[0.14] hover:bg-white/[0.03]"
                    )}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggle(permissionId)}
                      color="blue"
                      size="sm"
                      aria-label={`${permission.label} permission`}
                      className="mt-0.5"
                    />
                    <span
                      className={clsx(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border",
                        isSelected
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-white/[0.07] bg-white/[0.03] text-white/45"
                      )}
                    >
                      <PermissionIcon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-white/90">
                          {permission.label}
                        </span>
                        <span
                          className={clsx(
                            "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            permission.sensitive
                              ? API_KEY_PERMISSION_TONE_CLASS.warning
                              : "bg-white/[0.05] text-white/40"
                          )}
                        >
                          {permission.sensitive ? "Sensitive" : "Standard"}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-white/45">
                        {permission.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
